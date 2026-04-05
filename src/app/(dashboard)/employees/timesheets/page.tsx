"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { timeClockService } from "@/services/timeClockService";
import { format } from "date-fns";
import {
  Clock,
  ArrowLeft,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";

import { FeatureGuard } from "@/components/auth/FeatureGuard";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-rose-500/10 text-rose-400 border-rose-500/30",
  MANAGER: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  CASHIER: "bg-primary/10 text-primary border-primary/30",
  INVENTORY_MANAGER: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

function RoleBadge({ role }: { role: string }) {
  const cls = ROLE_COLORS[role] ?? "bg-gray-700 text-gray-400 border-gray-600";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
      {role}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
      On Clock
    </span>
  ) : (
    <span className="text-xs font-medium text-gray-400 bg-gray-500/10 border border-gray-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
      Clocked Out
    </span>
  );
}

export default function TimesheetsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");

  const { data: timesheetsData, isLoading } = useQuery({
    queryKey: ["timesheets", page],
    queryFn: () => timeClockService.getAllHistory(page, 50),
  });

  const records = timesheetsData?.content || [];
  
  // Client side filtering for visual ease
  const filteredRecords = records.filter(r => 
    r.userName.toLowerCase().includes(search.toLowerCase()) ||
    r.userRole.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <FeatureGuard
      feature="TIME_CLOCK"
      fallback={
        <div className="flex h-full min-h-[500px] flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="rounded-full bg-red-500/10 p-4 mb-4">
            <Clock className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Feature Not Available</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Employee time management and clock-in/out reports are available in 
            the <strong>Small Business</strong> plan and above.
          </p>
          <Button 
             variant="outline" 
             className="mt-6 border-gray-700"
             onClick={() => router.push('/employees')}
          >
             Back to Employees
          </Button>
        </div>
      }
    >
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/employees')} className="h-9 w-9 border border-gray-800 rounded-lg hover:bg-gray-900 text-gray-400">
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Clock className="text-primary" size={24} /> Timesheets
              </h1>
              <p className="text-sm text-gray-500 mt-1">Review clock-in and clock-out history for all employees</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <Input
                type="text"
                placeholder="Search employee name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-gray-950 border-gray-800 focus-visible:ring-primary rounded-xl h-10 w-full"
              />
            </div>
          </div>
        </div>

        {/* ─── Main Table ─── */}
        <div className="bg-gray-950/50 rounded-2xl border border-gray-900 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-900/50">
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="font-semibold text-gray-300">Employee</TableHead>
                  <TableHead className="font-semibold text-gray-300">Status</TableHead>
                  <TableHead className="font-semibold text-gray-300">Clock In</TableHead>
                  <TableHead className="font-semibold text-gray-300">Clock Out</TableHead>
                  <TableHead className="font-semibold text-gray-300">Duration</TableHead>
                  <TableHead className="font-semibold text-gray-300">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                      <p className="text-sm text-gray-500 mt-2">Loading timesheets...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                      No time records found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} className="border-gray-800/50 hover:bg-gray-900/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {record.userName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-200">{record.userName}</span>
                            <span className="mt-1">
                              {record.userRole.split(',').map(role => (
                                <RoleBadge key={role} role={role.trim()} />
                              ))}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge active={!record.clockOutTime} />
                      </TableCell>
                      <TableCell className="text-sm text-gray-300">
                        {format(new Date(record.clockInTime), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">
                        {record.clockOutTime ? format(new Date(record.clockOutTime), "MMM d, h:mm a") : '—'}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-300">
                        {record.durationMinutes !== null 
                          ? `${Math.floor(record.durationMinutes / 60)}h ${record.durationMinutes % 60}m` 
                          : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                        {record.notes || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ─── Pagination Footer ─── */}
          {!isLoading && timesheetsData && timesheetsData.totalPages > 1 && (
            <div className="p-4 border-t border-gray-800 flex items-center justify-between text-sm text-gray-500 bg-gray-950/80">
              <span>
                Showing page {timesheetsData.number + 1} of {timesheetsData.totalPages} 
                ({timesheetsData.totalElements} total entries)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-8 bg-black border-gray-800 text-gray-300 hover:text-white"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= timesheetsData.totalPages - 1}
                  className="h-8 bg-black border-gray-800 text-gray-300 hover:text-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </FeatureGuard>
  );
}
