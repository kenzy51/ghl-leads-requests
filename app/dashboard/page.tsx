"use client";

import { useState, useEffect } from "react";
import useSWRInfinite from "swr/infinite";
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

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (!isAuthenticated) return null;

    // If we reached the end of GHL data on the previous call, stop.
    if (pageIndex > 0 && (!previousPageData || !previousPageData.after)) return null;

    // First page
    if (pageIndex === 0) return `/api/leads?limit=20`;

    // Subsequent pages: Add the 'after' cursor to the API call
    return `/api/leads?limit=20&after=${previousPageData.after}`;
  };

  const { data, size, setSize, error, isLoading } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    persistSize: true
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const leads: LeadType[] = data
    ? data.flatMap((page) => page.contacts || []).filter(Boolean)
    : [];

  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  // Logic fix: We only reach the end if the LAST page of data doesn't have an 'after' cursor
  const isReachingEnd = data && data.length > 0 && !data[data.length - 1]?.after;

  if (!mounted) return null;
  if (!isAuthenticated) return <div className="p-8 font-light">Access Denied.</div>;
  if (error) return <div className="p-8 text-red-500 uppercase tracking-widest text-xs">Sync Error: Check GHL API Key</div>;

  return (
    <div className="p-8 bg-white min-h-screen text-black">
      <div className="flex justify-between items-end mb-10 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter uppercase text-gray-900">
            Tribeca Leads
          </h1>
          <p className="text-[10px] text-gray-400 font-bold tracking-[3px] uppercase">
            AI Automation Monitoring
          </p>
        </div>
        <div className="text-right">
          <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full border border-blue-100 uppercase tracking-widest">
            {leads.length} Contacts Synced
          </span>
        </div>
      </div>

      <div className="overflow-hidden border border-gray-100 rounded-2xl shadow-sm bg-white">
        <div className="overflow-x-auto max-h-[65vh]">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">
                <th className="px-6 py-4 text-left">Name</th>
                <th className="px-6 py-4 text-left">Contact Info</th>
                <th className="px-6 py-4 text-left">Acquisition Date</th>
                <th className="px-6 py-4 text-left">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {lead.firstName || "N/A"} {lead.lastName || ""}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span className="font-light">{lead.email}</span>
                        <span className="text-[10px] font-mono text-gray-300">{lead.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-xs text-gray-400 font-light">
                      {lead.dateAdded ? new Date(lead.dateAdded).toLocaleDateString() : "Pending"}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500 rounded">
                        {lead.source || "Direct"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-300 text-xs uppercase tracking-widest">
                    {isLoading ? "Fetching Live Data..." : "No Leads Found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Action */}
      <div className="mt-12 flex flex-col items-center gap-4">
        {!isReachingEnd ? (
          <button
            onClick={() => setSize(size + 1)}
            disabled={isLoadingMore}
            className={`
        group relative flex items-center justify-center gap-3
        px-12 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-[3px] 
        rounded-full transition-all duration-300 shadow-2xl
        hover:bg-zinc-800 active:scale-95 disabled:bg-zinc-200 disabled:cursor-not-allowed
        ${isLoadingMore ? "pr-14" : ""}
      `}
          >
            {isLoadingMore ? (
              <>
                <span>Syncing Batch...</span>
                <div className="absolute right-6">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </>
            ) : (
              "Fetch Next 20 Leads"
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 px-6 py-2 bg-gray-50 rounded-full border border-gray-100">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              All Leads Synced
            </span>
          </div>
        )}

        <p className="text-[9px] text-gray-400 uppercase tracking-[2px] font-medium">
          {isReachingEnd
            ? `Database Complete • ${leads.length} Total`
            : `Page ${size} • ${leads.length} Leads Loaded`
          }
        </p>
      </div>
    </div>
  );
}