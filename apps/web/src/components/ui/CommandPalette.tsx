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
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/40 backdrop-blur-sm animate-fade-in"
    >
      <Dialog.Title className="sr-only">Command Palette</Dialog.Title>
      <div className="bg-[color:var(--surface)] rounded-2xl shadow-lift w-full max-w-lg border border-line overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-line">
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4 text-subtle"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="m13.5 13.5-3-3" />
          </svg>
          <Command.Input
            placeholder="Search or run a command…"
            className="flex-1 py-3.5 text-sm bg-transparent focus:outline-none text-fg placeholder:text-subtle"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded bg-[color:var(--surface-3)] font-mono text-[10px] text-subtle">
            esc
          </kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-subtle">
            No results.
          </Command.Empty>

          <Command.Group
            heading="Navigate"
            className="text-[11px] font-semibold text-subtle px-3 py-2 uppercase tracking-[0.14em]"
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
            className="text-[11px] font-semibold text-subtle px-3 py-2 uppercase tracking-[0.14em] mt-2"
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
            className="text-[11px] font-semibold text-subtle px-3 py-2 uppercase tracking-[0.14em] mt-2"
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
      className="px-3 py-2 text-sm text-fg rounded-lg cursor-pointer aria-selected:bg-[color:var(--surface-2)] aria-selected:text-fg flex items-center gap-2"
    >
      <span className="w-4 h-4 rounded-md bg-primary-600/12 grid place-items-center text-primary-700 dark:text-primary-300 text-[10px]">
        →
      </span>
      {children}
    </Command.Item>
  );
}
