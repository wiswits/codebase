import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { EmptyState } from '@/components/common/EmptyState';
import { HolisticPreview as HolisticPreviewType } from '@/lib/types';
import { formatDateTime } from '@/lib/utils/formatters';

type Props = {
  preview?: HolisticPreviewType;
};

export function HolisticPreview({ preview }: Props) {
  const competencies = Array.isArray(preview?.competencies)
    ? preview.competencies
    : [];

  const progress = preview?.progress ?? {
    completed: 0,
    total: 0,
  };

  const grouped = new Map<string, typeof competencies>();

  for (const row of competencies) {
    const key = row.domain_name || 'General';

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)!.push(row);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex items-center gap-6">
          <div className="flex-1">
            <p className="text-xs text-navy/50">
              Overall completion
            </p>

            <p className="mt-1 text-2xl font-semibold text-navy tabular-nums">
              {progress.completed} / {progress.total}
            </p>
          </div>

          <div className="flex-1">
            <Progress
              value={progress.completed}
              max={progress.total}
              showLabel
            />
          </div>
        </CardContent>
      </Card>

      {competencies.length === 0 ? (
        <EmptyState
          title="Nothing to preview"
          message="No competencies found for this organization."
        />
      ) : (
        Array.from(grouped.entries()).map(([domainName, rows]) => (
          <Card key={domainName}>
            <CardContent>
              <h3 className="mb-3 font-playfair text-lg font-semibold text-navy">
                {domainName}
              </h3>

              <div className="flex flex-col divide-y divide-navy/10">
                {rows.map((row, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-navy">
                        {row.competency_name}
                      </p>

                      {row.descriptor_text && (
                        <p className="text-xs text-navy/50">
                          {row.descriptor_text}
                        </p>
                      )}

                      {row.entry_value && (
                        <p className="mt-1 text-sm text-navy/80">
                          <span className="font-medium">
                            {row.entry_value}
                          </span>

                          {row.remarks && (
                            <span className="text-navy/50">
                              {' '}
                              — {row.remarks}
                            </span>
                          )}
                        </p>
                      )}

                      {row.updated_at && (
                        <p className="mt-1 text-[11px] text-navy/30">
                          Updated {formatDateTime(row.updated_at)}
                        </p>
                      )}
                    </div>

                    <StatusBadge status={row.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}