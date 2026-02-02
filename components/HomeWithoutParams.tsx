'use client';

import { motion } from 'framer-motion';
import AddressSearchForm from '@/components/AddressSearchForm';
import Hero from '@/components/layout/Hero';

export default function HomeWithoutParams() {
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
