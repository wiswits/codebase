import { Construction } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';

export default function ComingSoon({ title }) {
  return (
    <div>
      <PageHeader title={title} subtitle="This module is scaffolded and scheduled for the next build pass" />
      <Card className="p-16 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
          <Construction size={28} className="text-primary-500" />
        </div>
        <h3 className="font-semibold text-slate-700 mb-1">{title} is coming next</h3>
        <p className="text-sm text-slate-400 max-w-sm">
          The database models, routes and layout for this module are already in place. Full UI and
          business logic will be built in the next pass.
        </p>
      </Card>
    </div>
  );
}
