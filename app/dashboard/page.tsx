'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const [mounted, setMounted] = useState<any | boolean>(false);
  
  const { data: leads, error } = useSWR('/api/leads', fetcher, {
    refreshInterval: 10000, 
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Don't render anything on the server
  if (error) return <div className="p-8 text-red-500">Failed to load leads.</div>;
  if (!leads) return <div className="p-8 text-black">Syncing leads...</div>;

  return (
    <div className="p-8 bg-white min-h-screen text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tribeca Dental Studio Leads</h1>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
          {leads.length} Total Leads
        </span>
      </div>
      
      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead: any) => (
              <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {lead.firstName} {lead.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{lead.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {/* We use a string fallback to prevent date mismatch errors */}
                  {lead.dateAdded ? new Date(lead.dateAdded).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}