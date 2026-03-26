import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.join(__dirname, '../../.env');
const serverEnv = path.join(__dirname, '../.env');
dotenv.config({ path: rootEnv });
dotenv.config({ path: serverEnv });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
/** Anon/publishable key — required for auth.getUser(jwt); service role alone can mis-validate user JWTs. */
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const PORT = Number(process.env.PORT) || 3001;
const SSL_KEY_PATH = process.env.SSL_KEY_PATH || path.join(__dirname, '../certs/server.key');
const SSL_CERT_PATH = process.env.SSL_CERT_PATH || path.join(__dirname, '../certs/server.crt');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase credentials for the WSS server.\n');
  if (!SUPABASE_URL) {
    console.error('  • Set VITE_SUPABASE_URL or SUPABASE_URL in the project root .env');
  }
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('  • Set SUPABASE_SERVICE_ROLE_KEY in the project root .env (or server/.env)');
    console.error('    Get it from: Supabase Dashboard → Project Settings → API → service_role (secret)');
    console.error('    Do not use the anon/publishable key; do not commit this value.');
  }
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const supabaseAuth = SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : supabase;

type ClientMeta = {
  ws: WebSocket;
  userId: string;
  username: string;
  groupCode: string | null;
};

const rooms = new Map<string, Set<ClientMeta>>();

function roomPresence(groupCode: string): { username: string; online_at: string }[] {
  const room = rooms.get(groupCode);
  if (!room) return [];
  return [...room].map((c) => ({
    username: c.username,
    online_at: new Date().toISOString(),
  }));
}

function sendJson(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

function broadcastRoom(groupCode: string, payload: unknown, skip?: ClientMeta) {
  const room = rooms.get(groupCode);
  if (!room) return;
  const raw = JSON.stringify(payload);
  for (const meta of room) {
    if (skip && meta === skip) continue;
    if (meta.ws.readyState === WebSocket.OPEN) meta.ws.send(raw);
  }
}

function broadcastRoomAll(groupCode: string, payload: unknown) {
  broadcastRoom(groupCode, payload, undefined);
}

function leaveRoom(meta: ClientMeta) {
  const code = meta.groupCode;
  if (!code) return;
  const room = rooms.get(code);
  if (!room) return;
  room.delete(meta);
  if (room.size === 0) rooms.delete(code);
  else {
    broadcastRoomAll(code, {
      type: 'presence',
      users: roomPresence(code),
    });
    broadcastRoomAll(code, {
      type: 'system',
      message: {
        id: randomUUID(),
        username: 'system',
        content: `${meta.username} left the chat`,
        timestamp: new Date().toISOString(),
        type: 'system',
      },
    });
  }
  meta.groupCode = null;
}

function joinRoom(meta: ClientMeta, groupCode: string) {
  const normalized = groupCode.trim().toUpperCase();
  if (meta.groupCode === normalized) return;
  if (meta.groupCode) leaveRoom(meta);
  let room = rooms.get(normalized);
  if (!room) {
    room = new Set();
    rooms.set(normalized, room);
  }
  room.add(meta);
  meta.groupCode = normalized;
  broadcastRoomAll(normalized, {
    type: 'presence',
    users: roomPresence(normalized),
  });
  broadcastRoomAll(normalized, {
    type: 'system',
    message: {
      id: randomUUID(),
      username: 'system',
      content: `${meta.username} joined the chat`,
      timestamp: new Date().toISOString(),
      type: 'system',
    },
  });
}

let key: Buffer;
let cert: Buffer;
try {
  key = fs.readFileSync(SSL_KEY_PATH);
  cert = fs.readFileSync(SSL_CERT_PATH);
} catch {
  console.error(
    `TLS files not found.\n  Expected key: ${SSL_KEY_PATH}\n  Expected cert: ${SSL_CERT_PATH}\n` +
      'Generate with: openssl req -x509 -newkey rsa:2048 -keyout server.key -out server.crt -days 365 -nodes -subj "/CN=localhost"\n' +
      'Place files in server/certs/ (see server/README.md).'
  );
  process.exit(1);
}

const server = https.createServer({ key, cert }, (_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('SecureChat SSL WebSocket server (HTTPS probe OK)\n');
});

const wss = new WebSocketServer({ server });

function rawToBuffer(raw: unknown): Buffer {
  if (Buffer.isBuffer(raw)) return raw;
  if (Array.isArray(raw)) return Buffer.concat(raw);
  if (raw instanceof ArrayBuffer) return Buffer.from(raw);
  return Buffer.from(raw as ArrayBuffer);
}

async function handleSocketMessage(meta: ClientMeta, raw: Buffer) {
  const ws = meta.ws;
  const { userId, username } = meta;
    let parsed: { type?: string; groupCode?: string; content?: string };
    try {
      parsed = JSON.parse(raw.toString()) as typeof parsed;
    } catch {
      sendJson(ws, { type: 'error', message: 'Invalid JSON' });
      return;
    }

    const t = parsed.type;
    if (t === 'join' && typeof parsed.groupCode === 'string') {
      const code = parsed.groupCode.trim().toUpperCase();
      const { data: group, error: gErr } = await supabase
        .from('groups')
        .select('id')
        .eq('code', code)
        .maybeSingle();
      if (gErr || !group) {
        sendJson(ws, { type: 'error', message: 'Group not found' });
        return;
      }
      const { data: member } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', group.id)
        .eq('user_id', userId)
        .maybeSingle();
      if (!member) {
        sendJson(ws, { type: 'error', message: 'Join this group in the app before connecting' });
        return;
      }
      joinRoom(meta, code);
      sendJson(ws, { type: 'joined', groupCode: code, users: roomPresence(code) });
      return;
    }

    if (t === 'message' && typeof parsed.content === 'string') {
      if (!meta.groupCode) {
        sendJson(ws, { type: 'error', message: 'Join a group first' });
        return;
      }
      const text = parsed.content.trim();
      if (!text) return;

      const { data: group } = await supabase
        .from('groups')
        .select('id')
        .eq('code', meta.groupCode)
        .maybeSingle();
      if (!group) {
        sendJson(ws, { type: 'error', message: 'Group not found' });
        return;
      }

      const { data: inserted, error: insErr } = await supabase
        .from('messages')
        .insert({
          group_id: group.id,
          user_id: userId,
          username,
          content: text,
        })
        .select('id, content, created_at')
        .single();

      if (insErr || !inserted) {
        sendJson(ws, { type: 'error', message: insErr?.message || 'Failed to save message' });
        return;
      }

      const out = {
        type: 'message' as const,
        message: {
          id: inserted.id as string,
          username,
          content: inserted.content as string,
          timestamp: (inserted.created_at as string) || new Date().toISOString(),
          type: 'message' as const,
        },
      };
      broadcastRoomAll(meta.groupCode, out);
      return;
    }

    if (t === 'typing') {
      if (!meta.groupCode) return;
      broadcastRoom(meta.groupCode, { type: 'typing', username }, meta);
    }
  }

wss.on('connection', (ws, req) => {
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `https://${host}`);
  const token = url.searchParams.get('token');
  if (!token) {
    sendJson(ws, { type: 'error', message: 'Missing token' });
    ws.close();
    return;
  }

  const pending: Buffer[] = [];
  let meta: ClientMeta | null = null;

  ws.on('close', () => {
    if (meta) leaveRoom(meta);
  });

  ws.on('message', (raw) => {
    const buf = rawToBuffer(raw);
    if (!meta) {
      pending.push(buf);
      return;
    }
    void handleSocketMessage(meta, buf);
  });

  void (async () => {
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(token);
    if (userErr || !userData.user) {
      sendJson(ws, { type: 'error', message: 'Invalid session' });
      ws.close();
      return;
    }

    const userId = userData.user.id;

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .maybeSingle();

    if (profErr || !profile?.username) {
      sendJson(ws, { type: 'error', message: 'Username not set' });
      ws.close();
      return;
    }

    const username = profile.username as string;

    meta = { ws, userId, username, groupCode: null };

    for (const buf of pending) {
      await handleSocketMessage(meta, buf);
    }
    pending.length = 0;
  })();
});

server.listen(PORT, () => {
  console.log(`HTTPS + WSS listening on port ${PORT} (TLS)`);
});
