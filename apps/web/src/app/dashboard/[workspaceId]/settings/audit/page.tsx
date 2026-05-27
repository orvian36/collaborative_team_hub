'use client';

import { CAPABILITIES } from '@team-hub/shared';
import PermissionGate from '@/components/ui/PermissionGate';
import AuditTimeline from '@/components/audit/AuditTimeline';
import AuditFilters from '@/components/audit/AuditFilters';
import AuditExportButton from '@/components/audit/AuditExportButton';

export default function AuditPage() {
  return (
    <PermissionGate
      cap={CAPABILITIES.AUDIT_READ}
      fallback={
        <div className="p-6">
          <p className="text-gray-500">Admins only.</p>
        </div>
      }
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Audit log
          </h1>
          <AuditExportButton />
        </div>
        <AuditFilters />
        <AuditTimeline />
      </div>
    </PermissionGate>
  );
}
