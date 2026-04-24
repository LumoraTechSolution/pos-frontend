"use client";

import { useState, useEffect } from "react";
import { timeClockService } from "@/services/timeClockService";
import { Button } from "@/components/ui/button";
import { Clock, Loader2, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { intervalToDuration } from "date-fns";

export function TimeClockWidget({ variant = 'sidebar' }: { variant?: 'sidebar' | 'header' }) {
  const queryClient = useQueryClient();
  const [elapsed, setElapsed] = useState<string>("");

  // Fetch current status
  const { data: currentRecord, isLoading } = useQuery({
    queryKey: ["time-clock-status"],
    queryFn: () => timeClockService.getStatus(),
    refetchInterval: 60000, // Refresh every minute just in case
  });

  // Calculate ongoing elapsed time locally every second if clocked in
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentRecord?.clockInTime) {
      const startTime = new Date(currentRecord.clockInTime).getTime();
      
      const updateElapsed = () => {
        const now = new Date().getTime();
        const duration = intervalToDuration({ start: startTime, end: now });
        
        // Format as HH:MM:SS
        const hours = String(duration.hours || 0).padStart(2, '0');
        const minutes = String(duration.minutes || 0).padStart(2, '0');
        const seconds = String(duration.seconds || 0).padStart(2, '0');
        
        setElapsed(`${hours}:${minutes}:${seconds}`);
      };

      updateElapsed(); // initial call
      interval = setInterval(updateElapsed, 1000);
    } else {
      setElapsed("");
    }

    return () => clearInterval(interval);
  }, [currentRecord?.clockInTime]);

  // Clock In Mutation
  const clockInMutation = useMutation({
    mutationFn: () => timeClockService.clockIn(),
    onSuccess: () => {
      toast.success("Clocked in successfully");
      queryClient.invalidateQueries({ queryKey: ["time-clock-status"] });
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to clock in");
    }
  });

  // Clock Out Mutation
  const clockOutMutation = useMutation({
    mutationFn: () => timeClockService.clockOut(),
    onSuccess: (data) => {
      toast.success(`Clocked out. Total duration: ${data.durationMinutes}m`);
      queryClient.invalidateQueries({ queryKey: ["time-clock-status"] });
    },
    onError: (error: unknown) => {
      toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to clock out");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-3 bg-gray-900 border border-gray-800 rounded-xl">
        <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
      </div>
    );
  }

  const isClockedIn = !!currentRecord;

  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-3 px-3 py-1.5 rounded-lg border transition-colors ${isClockedIn ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-gray-950 border-gray-800'}`}>
        <div className="flex items-center gap-2">
          <Clock size={16} className={isClockedIn ? "text-emerald-400" : "text-gray-500"} />
          {isClockedIn && (
            <span className="text-xs font-mono font-medium text-emerald-400 w-[60px] text-center">
              {elapsed}
            </span>
          )}
        </div>
        <div className="w-px h-4 bg-gray-800 mx-1" />
        {isClockedIn ? (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-400/10"
            onClick={() => clockOutMutation.mutate()}
            disabled={clockOutMutation.isPending}
          >
            {clockOutMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Clock Out'}
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
            onClick={() => clockInMutation.mutate()}
            disabled={clockInMutation.isPending}
          >
            {clockInMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Clock In'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 p-3 ${isClockedIn ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-gray-900/50 border-gray-800'} border rounded-xl transition-colors`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className={isClockedIn ? "text-emerald-400" : "text-gray-400"} />
          <span className="text-sm font-medium text-gray-200">
            {isClockedIn ? "On the clock" : "Off the clock"}
          </span>
        </div>
        
        {isClockedIn && (
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/50">
            {elapsed}
          </span>
        )}
      </div>

      {isClockedIn ? (
        <Button 
          variant="destructive" 
          size="sm" 
          className="w-full bg-red-600/20 text-red-400 hover:bg-red-600/40 border border-red-600/30"
          onClick={() => clockOutMutation.mutate()}
          disabled={clockOutMutation.isPending}
        >
          {clockOutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4" />}
          Clock Out
        </Button>
      ) : (
        <Button 
          variant="default" 
          size="sm" 
          className="w-full bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 border border-emerald-600/30"
          onClick={() => clockInMutation.mutate()}
          disabled={clockInMutation.isPending}
        >
          {clockInMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
          Clock In
        </Button>
      )}
    </div>
  );
}
