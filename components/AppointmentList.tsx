'use client';

import { useState } from 'react';
import type { Appointment, Fraction } from '@/lib/types/bav-api.types';
import FractionBadge from './FractionBadge';

interface AppointmentListProps {
  appointments: Appointment[];
  fractions: Fraction[];
  selectedFractions?: Set<number>;
}

export default function AppointmentList({
  appointments,
  fractions,
  selectedFractions,
}: AppointmentListProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const findFraction = (fractionId: number): Fraction | undefined => {
    return fractions.find((f) => f.id === fractionId);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filteredAppointments = selectedFractions
    ? appointments.filter((t) => selectedFractions.has(t.fractionId))
    : appointments;

  // Split into upcoming and past appointments
  const upcomingAppointments = filteredAppointments.filter((t) => {
    const appointmentDate = new Date(t.date);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate >= now;
  });

  const pastAppointments = filteredAppointments.filter((t) => {
    const appointmentDate = new Date(t.date);
    appointmentDate.setHours(0, 0, 0, 0);
    return appointmentDate < now;
  });

  const groupByDate = (appts: Appointment[]) => {
    return appts.reduce(
      (acc, appointment) => {
        if (!acc[appointment.date]) {
          acc[appointment.date] = [];
        }
        acc[appointment.date].push(appointment);
        return acc;
      },
      {} as Record<string, Appointment[]>
    );
  };

  const renderAppointments = (appts: Appointment[], sortDesc: boolean = false) => {
    const groupedByDate = groupByDate(appts);
    const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
      sortDesc ? b.localeCompare(a) : a.localeCompare(b)
    );

    if (sortedDates.length === 0) {
      return (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          Keine Abfuhrtermine verfügbar
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sortedDates.map((date) => {
          const appointmentsForDate = groupedByDate[date];
          const fractionsForDate = appointmentsForDate
            .map((t) => findFraction(t.fractionId))
            .filter((f): f is Fraction => f !== undefined);

          return (
            <div
              key={date}
              className="flex items-start justify-between rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex flex-col gap-3">
                <time
                  dateTime={date}
                  className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                >
                  {formatDate(date)}
                </time>
                <div className="flex flex-wrap gap-2">
                  {fractionsForDate.map((fraction) => (
                    <FractionBadge key={fraction.id} fraction={fraction} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'upcoming'
              ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
          }`}
        >
          Zukünftige ({upcomingAppointments.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'past'
              ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-50 dark:text-zinc-50'
              : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
          }`}
        >
          Vergangene ({pastAppointments.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'upcoming'
        ? renderAppointments(upcomingAppointments, false)
        : renderAppointments(pastAppointments, true)}
    </div>
  );
}
