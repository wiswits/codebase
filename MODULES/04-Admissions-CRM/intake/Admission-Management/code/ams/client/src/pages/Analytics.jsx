import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download } from 'lucide-react';
import { analyticsService } from '../services/domainServices';
import { Card, LoadingBlock, EmptyState } from '../components/common/UI';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#64748b'];

const Analytics = () => {
  const qc = useQueryClient();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [costInputs, setCostInputs] = useState({});

  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: ['analytics-funnel', from, to],
    queryFn: () => analyticsService.funnel({ from: from || undefined, to: to || undefined }),
  });
  const { data: roiData, isLoading: roiLoading } = useQuery({ queryKey: ['analytics-roi'], queryFn: () => analyticsService.sourceRoi() });

  const stages = funnelData?.data?.stages || [];
  const conversion = funnelData?.data?.conversion || {};
  const sourceRoi = roiData?.data?.sourceRoi || [];

  const saveCost = async (source) => {
    const cost = Number(costInputs[source]);
    if (Number.isNaN(cost)) return;
    try {
      await analyticsService.setSourceCost({ source, cost });
      toast.success('Cost updated');
      qc.invalidateQueries({ queryKey: ['analytics-roi'] });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Reports &amp; Analytics</h1>
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-2" />
          <span className="text-gray-400">to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-gray-200 rounded-lg px-2.5 py-2" />
          <button className="flex items-center gap-1.5 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
            <Download size={15} /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card title="Funnel Analytics" className="lg:col-span-2">
          {funnelLoading ? (
            <LoadingBlock />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stages} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="stage" width={140} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {stages.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Conversion Summary">
          <div className="space-y-2 text-sm">
            <ConversionRow label="Enquiry → Application" value={conversion.enquiryToApplication} />
            <ConversionRow label="Documents → Test" value={conversion.docsToTest} />
            <ConversionRow label="Test → Interview" value={conversion.testToInterview} />
            <ConversionRow label="Interview → Offer" value={conversion.interviewToOffer} />
            <ConversionRow label="Offer → Admission" value={conversion.offerToAdmission} />
            <div className="border-t border-gray-100 pt-2 mt-2">
              <ConversionRow label="Overall Conversion" value={conversion.overall} bold />
            </div>
          </div>
        </Card>
      </div>

      <Card title="Source ROI">
        {roiLoading ? (
          <LoadingBlock />
        ) : sourceRoi.length === 0 ? (
          <EmptyState label="No application data yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3">Applications</th>
                  <th className="py-2 pr-3">Admits</th>
                  <th className="py-2 pr-3">Cost (₹)</th>
                  <th className="py-2 pr-3">Cost / Admission</th>
                </tr>
              </thead>
              <tbody>
                {sourceRoi.map((row) => (
                  <tr key={row.source} className="border-b border-gray-50">
                    <td className="py-2.5 pr-3 font-medium text-gray-700">{row.source}</td>
                    <td className="py-2.5 pr-3">{row.applications}</td>
                    <td className="py-2.5 pr-3">{row.admits}</td>
                    <td className="py-2.5 pr-3">
                      <input
                        type="number"
                        defaultValue={row.cost}
                        onChange={(e) => setCostInputs({ ...costInputs, [row.source]: e.target.value })}
                        onBlur={() => saveCost(row.source)}
                        className="w-24 border border-gray-200 rounded-lg px-2 py-1"
                      />
                    </td>
                    <td className="py-2.5 pr-3">{row.costPerAdmission ? `₹${row.costPerAdmission.toLocaleString('en-IN')}` : '-'}</td>
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

const ConversionRow = ({ label, value, bold }) => (
  <div className="flex items-center justify-between">
    <span className={bold ? 'font-semibold text-gray-800' : 'text-gray-500'}>{label}</span>
    <span className={bold ? 'font-bold text-blue-600' : 'font-medium text-gray-700'}>{value ?? 0}%</span>
  </div>
);

export default Analytics;
