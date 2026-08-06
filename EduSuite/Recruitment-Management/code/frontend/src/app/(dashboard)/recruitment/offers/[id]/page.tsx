'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Edit, FileText, Calendar, User, Mail, Phone, Briefcase, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/shared/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/Card';
import { Badge } from '@/components/shared/Badge';
import { Select } from '@/components/shared/Select';
import { DataStates } from '@/components/shared/DataStates';
import { offerService } from '@/services/offer.service';
import { OFFER_STATUS_COLORS, OFFER_STATUSES } from '@/utils/constants';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function OfferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = parseInt(params.id as string);

  const { data: offer, isLoading, error, refetch } = useQuery({
    queryKey: ['offer', id],
    queryFn: () => offerService.getById(id),
    enabled: !isNaN(id),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, acceptedOn }: { status: string; acceptedOn?: string }) =>
      offerService.updateStatus(id, status, acceptedOn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer', id] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast.success('Offer status updated');
    },
  });

  if (isNaN(id)) {
    return <div>Invalid offer ID</div>;
  }

  return (
    <div>
      <PageHeader
        title="Offer Details"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
        
              <Button variant="primary">
                <Edit size={18} className="mr-2" />
                Edit
              </Button>
            
          </div>
        }
      />

      <DataStates isLoading={isLoading} error={error} onRetry={refetch}>
        {offer && (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-navy">
                      {offer.applicantName || 'Offer'}
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge
                        className={OFFER_STATUS_COLORS[offer.status as keyof typeof OFFER_STATUS_COLORS] || ''}
                      >
                        {offer.status}
                      </Badge>
                      <Badge variant="info">{offer.designation}</Badge>
                      <Badge>{offer.employmentType}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Reference</p>
                    <p className="font-semibold">{offer.offerReference}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Update Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Update Status:</span>
                  <Select
                    options={OFFER_STATUSES.map((s) => ({ value: s, label: s }))}
                    value={offer.status}
                    onChange={(e) => {
                      const status = e.target.value;
                      if (status === 'Accepted') {
                        const acceptedOn = prompt('Enter acceptance date (YYYY-MM-DD):', 
                          new Date().toISOString().split('T')[0]);
                        updateStatusMutation.mutate({ 
                          status, 
                          acceptedOn: acceptedOn || undefined 
                        });
                      } else {
                        updateStatusMutation.mutate({ status });
                      }
                    }}
                    className="w-45"
                    disabled={updateStatusMutation.isPending}
                  />
                  {updateStatusMutation.isPending && (
                    <span className="text-sm text-gray-500">Updating...</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Offer Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} className="text-gray-400" />
                    <span>Offer Date: {format(new Date(offer.offerDate), 'MMM d, yyyy')}</span>
                  </div>
                  {offer.joiningDate && (
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-gray-400" />
                      <span>Joining Date: {format(new Date(offer.joiningDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {offer.acceptedOn && (
                    <div className="flex items-center gap-3">
                      <Calendar size={18} className="text-gray-400" />
                      <span>Accepted On: {format(new Date(offer.acceptedOn), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Briefcase size={18} className="text-gray-400" />
                    <span>{offer.designation} - {offer.department || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign size={18} className="text-gray-400" />
                    <span>₹{offer.salary.toLocaleString()} / year</span>
                  </div>
                  {offer.bonus && (
                    <div className="flex items-center gap-3">
                      <DollarSign size={18} className="text-gray-400" />
                      <span>Bonus: ₹{offer.bonus.toLocaleString()}</span>
                    </div>
                  )}
                  {offer.probationMonths && (
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">Probation: {offer.probationMonths} months</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Applicant Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-gray-400" />
                    <Link href={`/recruitment/applicants/${offer.applicantId}`}>
                      <span className="font-medium text-navy hover:text-gold">
                        {offer.applicantName}
                      </span>
                    </Link>
                  </div>
                  {offer.applicantEmail && (
                    <div className="flex items-center gap-3">
                      <Mail size={18} className="text-gray-400" />
                      <a href={`mailto:${offer.applicantEmail}`} className="text-navy hover:text-gold">
                        {offer.applicantEmail}
                      </a>
                    </div>
                  )}
                  {offer.applicantPhone && (
                    <div className="flex items-center gap-3">
                      <Phone size={18} className="text-gray-400" />
                      <a href={`tel:${offer.applicantPhone}`} className="text-navy hover:text-gold">
                        {offer.applicantPhone}
                      </a>
                    </div>
                  )}
                  {offer.jobTitle && (
                    <div className="flex items-center gap-3">
                      <Briefcase size={18} className="text-gray-400" />
                      <span>{offer.jobTitle}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Work Details */}
            <Card>
              <CardHeader>
                <CardTitle>Work Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Employment Type</p>
                    <p className="font-medium">{offer.employmentType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Work Mode</p>
                    <p className="font-medium">{offer.workMode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Work Location</p>
                    <p className="font-medium">{offer.workLocation || 'N/A'}</p>
                  </div>
                </div>
                {offer.reportingManager && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">Reporting Manager</p>
                    <p className="font-medium">{offer.reportingManager}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {offer.offerDocument && (
              <Card>
                <CardHeader>
                  <CardTitle>Offer Document</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={offer.offerDocument}
                    target="_blank"
                    className="flex items-center gap-2 text-navy hover:text-gold"
                  >
                    <FileText size={18} />
                    Download Offer Letter
                  </a>
                </CardContent>
              </Card>
            )}

            {offer.remarks && (
              <Card>
                <CardHeader>
                  <CardTitle>Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{offer.remarks}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DataStates>
    </div>
  );
}