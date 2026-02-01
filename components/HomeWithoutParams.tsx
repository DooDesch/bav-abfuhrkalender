'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAddressStore } from '@/lib/stores/address.store';
import AddressSearchForm from '@/components/AddressSearchForm';

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
      <p className="text-center text-zinc-600 dark:text-zinc-400">
        Lade...
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <p className="text-center text-zinc-600 dark:text-zinc-400">
        Abfuhrtermine für Ihre Adresse im BAV-Gebiet. Wählen Sie Ort und
        Straße, um den Abfuhrkalender anzuzeigen.
      </p>
      <AddressSearchForm />
    </div>
  );
}
