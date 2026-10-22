# Deployment Guide

This document describes how to build, verify, preview, promote, and roll back the Online Banking Portal demonstration application.

The application is a static Vite and React demonstration portal. It uses synthetic fixture data and local browser state only. It is not a production banking service and must not be deployed or presented as a system that handles real credentials, funds, transactions, support requests, or personal information.

## Deployment boundary

The deployed application:

- Uses synthetic profiles, accounts, balances, transactions, products, offers, support content, and chat messages.
- Performs sign-in locally with demonstration credentials.
- Does not authenticate against a bank or external identity provider.
- Does not move real funds or submit real payments, transfers, applications, support cases, or account changes.
- Does not use banking APIs, support APIs, messaging APIs, analytics SDKs, or direct browser network APIs.
- Stores only local demonstration state through the approved redacted demo-store abstraction.
- Does not provide financial advice.
- Must not receive real passwords, card numbers, account numbers, PINs, one-time passwords, or other sensitive personal information.

## Requirements

Use the following tooling for local verification and deployment preparation:

- Node.js 20 or later
- npm
- A Vercel project for Vercel deployment, or a static hosting provider that supports SPA history fallbacks

Install dependencies from the repository root:

```bash
npm install
```

The repository uses Vite for production builds and does not require a server runtime.

## Environment configuration

The repository includes an environment template at `.env.example`:

```text
VITE_REFERENCE_DATE=
VITE_APP_NAME=Online Banking Portal
```

Copy the template for local development when required:

```bash
cp .env.example .env
```

### `VITE_REFERENCE_DATE`

`VITE_REFERENCE_DATE` is optional. It controls deterministic date-dependent fixture behavior, including offer validity and synthetic fixture dates.

Example:

```text
VITE_REFERENCE_DATE=2026-10-22T00:00:00.000Z
```

Use a fixed reference date for workshops, automated demonstrations, and repeatable screenshots. If it is omitted, the application uses its built-in demonstration reference date.

### `VITE_APP_NAME`

`VITE_APP_NAME` is optional and controls the configured application name displayed by the portal.

Example:

```text
VITE_APP_NAME=Online Banking Portal
```

Only non-sensitive, public demonstration configuration belongs in Vite environment variables. Do not place credentials, tokens, API keys, private keys, personal information, or production banking configuration in `.env` files. Values prefixed with `VITE_` are bundled into client-side JavaScript and must be treated as public.

## Vercel configuration

The repository contains `vercel.json` with a history fallback rewrite:

```json
{
  "rewrites": [
    {
      "source": "/((?!.*\\.).*)",
      "destination": "/index.html"
    }
  ]
}
```

This rewrite is required because the application uses client-side React Router routes such as:

- `/login`
- `/accounts`
- `/accounts/:accountId`
- `/transactions/:transactionId`
- `/products/:productId`
- `/offers/:offerId`
- `/support`
- `/contact`

Without the rewrite, directly loading a nested route or refreshing the browser can return a host-level 404 instead of allowing React Router to render the route.

### Recommended Vercel project settings

Configure the Vercel project with:

- Framework preset: `Vite`
- Root directory: repository root
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Node.js version: `20.x` or later
- SPA rewrite: provided by the committed `vercel.json`

Set `VITE_REFERENCE_DATE` and `VITE_APP_NAME` in the appropriate Vercel environment scope when deterministic behavior or custom branding is needed.

Use the same values across Preview and Production when the preview is intended to be promoted without behavioral differences.

## Local production verification

Run the complete local quality sequence from the repository root:

```bash
npm run lint
npm test
npx vitest run src/components/AccessibilityComponents.test.jsx
npx vitest run tests/privacy.test.js tests/noNetwork.test.js --environment jsdom
npm run build
```

The commands verify:

1. ESLint compliance.
2. Unit and component behavior.
3. Accessibility component behavior.
4. Privacy redaction and no-network constraints.
5. Successful Vite production bundling.

The equivalent CI workflow is defined in `.github/workflows/ci.yml`. CI also runs Playwright smoke tests after the quality job succeeds.

## Required build and test gates

A deployment candidate must not be promoted unless all applicable gates pass.

### Static analysis

```bash
npm run lint
```

The lint configuration rejects direct usage of restricted browser and network APIs, including:

- `fetch`
- `XMLHttpRequest`
- `WebSocket`
- `EventSource`
- Direct browser storage access from application components
- `navigator.sendBeacon`
- Browser cookies

### Unit and component tests

```bash
npm test
```

This runs the repository's Vitest suite, including fixture, service, reducer, persistence, component, accessibility, privacy, and route journey coverage under `src/`.

### Accessibility checks

```bash
npx vitest run src/components/AccessibilityComponents.test.jsx
```

The accessibility component checks cover reusable controls including dialogs, live regions, alerts, text inputs, buttons, focus placement, Escape handling, focus trapping, and focus restoration.

### Privacy and no-network checks

```bash
npx vitest run tests/privacy.test.js tests/noNetwork.test.js --environment jsdom
```

These checks confirm that:

- Sensitive values are removed from persisted state and analytics payloads.
- Account and user identifiers remain masked for display.
- Synthetic disclosures are present.
- Application source does not contain prohibited direct network integrations.
- Rendering does not invoke browser network primitives.

Do not bypass these checks by adding exceptions for a deployment environment. A deployment must preserve the local-only simulation boundary.

### Production build

```bash
npm run build
```

The build must complete successfully and produce the `dist/` directory. The `dist/` directory is generated output and is not committed to the repository.

### Browser smoke tests

Install the Playwright browser when needed:

```bash
npx playwright install --with-deps chromium
```

Run the configured smoke suite:

```bash
npm run test:e2e
```

The smoke suite covers representative journeys such as:

- Sign-in with synthetic credentials.
- Core protected-route navigation.
- Profile-scoped account access.
- Foreign-account protection.
- Transaction enquiry and local statement download.
- Product and offer detail routes.
- Chat support behavior.
- Simulated failure recovery.
- Logout and protected-route redirection.
- Session handling.
- Demonstration reset behavior.

For CI-equivalent execution:

```bash
CI=1 npx playwright test tests/e2e/e2e.spec.js
```

## Preview deployment

A preview deployment should be created for every candidate change before Production promotion.

Using the Vercel CLI, authenticate through the approved developer workflow and deploy from the repository root:

```bash
npx vercel
```

For a non-interactive preview deployment:

```bash
npx vercel --yes
```

Preview deployments must use synthetic configuration only. Confirm that:

- `VITE_APP_NAME` is a demonstration-safe name.
- `VITE_REFERENCE_DATE` is set when repeatability is required.
- No production credentials or personal information are configured.
- No external integrations have been added.
- The preview URL loads `/login`.
- Direct navigation to nested routes works after refresh.
- The privacy and no-network gates passed before preview creation.

Validate the preview manually using at least these routes:

```text
/login
/
/accounts
/accounts/account-miguel-checking
/products/product-high-yield-savings
/offers/offer-miguel-cashback-2026
/support
/contact
```

A protected route should redirect an unauthenticated visitor to `/login`. After signing in with the synthetic credentials, protected routes should render locally.

## Preview promotion

Promote only a preview that has passed the complete quality and smoke-test gates.

A typical Vercel promotion workflow is:

1. Open the preview deployment.
2. Confirm the preview URL, build identifier, commit, and environment scope.
3. Run the required browser smoke journeys against that preview.
4. Confirm nested-route refresh behavior.
5. Confirm the visible simulation-only and privacy disclosures.
6. Confirm that no real service integrations or sensitive environment variables are present.
7. Promote the verified deployment to Production through the Vercel dashboard or the organization's approved Vercel promotion process.
8. Recheck the Production URL after promotion.

If using the Vercel CLI, use the organization-approved promotion command and deployment identifier. Do not create a second build from a different commit during promotion unless the full verification sequence is repeated.

The promoted Production deployment must correspond exactly to the verified commit and preview artifact.

## Post-deployment verification

After deployment or promotion, perform a smoke check against the deployed URL:

1. Open the public URL and confirm the login page renders.
2. Confirm the application title and configured application name are correct.
3. Confirm the simulation-only warning is visible.
4. Confirm an unauthenticated visit to `/accounts` redirects to `/login`.
5. Sign in with:
   - User ID: `miguel.rosa.demo`
   - Password: `demo-password`
6. Confirm the dashboard renders with synthetic Miguel Rosa data.
7. Open Accounts and confirm profile-scoped accounts are displayed.
8. Open a product and offer detail route directly.
9. Refresh a nested route and confirm it does not return a host-level 404.
10. Open Help & Support and Contact us.
11. Confirm chat and secure-message interactions remain local and display simulation disclosures.
12. Sign out and confirm protected routes are inaccessible.
13. Inspect the browser developer tools Network panel during representative interactions. No banking, support, analytics, or messaging requests should be made.

Do not enter real credentials or personal information during post-deployment verification.

## Static-hosting limitations

This application can be hosted as static assets, but static hosting imposes important limitations:

- There is no backend session authority.
- Sign-in is a local demonstration flow, not identity verification.
- Client-side state can be reset, modified, or inspected by a visitor.
- Browser persistence is not a secure vault.
- There is no server-side authorization boundary.
- There is no server-side account ownership enforcement.
- There are no real-time banking, support, messaging, or payment integrations.
- Transfers, payments, product actions, offer actions, chat escalation, and secure messages are simulated locally.
- Statement downloads are locally generated synthetic files.
- Client-side route protection must not be treated as production access control.
- Vite environment variables are public after bundling.
- Static hosting cannot safely process confidential credentials or regulated financial data.
- The application does not provide production-grade audit logging, fraud controls, rate limiting, monitoring, incident response, or compliance controls.
- The application must not be connected to real accounts, payment rails, customer records, or production support systems without a separate security and architecture review.

This project is suitable for workshops, demonstrations, accessibility reviews, journey testing, and local facilitation only.

## Rollback

If a deployment introduces a regression:

1. Stop promoting additional previews or releases.
2. Record the affected Production deployment URL, commit, time, and observed behavior.
3. Use the hosting provider's deployment history to restore the last known-good deployment.
4. Prefer reverting to the exact previously verified deployment rather than rebuilding from an unverified working tree.
5. Confirm the rollback URL loads correctly.
6. Repeat the post-deployment checks, including nested-route refresh, protected-route redirection, privacy behavior, and no-network behavior.
7. Open a follow-up change that reproduces and fixes the issue.
8. Run the complete quality and smoke-test gates before attempting promotion again.

A rollback does not remove data that a visitor may have stored locally in their browser. The application should never be used with real personal or financial information, so users should be instructed to reset the demonstration state if a workshop environment behaves unexpectedly.

## Resetting local demonstration state

The application provides local demonstration reset behavior through the profile menu when authenticated. This resets the local demo store and invalidates the local protected session.

For a clean local browser test, clear the site's demonstration storage using the application's reset control or a fresh browser context. Do not access browser storage directly from application components or add ad hoc persistence during deployment troubleshooting.

## Release checklist

Before Production promotion, confirm all of the following:

- [ ] The change is committed to the intended branch.
- [ ] `npm install` completes successfully.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes.
- [ ] Accessibility checks pass.
- [ ] Privacy and no-network checks pass.
- [ ] `npm run build` passes.
- [ ] Playwright Chromium smoke tests pass.
- [ ] A preview deployment was created from the verified commit.
- [ ] Preview nested routes work on direct load and refresh.
- [ ] Preview uses only synthetic, public configuration.
- [ ] No real credentials or personal information exist in source, fixtures, environment variables, or deployment logs.
- [ ] No direct network integrations or external analytics integrations were added.
- [ ] Simulation-only and sensitive-data warnings are visible.
- [ ] Profile ownership and protected-route behavior were checked.
- [ ] Local chat, support, statement, transfer, payment, product, and offer actions remain simulations.
- [ ] The deployment can be rolled back to a known-good version.
- [ ] The promoted Production deployment matches the verified preview commit exactly.

## Support and ownership boundary

Deployment infrastructure must preserve the application's workshop-only scope. Any request to connect this portal to real authentication, real banking APIs, real support channels, production analytics, payment processing, customer data, or regulated financial workflows requires a separate product, security, privacy, compliance, and architecture review.