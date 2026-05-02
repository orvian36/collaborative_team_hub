'use client';

import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import { useParams, useRouter } from 'next/navigation';
import { CAPABILITIES } from '@team-hub/shared';
import { useCapability } from '@/hooks/useCapability';
import useAuthStore from '@/stores/authStore';
import useThemeStore from '@/stores/themeStore';

export default function CommandPalette() {
  const router = useRouter();
  const { workspaceId } = useParams();
  const [open, setOpen] = useState(false);
  const canCreateGoal = useCapability(CAPABILITIES.GOAL_CREATE);
  const canCreateAction = useCapability(CAPABILITIES.ACTION_ITEM_CREATE);
  const canCreateAnnounce = useCapability(CAPABILITIES.ANNOUNCEMENT_CREATE);
  const { logout } = useAuthStore();
  const { cycle: cycleTheme } = useThemeStore();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const go = (path) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40"
    >
      <Dialog.Title className="sr-only">Command Palette</Dialog.Title>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <Command.Input
          placeholder="Type a command…"
          className="w-full px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-700 bg-transparent focus:outline-none text-gray-900 dark:text-white"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-gray-500">
            No results.
          </Command.Empty>

          <Command.Group
            heading="Navigate"
            className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider"
          >
            <Item onSelect={() => go(`/dashboard/${workspaceId}`)}>
              Dashboard
            </Item>
            <Item onSelect={() => go(`/dashboard/${workspaceId}/goals`)}>
              Goals
            </Item>
            <Item
              onSelect={() => go(`/dashboard/${workspaceId}/announcements`)}
            >
              Announcements
            </Item>
            <Item onSelect={() => go(`/dashboard/${workspaceId}/action-items`)}>
              Action items
            </Item>
            <Item onSelect={() => go(`/dashboard/${workspaceId}/profile`)}>
              Your profile
            </Item>
            <Item onSelect={() => go(`/dashboard/${workspaceId}/settings`)}>
              Settings
            </Item>
          </Command.Group>

          <Command.Group
            heading="Create"
            className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider mt-2"
          >
            {canCreateGoal && (
              <Item
                onSelect={() => go(`/dashboard/${workspaceId}/goals?new=1`)}
              >
                New goal
              </Item>
            )}
            {canCreateAction && (
              <Item
                onSelect={() =>
                  go(`/dashboard/${workspaceId}/action-items?new=1`)
                }
              >
                New action item
              </Item>
            )}
            {canCreateAnnounce && (
              <Item
                onSelect={() =>
                  go(`/dashboard/${workspaceId}/announcements?new=1`)
                }
              >
                New announcement
              </Item>
            )}
          </Command.Group>

          <Command.Group
            heading="Actions"
            className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wider mt-2"
          >
            <Item
              onSelect={() => {
                setOpen(false);
                cycleTheme();
              }}
            >
              Toggle theme
            </Item>
            <Item
              onSelect={async () => {
                setOpen(false);
                await logout();
                router.push('/login');
              }}
            >
              Sign out
            </Item>
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}

function Item({ onSelect, children }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200 rounded cursor-pointer aria-selected:bg-primary-100 aria-selected:text-primary-900 dark:aria-selected:bg-primary-900/40 dark:aria-selected:text-primary-100"
    >
      {children}
    </Command.Item>
  );
}
