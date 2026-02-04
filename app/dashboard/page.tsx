'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CustomField {
  id: string;
  value: string;
}

interface LeadType {
  email: string;
  id: string; 
  firstName: string;
  lastName: string;
  phone: string;
  dateAdded: string;
  source: string;
  customFields?: CustomField[];
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState<boolean>(false);
  
  const { data: leads, error } = useSWR('/api/leads', fetcher, {
    refreshInterval: 10000, 
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; 
  if (error) return <div className="p-8 text-red-500">Failed to load leads.</div>;
  if (!leads) return <div className="p-8 text-black font-medium">Syncing live from GHL...</div>;

  return (
    <div className="p-8 bg-white min-h-screen text-black">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tribeca Dental Studio</h1>
          <p className="text-sm text-gray-500 font-medium">AI Automation Monitoring</p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
          {leads.length} Active Leads
        </span>
      </div>
      
      <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Source</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">IS CALLED BY AI AGENT</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead: LeadType) => {
              const isCalled = lead.customFields?.some(
                (field) => field.value === 'Called' || field.value === 'AI agent called'
              );

              return (
                <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {lead.firstName || 'Unknown'} {lead.lastName || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex flex-col">
                      <span>{lead.email}</span>
                      <span className="text-xs font-mono text-gray-400">{lead.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span suppressHydrationWarning>
                      {lead.dateAdded ? new Date(lead.dateAdded).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-tight bg-gray-100 text-gray-600 rounded">
                      {lead.source || 'Direct'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {isCalled ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                        <span className="w-2 h-2 mr-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        AI Agent Called
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}