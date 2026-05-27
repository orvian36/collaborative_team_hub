# TypeScript Migration Design

## Purpose
Convert the existing JavaScript codebase (`apps/api`, `apps/web`, and `packages/shared`) to TypeScript to provide better type safety, developer experience, and code maintainability.

## Architecture & Tooling

### 1. Root & Shared Infrastructure
- Add `typescript` and `tsx` to the root workspace `devDependencies`.
- Add `@types/node` globally if necessary.
- **packages/shared**: 
  - Convert from JS to TS.
  - Export shared types, interfaces, and enums.
  - Emit CommonJS, allowing both the API and Web workspaces to easily import the package.
  - Add a build step `tsc --build` if required by Next.js/Turborepo for workspace dependencies, though standard Next.js transpilePackages might suffice.

### 2. API Backend (`apps/api`)
- **Execution Strategy**: Replace Node/Nodemon with `tsx` (`tsx watch src/index.ts` for dev, `tsx src/index.ts` for prod). This preserves the "no build step required" workflow while adding TS support.
- **Imports**: Write standard ES6 `import`/`export` syntax in TypeScript source files. Configure TypeScript (`tsconfig.json`) with `module: "CommonJS"` so it complies with the project rule ("Backend is CommonJS"). `tsx` will handle on-the-fly transpilation.
- **Dependencies**: Add `@types/express`, `@types/node`, `@types/cookie-parser`, `@types/cors`, `@types/jsonwebtoken`, etc.
- **File Conversions**: Convert all `.js` files to `.ts`. Add proper type annotations for Express requests, responses, middlewares, and Prisma models.

### 3. Web Frontend (`apps/web`)
- **Execution Strategy**: Next.js supports TypeScript out of the box. Next.js will auto-generate `tsconfig.json` upon first run, or we can provide a standard one.
- **Dependencies**: Add `@types/react`, `@types/react-dom`, `@types/node`.
- **File Conversions**: Rename `.js`/`.jsx` files to `.ts`/`.tsx`.
- **Typing**: Add types to React components, props, custom hooks, and Zustand stores.

## Data Flow & Boundaries
- `packages/shared` acts as the single source of truth for shared constants and models.
- Both the Web and API will import these types to ensure client-server contract safety.

## Testing & Verification
- Verify `apps/api` starts successfully with `tsx`.
- Verify `apps/web` builds and starts successfully with `next dev`.
- Ensure there are no type errors across workspaces by running `tsc --noEmit` locally during development.
