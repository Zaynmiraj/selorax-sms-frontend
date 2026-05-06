# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js 14 App Router frontend for SeloraX Messaging. Route files live in `app/`, with one directory per page such as `app/dashboard/page.js`, `app/campaigns/new/page.js`, and `app/billing/callback/page.js`. Shared feature components live in `components/`, while reusable Tailwind UI primitives are in `components/ui/`. App Bridge state is in `contexts/AppBridgeContext.js`; API and utility helpers are in `lib/api.js`, `lib/app-bridge.js`, and `lib/utils.js`. Longer implementation notes and plans belong under `docs/`.

## Build, Test, and Development Commands

Use Yarn; `yarn.lock` is committed.

- `yarn dev` starts the local Next dev server on port `5003`.
- `yarn build` creates a production build and is the main pre-merge verification command.
- `yarn start` serves the production build on port `5003`.

The messaging API defaults to `http://localhost:5002/api/messaging`; override it with `NEXT_PUBLIC_MESSAGING_API_URL` when needed.

## Coding Style & Naming Conventions

Use JavaScript and React function components. This codebase is client-rendered; existing pages and components use `"use client"`. Keep indentation at two spaces and follow the existing semicolon-free style. Name React components in `PascalCase` (`WalletCard.js`, `TopUpDialog.js`) and route folders in lowercase URL form (`history`, `scheduled`, `campaigns/new`). Compose Tailwind classes with `cn()` from `lib/utils.js` when conditional or merged classes are needed.

## Testing Guidelines

No test framework is currently configured. For now, validate changes with `yarn build` and manual checks in the relevant route. If adding tests, place them near the feature they cover and use clear names such as `SendSmsForm.test.js`. Cover App Bridge token handling, billing redirects, campaign flows, and SMS cost calculations when touching those areas.

## Commit & Pull Request Guidelines

Recent history is mixed, but the clearest convention is Conventional Commits, for example `feat(sms): live SMS preview for automations`. Prefer `type(scope): summary` with `feat`, `fix`, `chore`, or `docs`. Keep summaries imperative and specific.

Pull requests should include a short description, affected routes or components, verification performed (`yarn build`, manual pages checked), linked issue if applicable, and screenshots for UI changes.

## Security & Configuration Tips

Do not commit secrets or merchant credentials. Browser-exposed values must use `NEXT_PUBLIC_` intentionally. Preserve the App Bridge `postMessage` origin checks and session token retry behavior when editing `lib/app-bridge.js`, `contexts/AppBridgeContext.js`, or `lib/api.js`.
