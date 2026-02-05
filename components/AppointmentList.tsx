'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Appointment, Fraction } from '@/lib/types/bav-api.types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import FractionBadge from './FractionBadge';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Max number of items to animate with stagger effect
const MAX_ANIMATED_ITEMS = 10;

interface AppointmentListProps {
  appointments: Appointment[];
  fractions: Fraction[];
  selectedFractions?: Set<number>;
}

// Get relative time description
function getRelativeTime(dateString: string): { label: string; isToday: boolean; isTomorrow: boolean; isThisWeek: boolean } {
  const date = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return { label: 'Heute', isToday: true, isTomorrow: false, isThisWeek: true };
  }
  if (diffDays === 1) {
    return { label: 'Morgen', isToday: false, isTomorrow: true, isThisWeek: true };
  }
  if (diffDays === 2) {
    return { label: 'Übermorgen', isToday: false, isTomorrow: false, isThisWeek: true };
  }
  if (diffDays > 0 && diffDays <= 7) {
    return { label: `In ${diffDays} Tagen`, isToday: false, isTomorrow: false, isThisWeek: true };
  }
  if (diffDays > 7 && diffDays <= 14) {
    return { label: 'Nächste Woche', isToday: false, isTomorrow: false, isThisWeek: false };
  }
  if (diffDays < 0 && diffDays >= -1) {
    return { label: 'Gestern', isToday: false, isTomorrow: false, isThisWeek: false };
  }
  if (diffDays < -1 && diffDays >= -7) {
    return { label: `Vor ${Math.abs(diffDays)} Tagen`, isToday: false, isTomorrow: false, isThisWeek: false };
  }
  
  return { label: '', isToday: false, isTomorrow: false, isThisWeek: false };
}

export default function AppointmentList({
  appointments,
  fractions,
  selectedFractions,
}: AppointmentListProps) {
  const [activeTab, setActiveTab] = useState<string>('upcoming');

  const findFraction = (fractionId: number): Fraction | undefined => {
    return fractions.find((f) => f.id === fractionId);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filteredAppointments = selectedFractions
    ? appointments.filter((t) => selectedFractions.has(t.fractionId))
    : appointments;

  const upcomingAppointments = useMemo(() => 
    filteredAppointments.filter((t) => {
      const appointmentDate = new Date(t.date);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate >= now;
    }),
    [filteredAppointments, now]
  );

  const pastAppointments = useMemo(() =>
    filteredAppointments.filter((t) => {
      const appointmentDate = new Date(t.date);
      appointmentDate.setHours(0, 0, 0, 0);
      return appointmentDate < now;
    }),
    [filteredAppointments, now]
  );

  const groupByDate = (appts: Appointment[]) => {
    return appts.reduce(
      (acc, appointment) => {
        (acc[appointment.date] ??= []).push(appointment);
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
        <div className="glass-card p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">
            Keine Abfuhrtermine verfügbar
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">
            Versuche einen anderen Filter oder Zeitraum
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sortedDates.map((date, index) => {
          const appointmentsForDate = groupedByDate[date]!;
          // Deduplicate fractions by ID to avoid duplicate keys
          const fractionsForDate = appointmentsForDate
            .map((t) => findFraction(t.fractionId))
            .filter((f): f is Fraction => f !== undefined)
            .filter((f, i, arr) => arr.findIndex((x) => x.id === f.id) === i);
          
          const relativeTime = getRelativeTime(date);
          const isHighlighted = relativeTime.isToday || relativeTime.isTomorrow;

          // Only animate first MAX_ANIMATED_ITEMS items for performance
          const shouldAnimate = index < MAX_ANIMATED_ITEMS;
          const animationDelay = shouldAnimate ? index * 0.03 : 0;

          const cardContent = (
            <Card
              glass
              className={cn(
                'overflow-hidden',
                isHighlighted && 'ring-2 ring-primary/30'
              )}
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Date and relative time */}
                    <div className="flex items-center gap-2 mb-3">
                      <time
                        dateTime={date}
                        className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50"
                      >
                        {formatDate(date)}
                      </time>
                      {relativeTime.label && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            relativeTime.isToday && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                            relativeTime.isTomorrow && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                            !relativeTime.isToday && !relativeTime.isTomorrow && 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          )}
                        >
                          <Clock className="h-3 w-3" />
                          {relativeTime.label}
                        </span>
                      )}
                    </div>
                    
                    {/* Fraction badges */}
                    <div className="flex flex-wrap gap-2">
                      {fractionsForDate.map((fraction) => (
                        <FractionBadge key={fraction.id} fraction={fraction} />
                      ))}
                    </div>
                  </div>
                  
                  {/* Arrow indicator */}
                  <ChevronRight className="h-5 w-5 text-zinc-400 flex-shrink-0 mt-1" />
                </div>
              </div>
              
              {/* Highlighted bar for today/tomorrow */}
              {isHighlighted && (
                <div 
                  className={cn(
                    'h-1',
                    relativeTime.isToday ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  )}
                />
              )}
            </Card>
          );

          // Wrap in motion.div only for animated items
          if (shouldAnimate) {
            return (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.3, 
                  delay: animationDelay,
                  ease: [0.21, 0.47, 0.32, 0.98]
                }}
              >
                {cardContent}
              </motion.div>
            );
          }

          // Non-animated items render directly
          return <div key={date}>{cardContent}</div>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="upcoming" className="gap-2">
            Zukünftige
            <span className="hidden sm:inline rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {upcomingAppointments.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            Vergangene
            <span className="hidden sm:inline rounded-full bg-zinc-500/10 px-2 py-0.5 text-xs font-medium text-zinc-500">
              {pastAppointments.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" key="upcoming">
          {renderAppointments(upcomingAppointments, false)}
        </TabsContent>
        
        <TabsContent value="past" key="past">
          {renderAppointments(pastAppointments, true)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
