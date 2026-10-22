# Online Banking Portal

A Vite and React demonstration portal for exploring profile-scoped online-banking journeys using synthetic fixture data.

This project is designed for workshop, facilitation, accessibility, privacy, and user-journey demonstrations. It is not a production banking application.

## Workshop scope boundary

This portal is a local simulation:

- All accounts, balances, transactions, products, offers, notifications, support content, and chat messages are synthetic.
- Sign-in uses local demonstration credentials and does not authenticate against a bank.
- Transfers, payments, product actions, offer interest, support messages, chat escalation, and statement downloads are simulated locally.
- No real funds are moved.
- No real applications, payments, transactions, support cases, or account changes are submitted.
- No external banking, support, analytics, or messaging service is contacted.
- Do not enter real passwords, card numbers, account numbers, PINs, one-time passwords, or other sensitive personal information.
- Browser persistence is limited to the local demo store and is redacted before storage where applicable.
- This project does not provide financial advice.

## Technology

- JavaScript
- React 19
- Vite
- React Router
- Tailwind CSS
- Vitest
- Testing Library
- axe-core and jest-axe
- Playwright

## Requirements

- Node.js 20 or later
- npm

## Setup

Install dependencies:

```bash
npm install
```

Create an environment file when required:

```bash
cp .env.example .env
```

Available environment variables:

- `VITE_REFERENCE_DATE` — optional reference date for deterministic date-dependent behavior.
- `VITE_APP_NAME` — optional application name displayed by the portal.

Start the development server:

```bash
npm run dev
```

The development server is available at `http://localhost:5173`.

## Available commands

Run the development server:

```bash
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run ESLint:

```bash
npm run lint
```

Run the unit and component test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run tests with coverage:

```bash
npm run test:coverage
```

Run accessibility-focused tests:

```bash
npm run test:a11y
```

Run the Playwright suite:

```bash
npm run test:e2e
```

Install the Playwright browser used by CI:

```bash
npx playwright install --with-deps chromium
```

## Demo credentials

The sign-in page provides synthetic credentials for workshop use:

- User ID: `miguel.rosa.demo`
- Password: `demo-password`

Additional accepted demonstration passwords are defined in `src/services/MockAuthService.js`. These credentials are local fixture values only and must not be reused for a real account.

## Routes

### Public routes

| Route | Purpose |
| --- | --- |
| `/login` | Local demonstration sign-in |
| `*` | Public not-found page |

### Protected routes

Protected routes require a valid local demonstration session.

| Route | Purpose |
| --- | --- |
| `/` | Dashboard |
| `/accounts` | Profile-scoped account list |
| `/accounts/:accountId` | Profile-scoped account details |
| `/transactions/:transactionId` | Transaction details |
| `/transfers` | Simulated transfers area |
| `/payments` | Simulated payments area |
| `/profile` | Profile area |
| `/support` | Help and Support |
| `/contact` | Simulated contact and secure-message workflow |
| `/products/:productId` | Product details and simulated interest |
| `/offers/:offerId` | Offer details and simulated interest |
| `*` | Protected not-found page |

Route definitions and route helpers are maintained in `src/config/routes.js`.

## Architecture

The application is composed in `src/App.jsx`:

1. `AppErrorBoundary` provides a recoverable application-level error state.
2. `AppProviders` composes the local demo store and feature providers.
3. `BrowserRouter` owns client-side routing.
4. `AppRoutes` defines public and protected route behavior.

### Providers

- `DemoStoreProvider` — reducer-backed local application state and redacted persistence.
- `AuthenticatedSessionProvider` — local sign-in, sign-out, session expiry, and protected-route access.
- `CustomerProfileProvider` — active profile, visible accounts, offers, and profile-scoped selection.
- `AnalyticsProvider` — local, allow-listed, privacy-safe synthetic analytics.
- `ToastProvider` — transient local toast messages.
- `AnnouncementProvider` — accessible live announcements.

### Services

Services use fixture repositories and local simulation utilities rather than network calls. Examples include:

- `AccountService`
- `AnalyticsService`
- `ChatService`
- `NotificationService`
- `OfferService`
- `ProductService`
- `ProfileService`
- `SessionManager`
- `SupportService`
- `TransactionService`

All asynchronous simulated operations expose loading and error behavior and use bounded local delays where appropriate.

## Fixture profiles

The portal includes two synthetic customer profiles:

### Miguel Rosa

- Profile ID: `profile-miguel-rosa`
- User ID: `user-miguel-rosa`
- Accounts:
  - Everyday Checking
  - High-Yield Savings
  - Platinum Credit Card
- Personalized offers include:
  - Get PHP 500 Cashback
  - Boost Your Savings

### Rosa Santos

- Profile ID: `profile-rosa-santos`
- User ID: `user-rosa-santos`
- Accounts:
  - Personal Checking
  - Home Loan
  - Emergency Savings
- Miguel-specific personalized offers are not exposed to Rosa.
- Common offers remain available according to profile-scoping rules.

Fixture data is defined under `src/fixtures/` and validated through `src/fixtures/fixtureSchemas.js` and `src/services/FixtureRepository.js`.

## Data and state boundaries

Profile-scoped data is resolved through `ProfileService` and related services:

- Accounts are filtered by profile ownership.
- Account detail routes reject accounts belonging to another profile.
- Personalized offers are filtered by profile segments.
- Transactions are limited to accounts visible to the active profile.
- Notifications and selections are maintained locally.
- Unknown or unavailable records return safe user-facing states rather than internal details.

## Accessibility

Accessibility is treated as a core application concern.

The portal includes:

- Semantic headings, landmarks, forms, tables, lists, and navigation.
- Accessible labels for controls and interactive elements.
- Keyboard-focusable controls with visible focus styles.
- Skip navigation to the main content.
- Modal focus placement, focus trapping, Escape handling, and focus restoration.
- Live regions for polite and assertive announcements.
- Validation messages associated with invalid fields through ARIA attributes.
- Loading states exposed with `aria-busy` and status semantics.
- Expandable transaction rows with accessible controls and relationships.
- Accessible notification, chat, profile, and confirmation interactions.

Reusable accessibility primitives are located in `src/components/accessibility/` and `src/utils/focusUtils.js`.

Run the accessibility component tests with:

```bash
npx vitest run src/components/AccessibilityComponents.test.jsx
```

## Privacy and no-network behavior

The application is intentionally designed without direct network access.

The codebase does not use:

- `fetch`
- `XMLHttpRequest`
- `WebSocket`
- `EventSource`
- `navigator.sendBeacon`
- External analytics SDKs
- External banking APIs
- External support or chat APIs

The no-network checks are maintained in:

```bash
npx vitest run tests/privacy.test.js tests/noNetwork.test.js --environment jsdom
```

Privacy protections include:

- No real credentials or personal information should be entered.
- Sensitive fields are removed by `src/utils/redaction.js`.
- Analytics payloads are allow-listed and redacted.
- Persisted demo state is written through `DemoStore` and `safeStorage`.
- Raw passwords, complete identifiers, contact details, and similar sensitive values are excluded from persistence and analytics payloads.
- User-visible error states avoid rendering raw internal exception details.

## Persistence

The local `DemoStore` uses browser storage only for synthetic demonstration state. It applies:

- A project namespace.
- A storage version.
- Versioned envelopes.
- Safe parsing and serialization.
- Optional migrations.
- Reset and subscription behavior.
- Redaction before application state persistence.

Do not use browser storage directly from application components. Use the approved local demo-store abstractions where persistence is appropriate.

## Folder structure

```text
.
├── .github/
│   └── workflows/
│       └── ci.yml
├── e2e/
│   └── ...
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── accessibility/
│   │   ├── accounts/
│   │   ├── catalogue/
│   │   ├── chat/
│   │   ├── feedback/
│   │   ├── session/
│   │   ├── shell/
│   │   ├── transactions/
│   │   └── ui/
│   ├── config/
│   ├── contexts/
│   ├── fixtures/
│   ├── hooks/
│   ├── pages/
│   ├── routing/
│   ├── services/
│   ├── store/
│   ├── styles/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── tests/
│   ├── e2e/
│   ├── noNetwork.test.js
│   └── privacy.test.js
├── .env.example
├── eslint.config.js
├── index.html
├── package.json
├── playwright.config.js
├── postcss.config.js
├── tailwind.config.js
├── vercel.json
├── vite.config.js
└── vitest.config.js
```

### Directory responsibilities

- `components/` — reusable presentation and interaction components.
- `config/` — routes, constants, messages, and application configuration.
- `contexts/` — React providers and feature context hooks.
- `fixtures/` — synthetic profiles, accounts, transactions, products, offers, notifications, chat, and support data.
- `hooks/` — reusable stateful and accessibility hooks.
- `pages/` — page-level feature components.
- `routing/` — route declarations and protected-route guards.
- `services/` — local fixture-backed business operations and simulated workflows.
- `store/` — reducer-backed application state and local demo persistence.
- `styles/` — Tailwind entry styles and accessibility utility styles.
- `utils/` — formatting, dates, focus management, redaction, announcements, storage, and download helpers.
- `tests/` — privacy, network, and browser journey tests.

## Testing strategy

Tests cover:

- Local authentication and lockout behavior.
- Fixture validation and profile ownership.
- Account, transaction, product, offer, support, chat, notification, and analytics services.
- Reducer and persistence behavior.
- Accessible component behavior.
- Protected route journeys.
- Privacy redaction.
- No-network guarantees.
- Playwright smoke journeys.

Tests should verify user-visible behavior and service contracts without depending on implementation details.

## CI

GitHub Actions runs:

1. Dependency installation.
2. ESLint.
3. Unit and component tests.
4. Accessibility tests.
5. Privacy and no-network tests.
6. Production build.
7. Playwright Chromium smoke tests.

The workflow is defined in `.github/workflows/ci.yml`.

## Deployment

The project can be deployed as a static Vite application. `vercel.json` includes a history fallback rewrite for client-side routes.

Before deploying, confirm that:

- No real credentials or personal data are present in fixtures.
- No network integrations have been added.
- The production build completes successfully.
- Privacy, accessibility, and no-network tests pass.
- The workshop-only boundary remains visible in the application.

## Private license statement

Copyright © 2026 Online Banking Portal contributors.

This project is private and proprietary. It is provided solely for authorized workshop, demonstration, testing, and educational use. No permission is granted to copy, modify, distribute, sublicense, publish, deploy for external users, or use this project or its assets for commercial or production banking purposes without prior written authorization from the project owner.

The synthetic data, branding, interface designs, source code, fixtures, documentation, and other project materials are not representations of a real banking service. Unauthorized use, disclosure, or redistribution is prohibited.