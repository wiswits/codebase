/**
 * Utilization Main Page
 * Redirects to dashboard
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UtilizationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/utilization/dashboard');
  }, [router]);

  return null;
}