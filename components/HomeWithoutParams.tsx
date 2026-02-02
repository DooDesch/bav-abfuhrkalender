'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAddressStore } from '@/lib/stores/address.store';
import AddressSearchForm from '@/components/AddressSearchForm';
import Hero from '@/components/layout/Hero';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomeWithoutParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const getLastAddress = useAddressStore((s) => s.getLastAddress);
  const [showForm, setShowForm] = useState(false);

  const wantsForm = searchParams.get('form') === '1';

  useEffect(() => {
    if (wantsForm) {
      setShowForm(true);
      return;
    }
    const last = getLastAddress();
    if (last.location?.trim() && last.street?.trim()) {
      router.replace(
        `/?location=${encodeURIComponent(last.location)}&street=${encodeURIComponent(last.street)}`
      );
      return;
    }
    setShowForm(true);
  }, [getLastAddress, router, wantsForm]);

  if (!showForm) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Skeleton className="h-12 w-64 rounded-xl mb-4" />
        <Skeleton className="h-6 w-80 rounded-lg mb-8" />
        <Skeleton className="h-[280px] w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex w-full max-w-full flex-col items-center gap-4"
    >
      <Hero />
      <AddressSearchForm />
    </motion.div>
  );
}
