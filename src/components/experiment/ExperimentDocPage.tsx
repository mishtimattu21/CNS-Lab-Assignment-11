import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ExperimentAppHeader } from './ExperimentAppHeader';
import { Button } from '@/components/ui/button';

type Props = {
  title: string;
  children: React.ReactNode;
};

export function ExperimentDocPage({ title, children }: Props) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <ExperimentAppHeader />
      <div className="px-4 pt-4 max-w-3xl mx-auto w-full">
        <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to groups
          </Link>
        </Button>
        <article className="pb-12">
          <h1 className="text-2xl font-bold text-foreground mb-6">{title}</h1>
          <div className="space-y-4 text-sm sm:text-base text-foreground/90 leading-relaxed">{children}</div>
        </article>
      </div>
    </div>
  );
}
