'use client';

import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Competency, CompetencyInput } from '@/lib/types';

interface CompetencyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CompetencyInput) => Promise<void>;
  initial?: Competency | null;
}

const EMPTY: CompetencyInput = {
  domain_code: '',
  domain_name: '',
  competency_code: '',
  competency_name: '',
  descriptor_text: '',
  display_order: 1,
  is_active: true,
};

export function CompetencyForm({ isOpen, onClose, onSubmit, initial }: CompetencyFormProps) {
  const [form, setForm] = useState<CompetencyInput>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(
        initial
          ? {
              domain_code: initial.domain_code,
              domain_name: initial.domain_name,
              competency_code: initial.competency_code,
              competency_name: initial.competency_name,
              descriptor_text: initial.descriptor_text ?? '',
              display_order: initial.display_order,
              is_active: initial.is_active,
            }
          : EMPTY
      );
      setErrors([]);
    }
  }, [isOpen, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    if (!form.domain_code.trim()) missing.push('Domain code is required.');
    if (!form.domain_name.trim()) missing.push('Domain name is required.');
    if (!form.competency_code.trim()) missing.push('Competency code is required.');
    if (!form.competency_name.trim()) missing.push('Competency name is required.');
    if (!form.descriptor_text?.trim()) missing.push('Descriptor text is required.');
    if (missing.length > 0) {
      setErrors(missing);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to save competency.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial ? 'Edit competency' : 'New competency'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Domain code"
            placeholder="D1"
            value={form.domain_code}
            onChange={(e) => setForm({ ...form, domain_code: e.target.value })}
          />
          <Input
            label="Domain name"
            placeholder="Communication"
            value={form.domain_name}
            onChange={(e) => setForm({ ...form, domain_name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Competency code"
            placeholder="COM001"
            value={form.competency_code}
            onChange={(e) => setForm({ ...form, competency_code: e.target.value })}
          />
          <Input
            label="Competency name"
            placeholder="Active Listening"
            value={form.competency_name}
            onChange={(e) => setForm({ ...form, competency_name: e.target.value })}
          />
        </div>
        <Textarea
          label="Descriptor text"
          placeholder="Demonstrates active listening skills."
          rows={3}
          value={form.descriptor_text}
          onChange={(e) => setForm({ ...form, descriptor_text: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Display order"
            type="number"
            min={1}
            value={form.display_order}
            onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
          />
          <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-navy">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 rounded border-navy/30"
            />
            Active
          </label>
        </div>

        {errors.length > 0 && (
          <ul className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {initial ? 'Save changes' : 'Create competency'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
