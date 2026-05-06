# Graph Report - collaborative_team_hub  (2026-05-06)

## Corpus Check
- 141 files · ~129,372 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 497 nodes · 381 edges · 179 communities (176 shown, 3 thin omitted)
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 48 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9aad5504`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 31|Community 31]]

## God Nodes (most connected - your core abstractions)
1. `broadcastToWorkspace()` - 19 edges
2. `useCapability()` - 12 edges
3. `main()` - 5 edges
4. `slug()` - 5 edges
5. `dateStr()` - 5 edges
6. `createInvitation()` - 5 edges
7. `streamCsv()` - 5 edges
8. `sendInvitationEmail()` - 5 edges
9. `useWorkspaceMembers()` - 5 edges
10. `createAnnouncement()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `deleteComment()` --calls--> `hasCapability()`  [INFERRED]
  apps/api/src/controllers/comments.js → packages/shared/src/index.js
- `useCapability()` --calls--> `hasCapability()`  [INFERRED]
  apps/web/src/hooks/useCapability.js → packages/shared/src/index.js
- `createActionItem()` --calls--> `broadcastToWorkspace()`  [INFERRED]
  apps/api/src/controllers/actionItems.js → apps/api/src/lib/socket.js
- `updateActionItem()` --calls--> `broadcastToWorkspace()`  [INFERRED]
  apps/api/src/controllers/actionItems.js → apps/api/src/lib/socket.js
- `deleteActionItem()` --calls--> `broadcastToWorkspace()`  [INFERRED]
  apps/api/src/controllers/actionItems.js → apps/api/src/lib/socket.js

## Communities (179 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (23): createActionItem(), deleteActionItem(), moveActionItem(), updateActionItem(), createAnnouncement(), deleteAnnouncement(), togglePin(), updateAnnouncement() (+15 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (12): ActionItemsPage(), AnnouncementCard(), CommentList(), AnnouncementsPage(), ReactionBar(), GoalDetailPage(), MilestoneList(), GoalsPage() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (17): createInvitation(), expireIfNeeded(), getInvitationByToken(), inviteUrlFor(), normalizeEmail(), resendInvitation(), ttlFromNow(), escapeAttr() (+9 more)

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (7): createWorkspace(), deleteWorkspace(), updateWorkspace(), uploadIcon(), validateWorkspaceInput(), destroyByPublicId(), uploadBuffer()

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (7): startRealtime(), stopRealtime(), connectAndJoin(), disconnect(), ensureSocket(), off(), on()

### Community 8 - "Community 8"
Cohesion: 0.27
Nodes (5): AnnouncementComposer(), getCaretCoordinates(), filterMembers(), MentionTextarea(), useWorkspaceMembers()

### Community 9 - "Community 9"
Cohesion: 0.53
Nodes (7): dateStr(), exportActionItems(), exportAnnouncements(), exportAudit(), exportGoals(), slug(), streamCsv()

### Community 13 - "Community 13"
Cohesion: 0.6
Nodes (5): main(), pick(), randomFutureDate(), randomPastDate(), reset()

### Community 19 - "Community 19"
Cohesion: 0.83
Nodes (3): completionByMonth(), getStats(), startOfCurrentWeek()

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `deleteComment()` connect `Community 0` to `Community 1`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `broadcastToWorkspace()` (e.g. with `createActionItem()` and `updateActionItem()`) actually correct?**
  _`broadcastToWorkspace()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `useCapability()` (e.g. with `ActionItemsPage()` and `AnnouncementsPage()`) actually correct?**
  _`useCapability()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._