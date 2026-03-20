'use client';

import React, { useState, type FormEvent } from 'react';
import { useToast } from '@/components/ui/toast';

interface AddIntegrationFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

const INTEGRATION_TYPES = [
  { value: 'crm', label: 'CRM' },
  { value: 'payment', label: 'Payment' },
  { value: 'form', label: 'Form' },
  { value: 'support', label: 'Support' },
] as const;

type IntegrationType = (typeof INTEGRATION_TYPES)[number]['value'];

export function AddIntegrationForm({ onSuccess, onClose }: AddIntegrationFormProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState<IntegrationType>('crm');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({ message: 'Name is required.', variant: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          config: {
            ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
            ...(baseUrl.trim() ? { baseUrl: baseUrl.trim() } : {}),
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? 'Failed to create integration');
      }

      toast({ message: 'Integration created successfully!', variant: 'success' });
      onSuccess();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      toast({ message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses =
    'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label htmlFor="integration-name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="integration-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Integration"
          className={inputClasses}
          disabled={isSubmitting}
          required
        />
      </div>

      {/* Type */}
      <div>
        <label htmlFor="integration-type" className="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select
          id="integration-type"
          value={type}
          onChange={(e) => setType(e.target.value as IntegrationType)}
          className={inputClasses}
          disabled={isSubmitting}
        >
          {INTEGRATION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* API Key */}
      <div>
        <label htmlFor="integration-api-key" className="block text-sm font-medium text-gray-700 mb-1">
          API Key <span className="text-gray-400 text-xs font-normal">(optional)</span>
        </label>
        <input
          id="integration-api-key"
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className={inputClasses}
          disabled={isSubmitting}
        />
      </div>

      {/* Base URL */}
      <div>
        <label htmlFor="integration-base-url" className="block text-sm font-medium text-gray-700 mb-1">
          Base URL <span className="text-gray-400 text-xs font-normal">(optional)</span>
        </label>
        <input
          id="integration-base-url"
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.example.com"
          className={inputClasses}
          disabled={isSubmitting}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating...
            </>
          ) : (
            'Create Integration'
          )}
        </button>
      </div>
    </form>
  );
}
