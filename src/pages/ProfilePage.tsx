import { ExperimentDocPage } from '@/components/experiment/ExperimentDocPage';

const ProfilePage = () => (
  <ExperimentDocPage title="Profile (student)">
    <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
      <dl className="grid gap-3 sm:grid-cols-[140px_1fr] sm:gap-x-4 text-sm">
        <dt className="text-muted-foreground font-medium">Name</dt>
        <dd className="text-foreground font-semibold">Mishti Mattu</dd>

        <dt className="text-muted-foreground font-medium">Roll / ID</dt>
        <dd className="text-foreground font-mono">23BCE1067</dd>

        <dt className="text-muted-foreground font-medium">Course / paper</dt>
        <dd className="text-foreground">Computer Networks &amp; Security (CNS)</dd>

        <dt className="text-muted-foreground font-medium">Experiment</dt>
        <dd className="text-foreground">Experiment 11 — SSL socket communication (client &amp; server)</dd>

        <dt className="text-muted-foreground font-medium">Project</dt>
        <dd className="text-foreground">SecureChat — hybrid WSS + Supabase-backed group messaging</dd>
      </dl>
    </div>

    <p className="text-xs text-muted-foreground pt-4">
      App profile (chat username) is separate from this page and is managed under your account after sign-in.
    </p>
  </ExperimentDocPage>
);

export default ProfilePage;
