const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient(); // seed scripts may instantiate a fresh client
const {
  GOAL_STATUS,
  ACTION_ITEM_STATUS,
  PRIORITY,
  ACTIVITY_TYPES,
  ROLES,
  INVITATION_TTL_DAYS,
} = require('@team-hub/shared');
const crypto = require('crypto');

const PASSWORD = 'demo1234';

const USER_DEFS = [
  { email: 'admin@demo.com', name: 'Demo Admin', role: ROLES.ADMIN },
  { email: 'alice@demo.com', name: 'Alice Smith', role: ROLES.MEMBER },
  { email: 'bob@demo.com', name: 'Bob Carter', role: ROLES.MEMBER },
  { email: 'cara@demo.com', name: 'Cara Lee', role: ROLES.MEMBER },
  { email: 'dan@demo.com', name: 'Dan Park', role: ROLES.MEMBER },
  { email: 'eve@demo.com', name: 'Eve Wright', role: ROLES.MEMBER },
  { email: 'frank@demo.com', name: 'Frank Allen', role: ROLES.MEMBER },
  { email: 'gita@demo.com', name: 'Gita Patel', role: ROLES.MEMBER },
  { email: 'henri@demo.com', name: 'Henri Dubois', role: ROLES.MEMBER },
  { email: 'iris@demo.com', name: 'Iris Chen', role: ROLES.ADMIN },
  { email: 'jorge@demo.com', name: 'Jorge Ruiz', role: ROLES.MEMBER },
  { email: 'kim@demo.com', name: 'Kim Nakamura', role: ROLES.MEMBER },
];

const GOAL_TITLES = [
  'Ship public beta',
  'Reduce p95 API latency below 200ms',
  'Onboard 50 design partners',
  'Launch mobile companion',
  'Refactor billing pipeline',
  'Hit SOC2 Type II readiness',
  'Reach $50k MRR',
  'Build team OKR dashboard',
  'Deprecate legacy auth provider',
  'Add SAML SSO',
  'Improve search relevance score by 20%',
  'Translate UI to 5 languages',
  'Reach 99.9% uptime',
  'Add real-time collaboration',
  'Run quarterly security review',
  'Cut infra cost by 25%',
  'Hire 4 senior engineers',
  'Launch academy program',
  'Reduce onboarding time below 5 minutes',
  'Replatform marketing site',
  'Reach 100 paying customers',
  'Polish kanban interactions',
  'Build automated CSV import',
  'Set up customer success playbooks',
  'Document the public API',
];

async function main() {
  console.log('Seeding…');
  await reset();

  const users = await Promise.all(
    USER_DEFS.map(async (u) => {
      return prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          password: await bcrypt.hash(PASSWORD, 10),
        },
      });
    })
  );

  const adminUser = users[0];

  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Product Team',
      description: 'Demo workspace seeded for the technical assessment.',
      accentColor: '#6366f1',
      createdById: adminUser.id,
    },
  });

  await prisma.workspaceMember.createMany({
    data: USER_DEFS.map((u, i) => ({
      userId: users[i].id,
      workspaceId: workspace.id,
      role: u.role,
    })),
  });

  // Goals
  const goals = [];
  for (let i = 0; i < GOAL_TITLES.length; i++) {
    const owner = users[i % users.length];
    const status = pick([
      GOAL_STATUS.NOT_STARTED,
      GOAL_STATUS.IN_PROGRESS,
      GOAL_STATUS.IN_PROGRESS,
      GOAL_STATUS.COMPLETED,
    ]);
    const dueDate = randomFutureDate(i);
    const goal = await prisma.goal.create({
      data: {
        title: GOAL_TITLES[i],
        description: `Demo description for ${GOAL_TITLES[i].toLowerCase()}.`,
        status,
        dueDate,
        ownerId: owner.id,
        createdById: adminUser.id,
        workspaceId: workspace.id,
      },
    });
    goals.push(goal);

    // 2-3 milestones each
    const count = 2 + (i % 2);
    for (let m = 0; m < count; m++) {
      await prisma.milestone.create({
        data: {
          title: `Milestone ${m + 1} for ${goal.title}`,
          progress:
            status === GOAL_STATUS.COMPLETED
              ? 100
              : Math.min(100, (m + 1) * 25),
          completedAt: status === GOAL_STATUS.COMPLETED ? new Date() : null,
          goalId: goal.id,
        },
      });
    }
  }

  // Action items (60)
  for (let i = 0; i < 60; i++) {
    const status = pick([
      ACTION_ITEM_STATUS.TODO,
      ACTION_ITEM_STATUS.TODO,
      ACTION_ITEM_STATUS.IN_PROGRESS,
      ACTION_ITEM_STATUS.DONE,
    ]);
    const priority = pick([
      PRIORITY.LOW,
      PRIORITY.MEDIUM,
      PRIORITY.MEDIUM,
      PRIORITY.HIGH,
      PRIORITY.URGENT,
    ]);
    const goal = i % 3 === 0 ? null : goals[i % goals.length];
    const assignee = users[(i * 7) % users.length];
    await prisma.actionItem.create({
      data: {
        title: `Demo task #${i + 1}`,
        description: 'Seeded action item for the demo.',
        priority,
        status,
        position: i,
        dueDate:
          i % 4 === 0
            ? randomFutureDate(i)
            : i % 5 === 0
              ? randomPastDate(i)
              : null,
        assigneeId: assignee.id,
        goalId: goal?.id || null,
        workspaceId: workspace.id,
      },
    });
  }

  // Announcements (10)
  const announcementBodies = [
    '<p>Welcome to the demo workspace. <strong>Have a poke around!</strong></p>',
    '<p>We just shipped the new <em>kanban</em> view — try dragging cards.</p>',
    '<p>Reminder: stand-up at 10am tomorrow.</p>',
    '<p>The audit log is now live for admins. Check the settings tab.</p>',
    '<p>New onboarding flow — feedback welcome.</p>',
    '<p>Big shout-out to the team for hitting beta.</p>',
    '<p>Holiday schedule for next month is posted.</p>',
    '<p>Q3 goals are open for editing.</p>',
    '<p>Please update your avatars 🙂</p>',
    '<p>End-of-quarter review on Friday.</p>',
  ];
  for (let i = 0; i < announcementBodies.length; i++) {
    const author = users[i % 2 === 0 ? 0 : 9];
    const a = await prisma.announcement.create({
      data: {
        title: `Update ${i + 1}`,
        content: announcementBodies[i],
        authorId: author.id,
        workspaceId: workspace.id,
        isPinned: i === 0,
        pinnedAt: i === 0 ? new Date() : null,
      },
    });
    if (i < 3) {
      // a few comments
      for (let c = 0; c < 2; c++) {
        await prisma.comment.create({
          data: {
            content: `Comment ${c + 1} on update ${i + 1}.`,
            authorId: users[(i + c) % users.length].id,
            announcementId: a.id,
          },
        });
      }
      // reactions
      for (let r = 0; r < 3; r++) {
        await prisma.reaction.create({
          data: {
            emoji: pick(['👍', '🎉', '❤️']),
            userId: users[(i + r + 2) % users.length].id,
            announcementId: a.id,
          },
        });
      }
    }
  }

  // Activity rows (30) — synthesized into the past
  for (let i = 0; i < 30; i++) {
    await prisma.activity.create({
      data: {
        type: pick([
          ACTIVITY_TYPES.GOAL_CREATED,
          ACTIVITY_TYPES.ACTION_ITEM_CREATED,
          ACTIVITY_TYPES.ANNOUNCEMENT_POSTED,
          ACTIVITY_TYPES.GOAL_STATUS_CHANGED,
        ]),
        message: `seeded activity ${i + 1}`,
        userId: users[i % users.length].id,
        workspaceId: workspace.id,
        createdAt: new Date(Date.now() - i * 60 * 60 * 1000), // backwards in time
      },
    });
  }

  // 2 pending invitations
  for (const email of ['invitee.one@demo.com', 'invitee.two@demo.com']) {
    await prisma.invitation.create({
      data: {
        email,
        role: ROLES.MEMBER,
        token: crypto.randomBytes(32).toString('hex'),
        expiresAt: new Date(
          Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000
        ),
        workspaceId: workspace.id,
        invitedById: adminUser.id,
      },
    });
  }

  console.log(
    `Seeded ${users.length} users, ${goals.length} goals, 60 action items, ${announcementBodies.length} announcements, 30 activities, 2 invitations.`
  );
  console.log('Demo credentials:');
  for (const u of USER_DEFS)
    console.log(`  ${u.email} / ${PASSWORD}  (${u.role})`);
}

async function reset() {
  // Clear in dependency order
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.reaction.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.actionItem.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomFutureDate(seed) {
  return new Date(Date.now() + (10 + ((seed * 3) % 30)) * 24 * 60 * 60 * 1000);
}
function randomPastDate(seed) {
  return new Date(Date.now() - (3 + ((seed * 5) % 14)) * 24 * 60 * 60 * 1000);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
