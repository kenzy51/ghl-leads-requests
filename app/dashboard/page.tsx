"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useAuth } from "../context/auth-context";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface LeadType {
  email: string;
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateAdded: string;
  source: string;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();

  const { data: leads, error, isLoading } = useSWR(
    isAuthenticated ? "/api/leads" : null,
    fetcher,
    { revalidateOnFocus: false } 
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (!isAuthenticated) return <div className="p-8">Access Denied. Please log in.</div>;

  return (
    <div className="p-8 bg-white min-h-screen text-black font-sans">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter text-gray-900 uppercase">
            Tribeca Dental Studio
          </h1>
          <p className="text-sm text-gray-500 font-light tracking-widest uppercase">
            AI Lead Automation Panel
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="bg-green-50 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full border border-green-200 uppercase tracking-widest mb-1">
            Live Sync Active
          </span>
          <p className="text-xs text-gray-400">
            {isLoading ? "Fetching..." : `${leads?.length || 0} Total Leads Found`}
          </p>
        </div>
      </div>

      <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm bg-white">
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {["Name", "Contact Details", "Acquisition Date", "Source"].map((head) => (
                  <th key={head} className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-6 bg-gray-50/50"></td>
                  </tr>
                ))
              ) : leads?.length > 0 ? (
                leads.map((lead: LeadType) => (
                  <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {lead.firstName} {lead.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex flex-col">
                        <span className="font-light">{lead.email}</span>
                        <span className="text-[11px] font-mono text-gray-400">{lead.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-light">
                      {lead.dateAdded ? new Date(lead.dateAdded).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500 rounded-md">
                        {lead.source || "Direct"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-400 text-sm italic">
                    No leads found in this location.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}