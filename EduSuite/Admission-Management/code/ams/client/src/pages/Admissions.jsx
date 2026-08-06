import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { applicationService } from '../services/applicationService';
import { Card, Badge, LoadingBlock, EmptyState } from '../components/common/UI';

const Admissions = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admissions'],
    queryFn: () => applicationService.list({ status: 'Admitted', limit: 100 }),
  });
  const admissions = data?.data?.applications || [];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-800">Confirmed Admissions</h1>
      <Card title={`${admissions.length} students admitted this session`}>
        {isLoading ? (
          <LoadingBlock />
        ) : admissions.length === 0 ? (
          <EmptyState label="No admissions confirmed yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="py-2 pr-3">App. No.</th>
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">Quota</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((a) => (
                  <tr key={a._id} className="border-b border-gray-50">
                    <td className="py-2.5 pr-3 font-medium text-gray-700">{a.applicationNo}</td>
                    <td className="py-2.5 pr-3">{a.student?.name}</td>
                    <td className="py-2.5 pr-3">{a.student?.classAppliedFor}</td>
                    <td className="py-2.5 pr-3">{a.quotaCategory}</td>
                    <td className="py-2.5 pr-3"><Badge>{a.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Admissions;
