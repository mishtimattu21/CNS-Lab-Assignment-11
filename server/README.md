# SecureChat SSL WebSocket server

Node serves **HTTPS** and upgrades connections to **WSS** (TLS WebSockets). Messages are validated with the Supabase JWT, written to Postgres with the **service role** key, and broadcast to everyone in the same group room.

## Setup

1. Copy `.env.example` to `.env` and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (never commit the service role key).

2. Generate a self-signed certificate for local development (no OpenSSL required):

```bash
npm run generate-certs --prefix server
```

Or from the repo root: `npm run generate-certs`

This writes `server.key` and `server.crt` into `server/certs/`.

Alternatively, with OpenSSL: `openssl req -x509 -newkey rsa:2048 -keyout server.key -out server.crt -days 365 -nodes -subj "/CN=localhost"` in `server/certs/`.

3. Install and run:

```bash
npm install
npm run dev
```

The server listens on `PORT` (default **3001**). Open `https://localhost:3001` once in the browser and accept the certificate warning so `wss://localhost:3001` works from the React app.

4. In the project root `.env`, set:

`VITE_WS_URL=wss://localhost:3001`

## Production

Use real certificates (e.g. from your CA or Let’s Encrypt) and point `SSL_KEY_PATH` / `SSL_CERT_PATH` at those files.
