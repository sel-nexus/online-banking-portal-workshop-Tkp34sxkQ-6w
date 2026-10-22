# Changelog

All notable changes to the Online Banking Portal are documented in this file.

## [1.0.0] - 2026-10-22

Initial demonstration release.

### Mocked access and session journeys

- Added local demonstration sign-in using synthetic credentials.
- Added profile-scoped sessions for Miguel Rosa and Rosa Santos.
- Added local session expiry, idle-warning, continue-session, sign-out, and lockout behavior.
- Added protected-route handling for authenticated banking journeys.
- Added safe redirects for unauthenticated, expired, unknown, and unavailable routes.
- Added local recovery guidance without sending requests to external services.
- Added clear simulation-only messaging and warnings against entering real credentials or personal information.

### Customer account journeys

- Added profile-scoped account lists and account detail views.
- Added account switching limited to accounts visible to the active customer profile.
- Added ownership checks that prevent access to another profile's accounts.
- Added balance summaries for checking, savings, credit-card, and loan accounts.
- Added account status, masked identifiers, currency, institution, opening date, and last-updated information.
- Added synthetic transaction enquiry journeys with account-specific transaction history.
- Added expandable transaction rows with status, direction, date, amount, and reference details.
- Added local transaction search, filtering, sorting, date ranges, and reset behavior.
- Added synthetic statement generation and local statement downloads.
- Added simulated transfers and payments areas with clear no-real-funds disclosures.

### Product catalogue and personalized offers

- Added a local catalogue of six synthetic banking products.
- Added product search and filtering by category, type, and status.
- Added detailed product views with illustrative rates, features, eligibility, terms, and amount ranges.
- Added simulated product interest and application actions.
- Added personalized and common offer fixtures with profile-scoped visibility.
- Added current-offer filtering based on the configured reference date.
- Added offer search and filtering by category, type, and status.
- Added detailed offer views with benefits, validity, eligibility, associated products, and illustrative terms.
- Added simulated offer-interest confirmation without submitting an application or redeeming an offer.
- Added user-safe unavailable and expired-product or offer states.

### Help, support, and chat

- Added synthetic Help & Support content, support channels, FAQs, support hours, branches, and ATM locations.
- Added local FAQ search and expandable answers.
- Added simulated contact and secure-message workflows.
- Added local secure-message validation for required fields, length limits, attachments, and sensitive information.
- Added simulated support receipts that exclude submitted message contents.
- Added scripted local chat support with topic suggestions and profile-aware replies.
- Added chat transcript, draft handling, minimize, restore, close, reset, and representative-escalation journeys.
- Added privacy warnings in support and chat surfaces to discourage sharing passwords, PINs, one-time passwords, and complete card numbers.
- Confirmed that support, chat, escalation, and contact workflows do not contact external services.

### Accessibility

- Added semantic landmarks, headings, forms, tables, lists, navigation, and status messaging.
- Added accessible labels and descriptions for interactive controls.
- Added visible keyboard focus styles and skip navigation.
- Added accessible modal and drawer components with:
  - Initial focus placement.
  - Keyboard focus trapping.
  - Escape-key handling.
  - Overlay click behavior.
  - Focus restoration.
- Added polite and assertive live regions for dynamic announcements.
- Added accessible validation messages associated with invalid fields.
- Added loading states using status semantics and `aria-busy`.
- Added accessible expandable transaction rows.
- Added accessible notification, profile, chat, confirmation, and session-warning interactions.
- Added automated accessibility component checks using Testing Library, axe-core, and jest-axe.

### Local persistence and privacy

- Added a reducer-backed local demonstration store with versioned, namespaced persistence.
- Added safe storage parsing, serialization, reset behavior, subscriptions, and migrations.
- Added persistence redaction for passwords, credentials, complete identifiers, contact details, session data, and other sensitive values.
- Added allow-listed, redacted local analytics events.
- Added local notification state, read tracking, selections, chat state, and facilitator controls.
- Added deterministic fixture behavior through `VITE_REFERENCE_DATE`.
- Added application-name configuration through `VITE_APP_NAME`.
- Confirmed that browser persistence is limited to synthetic demonstration state.
- Confirmed that no direct network APIs, external analytics SDKs, banking APIs, support APIs, or messaging APIs are used.

### Testing and quality

- Added unit coverage for fixture schemas and repositories.
- Added service tests for authentication, accounts, profiles, transactions, products, offers, support, chat, notifications, analytics, and session management.
- Added reducer and local persistence tests.
- Added component tests for accessibility primitives and transaction states.
- Added route journey tests covering authentication, navigation, profile switching, ownership protection, logout, reset, and public not-found behavior.
- Added privacy tests covering redaction, masked identifiers, synthetic disclosures, and secure chat guidance.
- Added no-network checks for source-code integrations and browser network primitives.
- Added Playwright Chromium smoke journeys for sign-in, navigation, account access, transaction enquiry, catalogue details, chat, failure recovery, logout, session handling, and reset behavior.
- Added CI checks for linting, unit tests, accessibility tests, privacy checks, no-network checks, production builds, and Playwright smoke tests.

### Setup and documentation

- Added Vite and React 19 application setup.
- Added Tailwind CSS styling and responsive layouts.
- Added React Router protected and public route structure.
- Added local fixture repositories and service boundaries.
- Added development, testing, coverage, accessibility, end-to-end, build, and preview commands.
- Added `.env.example` with optional reference-date and application-name settings.
- Added workshop scope, privacy boundaries, demo credentials, routes, architecture, fixture profiles, accessibility guidance, persistence guidance, and deployment notes to the project README.

### User stories

- SCRUM-2086 — Delivered the initial mocked banking access, profile-scoped account journeys, transaction enquiry, catalogue, offers, support, chat, accessibility, persistence, and testing foundations.
- SCRUM-2091 — Delivered the complete local demonstration experience with synthetic data, simulation disclosures, privacy protections, recoverable states, and documented setup and release behavior.