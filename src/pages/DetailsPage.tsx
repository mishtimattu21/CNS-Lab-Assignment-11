import { ExperimentDocPage } from '@/components/experiment/ExperimentDocPage';

const DetailsPage = () => (
  <ExperimentDocPage title="Technical project details">
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Stack</h2>
      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
        <li>
          <strong className="text-foreground">Frontend:</strong> React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
          components.
        </li>
        <li>
          <strong className="text-foreground">Auth &amp; database:</strong> Supabase (PostgreSQL) with email/password
          authentication, row-level security (RLS), and typed client access from the browser.
        </li>
        <li>
          <strong className="text-foreground">Realtime transport:</strong> Node.js server exposing{' '}
          <strong>HTTPS</strong> and <strong>WSS</strong> (WebSocket over TLS) using TLS certificate and key files.
        </li>
        <li>
          <strong className="text-foreground">Persistence:</strong> Chat messages are inserted by the Node server with
          the Supabase <strong>service role</strong> key after validating the user&apos;s JWT; clients load history via
          the public API with RLS so only group members can read.
        </li>
      </ul>
    </section>

    <section className="space-y-3 pt-2">
      <h2 className="text-lg font-semibold text-foreground">Data model (Supabase)</h2>
      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
        <li>
          <code className="text-xs bg-muted px-1 rounded">profiles</code> — user id, optional then fixed username.
        </li>
        <li>
          <code className="text-xs bg-muted px-1 rounded">groups</code> — unique shareable code, name, creator.
        </li>
        <li>
          <code className="text-xs bg-muted px-1 rounded">group_members</code> — who belongs to which group.
        </li>
        <li>
          <code className="text-xs bg-muted px-1 rounded">messages</code> — group id, sender, content, timestamp; no
          direct insert from anonymous/authenticated role (server only).
        </li>
      </ul>
    </section>

    <section className="space-y-3 pt-2">
      <h2 className="text-lg font-semibold text-foreground">Socket server protocol (WSS)</h2>
      <p className="text-muted-foreground">
        Browser opens <code className="text-xs bg-muted px-1 rounded">wss://…?token=&lt;Supabase access token&gt;</code>
        . After connect, client sends <code className="text-xs bg-muted px-1 rounded">join</code> with the group code.
        The server verifies the JWT, confirms membership in Postgres, then accepts{' '}
        <code className="text-xs bg-muted px-1 rounded">message</code> and <code className="text-xs bg-muted px-1 rounded">typing</code>{' '}
        events, writes messages to the database, and broadcasts JSON to all sockets in that group room.
      </p>
    </section>
  </ExperimentDocPage>
);

export default DetailsPage;
