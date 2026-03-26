import { ExperimentDocPage } from '@/components/experiment/ExperimentDocPage';

const ProofPage = () => (
  <ExperimentDocPage title={'Proof: SSL sockets & motive'}>
    <p className="text-muted-foreground">
      This experiment targets a <strong className="text-foreground">client–server application using SSL socket
      communication</strong>. Below is how you can verify that requirement is met in this project.
    </p>

    <section className="space-y-3 pt-2">
      <h2 className="text-lg font-semibold text-foreground">1. TLS on the Node server (not plain HTTP)</h2>
      <p className="text-muted-foreground">
        The chat server is started with Node&apos;s <code className="text-xs bg-muted px-1 rounded">https.createServer</code>{' '}
        using a private key and certificate (e.g. self-signed for localhost). Serving plain HTTP would not satisfy
        &quot;SSL&quot;; here the transport layer is <strong className="text-foreground">TLS</strong>.
      </p>
    </section>

    <section className="space-y-3 pt-2">
      <h2 className="text-lg font-semibold text-foreground">2. WebSocket over TLS (WSS)</h2>
      <p className="text-muted-foreground">
        The browser does not open a raw TCP socket from JavaScript; it uses the{' '}
        <strong className="text-foreground">WebSocket API</strong>, which upgrades over HTTPS and becomes{' '}
        <strong className="text-foreground">WSS</strong> when the page is served over HTTPS and{' '}
        <code className="text-xs bg-muted px-1 rounded">VITE_WS_URL</code> uses the <code className="text-xs bg-muted px-1 rounded">wss://</code>{' '}
        scheme. In Chrome/Edge/Firefox DevTools → <strong>Network</strong> → filter <strong>WS</strong>: you should see
        the connection to your server, type <strong>wss</strong>, and frames when messages are sent.
      </p>
    </section>

    <section className="space-y-3 pt-2">
      <h2 className="text-lg font-semibold text-foreground">3. Motive alignment (hybrid)</h2>
      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
        <li>
          <strong className="text-foreground">Socket side:</strong> live delivery and presence/typing use the{' '}
          <strong className="text-foreground">SSL WebSocket</strong> path through your Node process.
        </li>
        <li>
          <strong className="text-foreground">Storage side:</strong> messages are persisted in Supabase (HTTPS to the
          database API) so history survives refresh and demonstrates integration with a real backend store.
        </li>
      </ul>
    </section>

    <section className="space-y-3 pt-2">
      <h2 className="text-lg font-semibold text-foreground">4. Quick checklist</h2>
      <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
        <li><code className="text-xs bg-muted px-1 rounded">server/certs/server.key</code> and <code className="text-xs bg-muted px-1 rounded">server.crt</code> exist.</li>
        <li>Server logs show it listening with TLS (e.g. port 3001).</li>
        <li><code className="text-xs bg-muted px-1 rounded">VITE_WS_URL=wss://localhost:3001</code> (or your host) in the Vite env.</li>
        <li>DevTools → Network → WS shows frames when chatting.</li>
      </ul>
    </section>
  </ExperimentDocPage>
);

export default ProofPage;
