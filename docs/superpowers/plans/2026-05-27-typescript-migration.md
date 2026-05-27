# TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the workspace (packages/shared, apps/api, apps/web) to TypeScript.

**Architecture:** We will convert `packages/shared` to TS, configure `apps/api` to run via `tsx` (maintaining the "no build step" DX while supporting TS imports), and configure `apps/web` (Next.js) with standard TS setup. 

**Tech Stack:** TypeScript, tsx, Next.js, Express, Prisma

---

### Task 1: Root & Shared Dependencies Setup

**Files:**
- Modify: `package.json`
- Modify: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`

- [ ] **Step 1: Install TypeScript and tsx in root workspace**

```bash
npm install -D typescript tsx @types/node
```

- [ ] **Step 2: Update `packages/shared/package.json`**

```json
{
  "name": "@team-hub/shared",
  "version": "1.0.0",
  "private": true,
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "lint": "eslint src/"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 3: Create `packages/shared/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 4: Commit changes**

```bash
git add package.json packages/shared/package.json packages/shared/tsconfig.json
git commit -m "chore: setup typescript for root and shared package"
```

---

### Task 2: Convert `packages/shared` to TypeScript

**Files:**
- Create: `packages/shared/src/index.ts`
- Delete: `packages/shared/src/index.js`

- [ ] **Step 1: Convert `index.js` to `index.ts`**

Run this command:
```bash
Rename-Item -Path "packages/shared/src/index.js" -NewName "index.ts"
```

- [ ] **Step 2: Add types to `packages/shared/src/index.ts`**

Replace the bottom section of `index.ts` (where `hasCapability` and `module.exports` are) with the following standard ES6 exports and types:

```typescript
export function hasCapability(role: string, capability: string): boolean {
  return (ROLE_CAPABILITIES as Record<string, Set<string>>)[role]?.has(capability) ?? false;
}

export {
  ROLES,
  GOAL_STATUS,
  ACTION_ITEM_STATUS,
  PRIORITY,
  ACTIVITY_TYPES,
  NOTIFICATION_TYPES,
  INVITATION_STATUS,
  INVITATION_TTL_DAYS,
  WORKSPACE_ACCENT_PALETTE,
  SOCKET_EVENTS,
  CAPABILITIES,
  ROLE_CAPABILITIES,
};
```
Change all `const` declarations to `export const` and remove the `module.exports` block. 

- [ ] **Step 3: Build shared package**

```bash
npm run build --workspace=@team-hub/shared
```
Expected: PASS, creates `dist` directory.

- [ ] **Step 4: Commit changes**

```bash
git add packages/shared/
git commit -m "refactor: convert shared package to TypeScript"
```

---

### Task 3: API Backend Setup (`apps/api`)

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`

- [ ] **Step 1: Update API scripts and install types**

```bash
npm install -D @types/express @types/cookie-parser @types/cors @types/jsonwebtoken @types/bcryptjs @types/multer @types/swagger-ui-express @types/swagger-jsdoc --workspace=@team-hub/api
```

- [ ] **Step 2: Update `apps/api/package.json` scripts**

Change the `main` and scripts in `apps/api/package.json`:
```json
  "main": "src/index.ts",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "build": "echo 'No build step required for API'",
    "lint": "eslint src/",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts"
  },
```

- [ ] **Step 3: Create `apps/api/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*", "prisma/**/*"]
}
```

- [ ] **Step 4: Commit changes**

```bash
git add apps/api/package.json apps/api/tsconfig.json
git commit -m "chore: setup typescript for api backend"
```

---

### Task 4: API Code Conversion (`apps/api`)

**Files:**
- Modify: `apps/api/src/**/*.js` -> `.ts`

- [ ] **Step 1: Mass rename files to TypeScript**

```powershell
Get-ChildItem -Path "apps/api/src", "apps/api/prisma" -Filter "*.js" -Recurse | Rename-Item -NewName {$_.Name -replace '\.js$','.ts'}
```

- [ ] **Step 2: Verify API runs via TSX (allowing loose types initially)**

Run the dev server to see if it starts with TSX (it may have type errors if `strict` is true, but `tsx` skips type checking by default):
```bash
npm run dev --workspace=@team-hub/api
```
Expected: The API server starts. Note: further manual type fixes will be needed in subsequent work, but the execution pipeline is established.

- [ ] **Step 3: Commit changes**

```bash
git add apps/api/
git commit -m "refactor: rename api files to typescript"
```

---

### Task 5: Web Frontend Setup (`apps/web`)

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`

- [ ] **Step 1: Install Next.js TypeScript dependencies**

```bash
npm install -D @types/react @types/react-dom @types/node typescript --workspace=@team-hub/web
```

- [ ] **Step 2: Create `apps/web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Mass rename files to TypeScript**

```powershell
Get-ChildItem -Path "apps/web/src" -Filter "*.js" -Recurse | Where-Object { $_.Name -notmatch "jsconfig.json" } | Rename-Item -NewName {
    if ($_.Name -match "^page\.js$|^layout\.js$|components.*\.js$") {
        $_.Name -replace '\.js$','.tsx'
    } else {
        $_.Name -replace '\.js$','.ts'
    }
}
```
Rename `jsconfig.json` to `tsconfig.json` or just remove it since we created one.
```bash
Remove-Item -Path "apps/web/jsconfig.json"
```

- [ ] **Step 4: Verify Web starts**

```bash
npm run dev --workspace=@team-hub/web
```
Expected: Next.js server starts (it will generate `next-env.d.ts`). 

- [ ] **Step 5: Commit changes**

```bash
git add apps/web/
git commit -m "refactor: setup typescript for web frontend"
```
