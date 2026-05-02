'use client';

import { useParams } from 'next/navigation';
import { CAPABILITIES } from '@team-hub/shared';
import PermissionGate from '@/components/ui/PermissionGate';
import Button from '@/components/ui/Button';

export default function ExportButtons() {
  const { workspaceId } = useParams();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';

  const link = (path) => `${apiBase}/api/workspaces/${workspaceId}/exports/${path}`;

  return (
    <PermissionGate cap={CAPABILITIES.EXPORT_CSV}>
      <div className="flex flex-wrap gap-2">
        <a href={link('goals.csv')}><Button variant="secondary" size="sm">Export goals</Button></a>
        <a href={link('action-items.csv')}><Button variant="secondary" size="sm">Export action items</Button></a>
        <a href={link('announcements.csv')}><Button variant="secondary" size="sm">Export announcements</Button></a>
        <a href={link('audit.csv')}><Button variant="secondary" size="sm">Export audit log</Button></a>
      </div>
    </PermissionGate>
  );
}
