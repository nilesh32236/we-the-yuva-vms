'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, LogIn, LogOut, MapPin } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { AttendanceChecklist } from '../../../../../../components/events/AttendanceChecklist';
import { SkeletonCard } from '../../../../../../components/shared/SkeletonCard';
import { haptic } from '../../../../../../lib/haptic';
import { useToast } from '../../../../../../hooks/use-toast';
import { api } from '../../../../../../lib/api';

interface AttendanceRecord {
  volunteerId: string;
  attended: boolean;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  checkInLat?: number;
  checkInLng?: number;
  checkOutLat?: number;
  checkOutLng?: number;
  volunteer: {
    name: string;
    email?: string;
  };
}

export default function AttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: event } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}`).then((r) => r.data),
    staleTime: 60_000,
  });

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance', id],
    queryFn: () => api.get(`/events/${id}/attendance`).then((r) => r.data),
    refetchInterval: 30_000, // auto-refresh every 30s to see new check-ins
  });

  const saveMutation = useMutation({
    mutationFn: (attendances: { volunteerId: string; attended: boolean }[]) =>
      api.post(`/events/${id}/attendance`, { attendances }),
    onMutate: async (newAttendances) => {
      await qc.cancelQueries({ queryKey: ['attendance', id] });
      const prev = qc.getQueryData(['attendance', id]) as { data?: AttendanceRecord[] } | AttendanceRecord[] | undefined;

      if (prev) {
        const prevRecords: AttendanceRecord[] = Array.isArray(prev) ? prev : (prev.data ?? []);
        const updatedRecords = prevRecords.map((record) => {
          const match = newAttendances.find((na) => na.volunteerId === record.volunteerId);
          if (match) {
            return { ...record, attended: match.attended };
          }
          return record;
        });
        const updated = Array.isArray(prev) ? updatedRecords : { ...prev, data: updatedRecords };
        qc.setQueryData(['attendance', id], updated);
      }

      return { previousAttendance: prev };
    },
    onError: (err, _newAttendances, context) => {
      if (context?.previousAttendance) {
        qc.setQueryData(['attendance', id], context.previousAttendance);
      }
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({ title: 'Attendance saved!' });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['attendance', id] });
    },
  });

  const handleSave = async (attendances: { volunteerId: string; attended: boolean }[]) => {
    haptic.medium();
    await saveMutation.mutateAsync(attendances);
  };

  const records: AttendanceRecord[] = attendance?.data ?? attendance ?? [];
  const volunteers = records.map((a: AttendanceRecord) => ({
    volunteerId: a.volunteerId,
    name: a.volunteer.name,
    email: a.volunteer.email ?? '',
    attended: a.attended,
  }));

  const checkedInCount = records.filter((a: AttendanceRecord) => a.checkedInAt).length;
  const checkedOutCount = records.filter((a: AttendanceRecord) => a.checkedOutAt).length;

  return (
    <div className="max-w-3xl space-y-5">
      <Link
        href="/coordinator/events"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>

      {event && (
        <div className="bg-white rounded-2xl border border-brand-border p-5">
          <h1 className="font-heading font-bold text-xl text-brand-text">{event.title}</h1>
          <p className="text-sm text-brand-muted mt-1">
            {new Date(event.eventDate).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}{' '}
            · {event.startTime}–{event.endTime}
            {event.venue && <span> · {event.venue}</span>}
          </p>
          <div className="flex gap-4 mt-4">
            <div className="text-center">
              <p className="font-heading font-bold text-2xl text-brand-primary">{checkedInCount}</p>
              <p className="text-xs text-brand-muted">Checked In</p>
            </div>
            <div className="text-center">
              <p className="font-heading font-bold text-2xl text-emerald-600">{checkedOutCount}</p>
              <p className="text-xs text-brand-muted">Checked Out</p>
            </div>
            <div className="text-center">
              <p className="font-heading font-bold text-2xl text-brand-text">
                {(attendance ?? []).length}
              </p>
              <p className="text-xs text-brand-muted">Total</p>
            </div>
          </div>
        </div>
      )}

      {/* Self check-in log */}
      {records.some((a: AttendanceRecord) => a.checkedInAt) && (
        <div className="bg-white rounded-2xl border border-brand-border overflow-hidden">
          <div className="px-5 py-3 border-b border-brand-border">
            <h2 className="font-heading font-semibold text-sm text-brand-text">
              Self Check-in Log
            </h2>
          </div>
          <div className="divide-y divide-brand-border">
            {records
              .filter((a: AttendanceRecord) => a.checkedInAt)
              .map((a: AttendanceRecord) => {
                const duration = a.checkedOutAt
                  ? (
                      (new Date(a.checkedOutAt).getTime() - new Date(a.checkedInAt!).getTime()) /
                      3_600_000
                    ).toFixed(1)
                  : null;
                return (
                  <div key={a.volunteerId} className="px-5 py-3 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-brand-primary">
                        {a.volunteer.name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-text truncate">
                        {a.volunteer.name}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-brand-muted">
                        <span className="flex items-center gap-1">
                          <LogIn className="w-3 h-3 text-emerald-600" />
                          {new Date(a.checkedInAt!).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {a.checkInLat && (
                            <span className="flex items-center gap-0.5 ml-1">
                              <MapPin className="w-2.5 h-2.5" />
                              {a.checkInLat.toFixed(3)},{a.checkInLng?.toFixed(3)}
                            </span>
                          )}
                        </span>
                        {a.checkedOutAt && (
                          <span className="flex items-center gap-1">
                            <LogOut className="w-3 h-3 text-red-500" />
                            {new Date(a.checkedOutAt!).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {a.checkOutLat && (
                              <span className="flex items-center gap-0.5 ml-1">
                                <MapPin className="w-2.5 h-2.5" />
                                {a.checkOutLat.toFixed(3)},{a.checkOutLng?.toFixed(3)}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    {duration && (
                      <div className="flex items-center gap-1 text-sm font-semibold text-brand-primary flex-shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        {duration}h
                      </div>
                    )}
                    {!a.checkedOutAt && (
                      <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">
                        Active
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Manual attendance override */}
      <div className="bg-white rounded-2xl border border-brand-border p-6">
        <h2 className="font-heading font-semibold text-sm text-brand-text mb-4">
          Manual Attendance Override
        </h2>
        {isLoading ? (
          <SkeletonCard />
        ) : volunteers.length === 0 ? (
          <p className="text-center text-brand-muted py-8">
            No accepted volunteers for this event yet.
          </p>
        ) : (
          <AttendanceChecklist volunteers={volunteers} onSave={handleSave} />
        )}
      </div>
    </div>
  );
}
