'use client';

import { useParams } from 'next/navigation';
import useAuditStore from '@/stores/auditStore';
import Button from '@/components/ui/Button';

export default function AuditExportButton() {
  const { workspaceId } = useParams();
  const { filters } = useAuditStore();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.actorId) params.set('actorId', filters.actorId);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  const href = `${apiBase}/api/workspaces/${workspaceId}/exports/audit.csv?${params.toString()}`;
  return (
    <a href={href}>
      <Button variant="secondary" size="sm">
        Export CSV
      </Button>
    </a>
  );
}
