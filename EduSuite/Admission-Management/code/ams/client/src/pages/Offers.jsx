import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { offerService } from '../services/domainServices';
import { Card, Badge, LoadingBlock, EmptyState } from '../components/common/UI';
import { API_BASE_URL } from '../services/api';

const Offers = () => {
  const { data, isLoading } = useQuery({ queryKey: ['offers'], queryFn: () => offerService.list({}) });
  const offers = data?.data?.offers || [];
  const serverOrigin = API_BASE_URL.replace(/\/api$/, '');

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-800">Offer Letters</h1>
      <Card>
        {isLoading ? (
          <LoadingBlock />
        ) : offers.length === 0 ? (
          <EmptyState label="No offers generated yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="py-2 pr-3">Application No.</th>
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Token Amount</th>
                  <th className="py-2 pr-3">Valid Till</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Letter</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((o) => (
                  <tr key={o._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 pr-3 font-medium text-gray-700">{o.application?.applicationNo}</td>
                    <td className="py-2.5 pr-3">{o.application?.student?.name}</td>
                    <td className="py-2.5 pr-3">₹{o.tokenAmount?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 pr-3">{new Date(o.validTill).toLocaleDateString('en-IN')}</td>
                    <td className="py-2.5 pr-3"><Badge>{o.status}</Badge></td>
                    <td className="py-2.5 pr-3">
                      {o.pdfPath && (
                        <a href={`${serverOrigin}${o.pdfPath}`} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1">
                          <Download size={14} /> PDF
                        </a>
                      )}
                    </td>
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

export default Offers;
