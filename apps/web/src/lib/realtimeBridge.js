'use client';

import { SOCKET_EVENTS } from '@team-hub/shared';
import { socketClient } from './socket';
import useGoalsStore from '@/stores/goalsStore';
import useMilestonesStore from '@/stores/milestonesStore';
import useActionItemsStore from '@/stores/actionItemsStore';
import useAnnouncementsStore from '@/stores/announcementsStore';
import useCommentsStore from '@/stores/commentsStore';
import useReactionsStore from '@/stores/reactionsStore';
import useNotificationsStore from '@/stores/notificationsStore';
import usePresenceStore from '@/stores/presenceStore';
import useAuditStore from '@/stores/auditStore';

let unsubscribers = [];

export function startRealtime(workspaceId) {
  stopRealtime();

  const goals = useGoalsStore.getState();
  const milestones = useMilestonesStore.getState();
  const items = useActionItemsStore.getState();
  const announcements = useAnnouncementsStore.getState();
  const comments = useCommentsStore.getState();
  const reactions = useReactionsStore.getState();
  const notifications = useNotificationsStore.getState();
  const presence = usePresenceStore.getState();
  const audit = useAuditStore.getState();

  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.GOAL_CREATED, (p) => goals.upsertGoal(p.goal))
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.GOAL_UPDATED, (p) => goals.upsertGoal(p.goal))
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.GOAL_DELETED, (p) =>
      goals.removeGoal(p.goalId)
    )
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.GOAL_STATUS_CHANGED, (p) =>
      goals.patchGoal(p.goalId, { status: p.status })
    )
  );

  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.MILESTONE_UPSERTED, (p) =>
      milestones.upsert(p.milestone)
    )
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.MILESTONE_DELETED, (p) =>
      milestones.removeLocal(p.goalId, p.milestoneId)
    )
  );

  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.ACTION_ITEM_CREATED, (p) =>
      items.upsert(p.actionItem)
    )
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.ACTION_ITEM_UPDATED, (p) =>
      items.upsert(p.actionItem)
    )
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.ACTION_ITEM_DELETED, (p) =>
      items.removeLocal(p.actionItemId)
    )
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.ACTION_ITEM_MOVED, (p) =>
      items.upsert(p.actionItem)
    )
  );

  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.ANNOUNCEMENT_NEW, (p) =>
      announcements.upsert(p.announcement)
    )
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.ANNOUNCEMENT_UPDATED, (p) =>
      announcements.upsert(p.announcement)
    )
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.ANNOUNCEMENT_PINNED, (p) =>
      announcements.upsert(p.announcement)
    )
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.ANNOUNCEMENT_DELETED, (p) =>
      announcements.removeLocal(p.announcementId)
    )
  );

  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.COMMENT_NEW, (p) =>
      comments.upsert(p.comment)
    )
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.COMMENT_DELETED, (p) =>
      comments.removeLocal(p.announcementId, p.commentId)
    )
  );

  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.REACTION_NEW, (p) =>
      reactions.upsert(p.reaction)
    )
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.REACTION_REMOVED, (p) =>
      reactions.removeLocal(p)
    )
  );

  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.USER_ONLINE, (p) =>
      presence.setOnline(p.userId)
    )
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.USER_OFFLINE, (p) =>
      presence.setOffline(p.userId)
    )
  );

  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.NOTIFICATION_NEW, (p) =>
      notifications.prepend(p.notification)
    )
  );
  unsubscribers.push(
    socketClient.on(SOCKET_EVENTS.ACTIVITY_NEW, (p) =>
      audit.prepend(p.activity)
    )
  );

  socketClient.connectAndJoin(workspaceId).then((ack) => {
    if (ack?.ok && Array.isArray(ack.onlineUserIds)) {
      const presence = usePresenceStore.getState();
      for (const id of ack.onlineUserIds) presence.setOnline(id);
    }
  });
}

export function stopRealtime() {
  for (const off of unsubscribers) off();
  unsubscribers = [];
  socketClient.leaveWorkspace();
  usePresenceStore.getState().reset();
}
