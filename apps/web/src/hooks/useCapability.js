import { hasCapability } from '@team-hub/shared';
import useWorkspaceStore from '@/stores/workspaceStore';

/**
 * Returns true if the current user's role in the active workspace
 * has the given capability. Returns false when no active membership.
 */
export function useCapability(capability) {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const workspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const role = workspace?.myRole;
  return role ? hasCapability(role, capability) : false;
}
