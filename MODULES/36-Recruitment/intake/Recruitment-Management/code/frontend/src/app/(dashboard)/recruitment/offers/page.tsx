'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, FileText } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/shared/Button';
import { Card, CardContent } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Input } from '@/components/shared/Input';
import { Select } from '@/components/shared/Select';
import { DataStates } from '@/components/shared/DataStates';
import { offerService } from '@/services/offer.service';
import { OFFER_STATUSES, OFFER_STATUS_COLORS } from '@/utils/constants';
import { format } from 'date-fns';

export default function OffersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['offers', search, statusFilter],
    queryFn: () =>
      offerService.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 100,
      }),
  });

  const offers = data?.items || [];

  return (
    <div>
      <PageHeader
        title="Offers"
        description="Manage offer letters"
        actions={
          <Link href="/recruitment/offers/create">
            <Button variant="gold">
              <Plus size={18} className="mr-2" />
              Create Offer
            </Button>
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by candidate or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-[180px]">
          <Select
            options={[
              { value: '', label: 'All Statuses' },
              ...OFFER_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Apply Filters
        </Button>
      </div>

      <DataStates
        isLoading={isLoading}
        error={error}
        isEmpty={offers.length === 0}
        emptyMessage="No offers created"
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-4">
          {offers.map((offer) => (
            <Link key={offer.id} href={`/recruitment/offers/${offer.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-navy">
                          {offer.applicantName || `Offer ${offer.offerReference}`}
                        </h3>
                        <Badge
                          className={OFFER_STATUS_COLORS[offer.status as keyof typeof OFFER_STATUS_COLORS] || ''}
                        >
                          {offer.status}
                        </Badge>
                        <Badge variant="info">{offer.designation}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                        <span>📋 {offer.offerReference}</span>
                        <span>💼 {offer.jobTitle}</span>
                        <span>💰 ₹{offer.salary.toLocaleString()}</span>
                        <span>📅 {format(new Date(offer.offerDate), 'MMM d, yyyy')}</span>
                        {offer.joiningDate && (
                          <span>📆 Joining: {format(new Date(offer.joiningDate), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </DataStates>
    </div>
  );
}