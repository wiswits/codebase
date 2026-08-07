import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import client from "../api/client";

const AVAIL_COLORS = { available: "#10b981", issued: "#2563eb", lost: "#dc2626", damaged: "#d97706" };

export default function Statistics() {
  const [mostIssued, setMostIssued] = useState([]);
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    (async () => {
      const [mi, av] = await Promise.all([
        client.get("/stats/most-issued"),
        client.get("/stats/copy-availability"),
      ]);
      setMostIssued(mi.data.data);
      setAvailability(av.data.data);
    })();
  }, []);

  const availData = availability
    ? Object.entries(availability).filter(([, v]) => v > 0).map(([k, v]) => ({ name: k, value: v }))
    : [];

  return (
    <div className="p-7">
      <h1 className="text-2xl font-bold text-gray-900 m-0">Statistics</h1>
      <p className="text-gray-500 text-sm mt-1">Usage trends and copy availability across the library.</p>

      <div className="grid grid-cols-2 gap-4 mt-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Most issued books</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={mostIssued} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="title" width={140} tick={{ fontSize: 11, fill: "#374151" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="issueCount" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Copy availability</h3>
          <div className="flex items-center gap-6">
            <div style={{ width: 180, height: 180 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={availData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {availData.map((d) => <Cell key={d.name} fill={AVAIL_COLORS[d.name] || "#94a3b8"} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              {availData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-sm mb-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: AVAIL_COLORS[d.name] || "#94a3b8" }} />
                  <span className="capitalize text-gray-700">{d.name}</span>
                  <span className="font-medium text-gray-900">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
