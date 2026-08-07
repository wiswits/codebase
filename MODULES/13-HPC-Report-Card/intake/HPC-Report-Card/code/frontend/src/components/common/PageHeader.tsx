import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-playfair text-2xl font-semibold text-navy">{title}</h1>
        <div className="mt-2 mb-2.5 h-[3px] w-10 rounded-full bg-gold" />
        {description && <p className="text-sm text-navy/60">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
