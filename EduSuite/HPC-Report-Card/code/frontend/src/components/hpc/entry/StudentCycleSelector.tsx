'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function StudentCycleSelector() {
  const router = useRouter();
  const [studentId, setStudentId] = useState('');
  const [cycleId, setCycleId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !cycleId.trim()) {
      setError('Enter both a student ID and an academic cycle ID.');
      return;
    }
    router.push(`/hpc/workspace/${studentId.trim()}/${cycleId.trim()}`);
  };

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Open a student&apos;s HPC card</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Student ID"
            placeholder="101"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            inputMode="numeric"
          />
          <Input
            label="Academic cycle ID"
            placeholder="2025"
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
            inputMode="numeric"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" className="self-start">
            Open workspace
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
