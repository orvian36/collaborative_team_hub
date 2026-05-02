-- AlterTable: Goal — add createdById (back-fill from ownerId for existing rows)
ALTER TABLE "Goal" ADD COLUMN "createdById" TEXT;
UPDATE "Goal" SET "createdById" = "ownerId" WHERE "createdById" IS NULL;
ALTER TABLE "Goal" ALTER COLUMN "createdById" SET NOT NULL;

-- AlterTable: Milestone — add dueDate, completedAt
ALTER TABLE "Milestone" ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "completedAt" TIMESTAMP(3);

-- AlterTable: Announcement — add pinnedAt
ALTER TABLE "Announcement" ADD COLUMN "pinnedAt" TIMESTAMP(3);

-- AlterTable: Comment — add mentionedUserIds
ALTER TABLE "Comment" ADD COLUMN "mentionedUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable: ActionItem — add position
ALTER TABLE "ActionItem" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Activity — add entityType, entityId
ALTER TABLE "Activity" ADD COLUMN "entityType" TEXT,
ADD COLUMN "entityId" TEXT;

-- AlterTable: Notification — add entityType, entityId, actorId
ALTER TABLE "Notification" ADD COLUMN "entityType" TEXT,
ADD COLUMN "entityId" TEXT,
ADD COLUMN "actorId" TEXT;

-- AddForeignKey: Goal.createdById -> User.id
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Announcement.authorId -> User.id (relation back-link added)
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Notification.actorId -> User.id
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: Announcement (workspaceId, isPinned, createdAt)
CREATE INDEX "Announcement_workspaceId_isPinned_createdAt_idx" ON "Announcement"("workspaceId", "isPinned", "createdAt");

-- CreateIndex: ActionItem (workspaceId, status, position)
CREATE INDEX "ActionItem_workspaceId_status_position_idx" ON "ActionItem"("workspaceId", "status", "position");

-- CreateIndex: Activity (workspaceId, createdAt)
CREATE INDEX "Activity_workspaceId_createdAt_idx" ON "Activity"("workspaceId", "createdAt");

-- CreateIndex: Activity (goalId, createdAt)
CREATE INDEX "Activity_goalId_createdAt_idx" ON "Activity"("goalId", "createdAt");

-- CreateIndex: Notification (userId, isRead, createdAt)
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");
