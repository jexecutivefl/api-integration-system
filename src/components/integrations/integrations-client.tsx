'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Modal } from '@/components/ui/modal';
import { AddIntegrationForm } from '@/components/integrations/add-integration-form';
import { EmptyState } from '@/components/ui/empty-state';

interface IntegrationItem {
  id: string;
  name: string;
  type: string;
  status: string;
  lastSyncAt: string | null;
  syncCount: number;
  recordCount: number;
  typeLabel: string;
  typeIcon: string;
}

const typeFilters = ['All', 'CRM', 'Payment', 'Form', 'Support'];

export function IntegrationsClient({ integrations }: { integrations: IntegrationItem[] }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = integrations.filter((i) => {
    const matchesSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.type.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || i.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Manage your API connections and monitor sync status"
        action={
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Integration
          </Button>
        }
      />

      {/* Search & Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-72">
          <SearchInput value={search} onChange={setSearch} placeholder="Search integrations..." />
        </div>
        <div className="flex gap-1">
          {typeFilters.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                typeFilter === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        integrations.length === 0 ? (
          <EmptyState
            title="No integrations configured"
            description="Add your first API integration to start syncing data automatically."
            action={
              <Button onClick={() => setShowAddModal(true)} size="sm">Add Integration</Button>
            }
          />
        ) : (
          <EmptyState
            title="No matching integrations"
            description="Try adjusting your search or filters."
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-stagger">
          {filtered.map((integration) => (
            <Link key={integration.id} href={`/integrations/${integration.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer animate-slide-up opacity-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-sm font-bold ${integration.typeIcon}`}>
                      {integration.type.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                      <p className="text-sm text-gray-500">{integration.typeLabel}</p>
                    </div>
                  </div>
                  <StatusBadge status={integration.status} />
                </div>
                <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                  <span>{integration.syncCount} syncs</span>
                  <span>{integration.recordCount} records</span>
                  {integration.lastSyncAt && (
                    <span>Last sync: {new Date(integration.lastSyncAt).toLocaleDateString()}</span>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Integration">
        <AddIntegrationForm
          onSuccess={() => router.refresh()}
          onClose={() => setShowAddModal(false)}
        />
      </Modal>
    </>
  );
}
