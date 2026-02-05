'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Download, Calendar, ArrowLeft, Clock, Truck } from 'lucide-react';
import type { WasteCalendarResponse, Appointment, Fraction } from '@/lib/types/bav-api.types';
import { normalizeAddressKey } from '@/lib/utils/cache-keys';
import { useAddressStore } from '@/lib/stores/address.store';
import { useFractionFilter } from '@/lib/hooks/useFractionFilter';
import { useExportModal } from '@/lib/hooks/useExportModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FadeIn } from '@/components/animations';
import AppointmentList from './AppointmentList';
import FractionFilter from './FractionFilter';
import FractionBadge from './FractionBadge';
import FilterSetupDialog from './FilterSetupDialog';
import { cn } from '@/lib/utils';

// Helper to get relative time info
function getRelativeTimeInfo(dateString: string): { 
  label: string; 
  sublabel: string;
  urgency: 'today' | 'tomorrow' | 'soon' | 'normal';
} {
  const date = new Date(dateString);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const formattedDate = date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  
  if (diffDays === 0) {
    return { label: 'Heute', sublabel: formattedDate, urgency: 'today' };
  }
  if (diffDays === 1) {
    return { label: 'Morgen', sublabel: formattedDate, urgency: 'tomorrow' };
  }
  if (diffDays === 2) {
    return { label: 'Übermorgen', sublabel: formattedDate, urgency: 'soon' };
  }
  if (diffDays > 0 && diffDays <= 7) {
    return { label: `In ${diffDays} Tagen`, sublabel: formattedDate, urgency: 'soon' };
  }
  
  return { label: formattedDate, sublabel: '', urgency: 'normal' };
}

// Component for displaying next pickup info
interface NextPickupCardProps {
  nextAppointments: Appointment[];
  fractions: Fraction[];
  date: string;
}

function NextPickupCard({ nextAppointments, fractions, date }: NextPickupCardProps) {
  const timeInfo = getRelativeTimeInfo(date);
  const fractionsForDate = nextAppointments
    .map((a) => fractions.find((f) => f.id === a.fractionId))
    .filter((f): f is Fraction => f !== undefined);

  // Glassmorphism with elegant accent styling
  const urgencyStyles = {
    today: {
      glow: 'shadow-[0_0_40px_-8px_rgba(16,185,129,0.35)]',
      gradientFrom: 'from-emerald-500/8',
      gradientTo: 'to-teal-500/5',
      border: 'ring-1 ring-emerald-500/20',
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-400/15',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      labelColor: 'text-emerald-600 dark:text-emerald-400',
      indicator: 'bg-emerald-500',
    },
    tomorrow: {
      glow: 'shadow-[0_0_40px_-8px_rgba(59,130,246,0.3)]',
      gradientFrom: 'from-blue-500/8',
      gradientTo: 'to-indigo-500/5',
      border: 'ring-1 ring-blue-500/20',
      iconBg: 'bg-blue-500/10 dark:bg-blue-400/15',
      iconColor: 'text-blue-600 dark:text-blue-400',
      labelColor: 'text-blue-600 dark:text-blue-400',
      indicator: 'bg-blue-500',
    },
    soon: {
      glow: 'shadow-[0_0_30px_-8px_rgba(100,116,139,0.25)]',
      gradientFrom: 'from-slate-500/6',
      gradientTo: 'to-zinc-500/4',
      border: 'ring-1 ring-slate-400/20',
      iconBg: 'bg-slate-500/10 dark:bg-slate-400/15',
      iconColor: 'text-slate-600 dark:text-slate-400',
      labelColor: 'text-slate-600 dark:text-slate-400',
      indicator: 'bg-slate-400',
    },
    normal: {
      glow: '',
      gradientFrom: 'from-zinc-500/4',
      gradientTo: 'to-zinc-500/2',
      border: 'ring-1 ring-zinc-300/20 dark:ring-zinc-600/20',
      iconBg: 'bg-zinc-500/8 dark:bg-zinc-400/10',
      iconColor: 'text-zinc-500 dark:text-zinc-400',
      labelColor: 'text-zinc-700 dark:text-zinc-300',
      indicator: 'bg-zinc-400',
    },
  };

  const styles = urgencyStyles[timeInfo.urgency];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="relative"
    >
      {/* Subtle glow effect behind card */}
      <div className={cn(
        'absolute inset-0 rounded-2xl transition-shadow duration-500',
        styles.glow
      )} />
      
      <Card glass className={cn(
        'relative overflow-hidden',
        styles.border
      )}>
        {/* Subtle gradient overlay */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br pointer-events-none',
          styles.gradientFrom,
          styles.gradientTo
        )} />
        
        <CardContent className="relative p-5 sm:p-6">
          <div className="flex items-start gap-4">
            {/* Icon with subtle pulse animation for today */}
            <div className="relative">
              <div className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-300',
                styles.iconBg
              )}>
                <Truck className={cn('h-7 w-7', styles.iconColor)} />
              </div>
              {/* Status indicator dot */}
              <span className={cn(
                'absolute -top-1 -right-1 h-3 w-3 rounded-full ring-2 ring-white dark:ring-zinc-900',
                styles.indicator,
                timeInfo.urgency === 'today' && 'animate-pulse'
              )} />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-0.5">
                Nächste Abfuhr
              </p>
              <p className={cn(
                'text-2xl sm:text-3xl font-bold tracking-tight',
                styles.labelColor
              )}>
                {timeInfo.label}
              </p>
              {timeInfo.sublabel && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                  {timeInfo.sublabel}
                </p>
              )}
              
              {/* Fractions with colored indicators */}
              <div className="flex flex-wrap gap-2 mt-4">
                {fractionsForDate.map((fraction) => (
                  <span
                    key={fraction.id}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium bg-white/60 dark:bg-zinc-800/60 backdrop-blur-sm text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700/50 shadow-sm"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
                      style={{ backgroundColor: fraction.color || '#888' }}
                    />
                    {fraction.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface WasteCollectionCalendarProps {
  data: WasteCalendarResponse;
  location?: string;
  street?: string;
  /** House number display name (e.g., "2") */
  houseNumber?: string;
  /** House number API ID for persistence */
  houseNumberId?: string;
}

export default function WasteCollectionCalendar({
  data,
  location: locationProp,
  street: streetProp,
  houseNumber: houseNumberProp,
  houseNumberId: houseNumberIdProp,
}: WasteCollectionCalendarProps) {
  const setLastAddress = useAddressStore((s) => s.setLastAddress);

  // Save current address as last used when calendar is displayed
  useEffect(() => {
    const loc = locationProp?.trim();
    const str = streetProp?.trim();
    if (!loc || !str) return;
    // Include house number info so it persists when navigating back
    setLastAddress(loc, str, houseNumberProp, houseNumberIdProp);
  }, [locationProp, streetProp, houseNumberProp, houseNumberIdProp, setLastAddress]);

  // Get fractions that actually appear in appointments
  const availableFractionIds = useMemo(
    () => new Set(data.appointments.map((t) => t.fractionId)),
    [data.appointments]
  );
  const availableFractions = useMemo(
    () => data.fractions.filter((f) => availableFractionIds.has(f.id)),
    [data.fractions, availableFractionIds]
  );

  // Normalized address key for per-address storage
  const storageKey = useMemo(
    () => normalizeAddressKey(locationProp ?? '', streetProp ?? ''),
    [locationProp, streetProp]
  );

  // Use the fraction filter hook
  const {
    selectedFractions,
    setSelectedFractions,
    isFirstTimeForAddress,
    markAsConfigured,
    mounted,
  } = useFractionFilter({
    availableFractions,
    storageKey,
  });

  // Use the export modal hook
  const exportModal = useExportModal({
    location: locationProp ?? '',
    street: streetProp ?? '',
    selectedFractions,
  });

  // Get upcoming appointments
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return data.appointments
      .filter((t) => {
        const appointmentDate = new Date(t.date);
        appointmentDate.setHours(0, 0, 0, 0);
        return appointmentDate >= now && selectedFractions.has(t.fractionId);
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data.appointments, selectedFractions]);

  const upcomingCount = upcomingAppointments.length;

  // Get next pickup date and its appointments
  const nextPickup = useMemo(() => {
    const first = upcomingAppointments[0];
    if (!first) return null;
    
    const nextDate = first.date;
    const appointmentsOnNextDate = upcomingAppointments.filter(
      (a) => a.date === nextDate
    );
    
    return {
      date: nextDate,
      appointments: appointmentsOnNextDate,
    };
  }, [upcomingAppointments]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full space-y-4 sm:space-y-6"
    >
      {/* Address Header - Compact on mobile */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <div className="text-sm sm:text-base">
              <span className="font-semibold text-zinc-900 dark:text-zinc-50">{data.street.name}</span>
              <span className="text-zinc-500 dark:text-zinc-400"> • {data.location.name}</span>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              <span className="sm:inline">Andere Adresse</span>
            </Button>
          </Link>
        </div>
      </FadeIn>

      {/* Next Pickup - Most important info first */}
      {nextPickup && (
        <NextPickupCard
          nextAppointments={nextPickup.appointments}
          fractions={data.fractions}
          date={nextPickup.date}
        />
      )}

      {/* Stats Card - Secondary info */}
      <FadeIn delay={0.1}>
        <Card glass className="overflow-hidden">
          <CardContent className="p-4">
            {/* Stats - Compact grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
              <div className="rounded-xl bg-green-50 dark:bg-green-900/20 p-2.5 sm:p-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {upcomingCount}
                </p>
                <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-300">
                  Termine
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-2.5 sm:p-3 text-center">
                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {availableFractions.length}
                </p>
                <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300">
                  Abfallarten
                </p>
              </div>
              {houseNumberProp ? (
                <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-2.5 sm:p-3 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {houseNumberProp}
                  </p>
                  <p className="text-[10px] sm:text-xs text-purple-700 dark:text-purple-300">
                    Hausnr.
                  </p>
                </div>
              ) : data.houseNumbers.length > 0 ? (
                <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-2.5 sm:p-3 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {data.houseNumbers.length}
                  </p>
                  <p className="text-[10px] sm:text-xs text-purple-700 dark:text-purple-300">
                    Hausnr.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 p-2.5 sm:p-3 text-center">
                  <p className="text-xl sm:text-2xl font-bold text-zinc-600 dark:text-zinc-400">
                    ∞
                  </p>
                  <p className="text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-500">
                    Alle Hausnr.
                  </p>
                </div>
              )}
            </div>

            {/* Available fractions */}
            <div className="flex flex-wrap gap-1.5">
              {availableFractions.map((fraction) => (
                <FractionBadge key={fraction.id} fraction={fraction} size="sm" />
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Appointments Section */}
      <FadeIn delay={0.2}>
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Alle Termine
            </h2>
            
            <div className="flex flex-wrap items-center gap-2">
              <FractionFilter
                fractions={availableFractions}
                selectedFractions={selectedFractions}
                onFilterChange={setSelectedFractions}
              />
              
              <Button
                variant="outline"
                onClick={exportModal.open}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportieren</span>
              </Button>
            </div>
          </div>

          {/* Appointment List */}
          <AppointmentList
            appointments={data.appointments}
            fractions={data.fractions}
            selectedFractions={selectedFractions}
          />
        </div>
      </FadeIn>

      {/* Export Dialog */}
      <Dialog open={exportModal.isOpen} onOpenChange={(open) => !open && exportModal.close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              In Kalender exportieren
            </DialogTitle>
            <DialogDescription>
              Wähle die Abfallarten und den Zeitraum für den Export.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Fraction Selection */}
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                Abfallarten für .ics-Datei
              </label>
              <FractionFilter
                fractions={availableFractions}
                selectedFractions={exportModal.exportSelectedFractions}
                onFilterChange={exportModal.setExportSelectedFractions}
                inline
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Von
                </label>
                <input
                  type="date"
                  value={exportModal.dateFrom}
                  onChange={(e) => exportModal.setDateFrom(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                  Bis
                </label>
                <input
                  type="date"
                  value={exportModal.dateTo}
                  onChange={(e) => exportModal.setDateTo(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {!exportModal.isDateRangeValid && (
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Das „Von"-Datum muss vor dem „Bis"-Datum liegen.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={exportModal.close}>
              Abbrechen
            </Button>
            {exportModal.exportUrl ? (
              <Button asChild className="gap-2">
                <a href={exportModal.exportUrl} download="abfuhrkalender.ics">
                  <Download className="h-4 w-4" />
                  .ics herunterladen
                </a>
              </Button>
            ) : (
              <Button disabled className="gap-2">
                <Download className="h-4 w-4" />
                .ics herunterladen
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Setup Dialog - shown on first time for this address */}
      <FilterSetupDialog
        open={mounted && isFirstTimeForAddress}
        fractions={availableFractions}
        selectedFractions={selectedFractions}
        onFilterChange={setSelectedFractions}
        onConfirm={markAsConfigured}
        onClose={markAsConfigured}
      />
    </motion.div>
  );
}
