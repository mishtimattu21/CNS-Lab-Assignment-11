import { ExperimentDocPage } from '@/components/experiment/ExperimentDocPage';

const AboutPage = () => (
  <ExperimentDocPage title={'About: theory & SSL sockets'}>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">What this project is</h2>
      <p className="text-muted-foreground">
        This is a <strong className="text-foreground">secure group chat</strong> experiment for Computer Networks &amp;
        Security (CNS). Users authenticate with email and password, choose a one-time display name, create or join
        groups using a shared code, and exchange messages in real time while a database keeps message history.
      </p>
    </section>

    <section className="space-y-3 pt-2">
      <h2 className="text-lg font-semibold text-foreground">Core motive: SSL socket communication</h2>
      <p className="text-muted-foreground">
        A central learning goal is to implement communication where the channel between client and server is protected
        using <strong className="text-foreground">SSL/TLS</strong>. In practice:
      </p>
      <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
        <li>
          <strong className="text-foreground">Sockets</strong> here mean transport endpoints: the browser uses a{' '}
          <strong className="text-foreground">WebSocket</strong>, which is a full-duplex channel over TCP, suitable for
          low-latency chat and typing indicators.
        </li>
        <li>
          <strong className="text-foreground">SSL</strong> (today TLS) wraps that traffic: the Node server terminates TLS
          with a certificate and key, so bytes on the wire are encrypted and the server is authenticated to the client
          (with caveats for self-signed certs in development).
        </li>
        <li>
          Together, <strong className="text-foreground">WSS</strong> is the WebSocket analogue of HTTPS — same TLS
          handshake and record layer, different application protocol after the upgrade.
        </li>
      </ul>
    </section>

    <section className="space-y-3 pt-2">
      <h2 className="text-lg font-semibold text-foreground">How the app implements it</h2>
      <p className="text-muted-foreground">
        The <strong className="text-foreground">React client</strong> obtains a session from Supabase Auth and passes the
        access token to the <strong className="text-foreground">Node WSS server</strong> on connection. The server validates
        identity, checks group membership in Postgres, appends new messages via the service role, and broadcasts events
        to every connected client in that group. That loop — <strong className="text-foreground">TLS WebSocket + verified
        server logic + durable storage</strong> — is the intended end-to-end story for the experiment.
      </p>
    </section>
  </ExperimentDocPage>
);

export default AboutPage;
