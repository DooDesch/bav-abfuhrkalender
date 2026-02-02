'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAddressStore } from '@/lib/stores/address.store';
import { createStreetSlug } from '@/lib/utils/seo';
import AddressSearchForm from '@/components/AddressSearchForm';
import Hero from '@/components/layout/Hero';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomeWithoutParams() {
  const router = useRouter();
  const getLastAddress = useAddressStore((s) => s.getLastAddress);
  const wantsNewAddress = useAddressStore((s) => s.wantsNewAddress);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    // If user explicitly wants to enter a new address, show form
    if (wantsNewAddress) {
      setShowForm(true);
      return;
    }
    // If we have a saved address, redirect to the SEO-friendly URL
    const last = getLastAddress();
    if (last.location?.trim() && last.street?.trim()) {
      const locationSlug = last.location.toLowerCase();
      const streetSlug = createStreetSlug(last.street);
      router.replace(`/${locationSlug}/${streetSlug}`);
      return;
    }
    setShowForm(true);
  }, [getLastAddress, router, wantsNewAddress]);

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
