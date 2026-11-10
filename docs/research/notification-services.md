# Research: hosted notification services vs. building Notifications ourselves

## Question and context

**Question:** Which hosted notification services fit Cadence, and how do they compare to building Notifications ourselves?

**Cadence constraints (from the brief):**

- React Router SSR app in framework mode, with Drizzle ORM on a single SQLite file. The repo's `package.json` pins `react-router` / `@react-router/*` at **8.3.0** and uses `better-sqlite3` with `journal_mode = WAL` (`app/db/index.ts`). The brief says "v7". Framework-mode APIs such as resource routes and `useRevalidator` are the same concepts in both versions, but anyone reading this should know about the version mismatch.
- Recipients are **Students** and **Instructors**.
- Channels: an **in-app inbox** (core) plus **email**.
- Only event-triggered Notifications, such as a comment on an Instructor's lesson or a reply to a Student's comment. No scheduled nudges, no marketing, no push.

**Options compared:** Knock, Novu, Courier, MagicBell, SuprSend (included as an extra contender), and a home-built option: a SQLite `notifications` table via Drizzle, plus Resend or Postmark for email.

**Considered and not included:** Engagespot. I did not research it enough to cite primary sources, so it is left out. I am not judging whether it fits.

This document does not recommend a vendor. It sets out neutral trade-offs only.

## Method and date accessed

- All sources were accessed on **2026-11-10**.
- I used WebSearch to find pages and WebFetch to read them, and followed claims back to the vendor's own docs, pricing pages, GitHub repos/licence files, or the npm registry (`registry.npmjs.org/<pkg>/latest`, queried with curl).
- Pricing pages were read on 2026-11-10. Their URLs are given inline.
- Some search results were summaries of vendor docs. Where I then opened the page itself, the citation points to it. Claims I could only see in search snippets are marked **(snippet-level)**.
- **Inferred** marks my own reasoning rather than something a source states.
- I did not install or run any SDK. Statements about SSR behaviour come from docs and package metadata, not from testing.

## Summary comparison

| Option | In-app inbox (React / SSR) | Email | Real-time | Preferences / unsubscribe | Identity & data leaving app | Local dev / test | Pricing (small scale, read 2026-11-10) | Self-host / lock-in |
|---|---|---|---|---|---|---|---|---|
| **Knock** | `@knocklabs/react`: prebuilt feed, popover and bell, plus headless hooks. Required CSS import. No SSR guidance in docs. `next` is an *optional* peer dependency. | Bring your own provider (Resend and Postmark both supported). Visual block editor, HTML/CSS code editor, layouts, MJML. A "Knock (testing only)" provider exists. | WebSocket push of badge counts (`new-message` event, "might be throttled"). | PreferenceSet per channel, channel type, workflow and category. Hosted or custom preference centre. 1-click unsubscribe headers only for workflows marked *commercial*; exact header names not documented. | User id plus email/name sent to Knock. Feed requests can be signed with an RS256 user JWT ("enhanced security"); without it, public key + user id is enough to read any feed. | Development/production environments, CLI to pull/push workflows, sandbox mode. No offline mode documented. | Free: 10,000 messages/mo. Starter: $250/mo with 50k messages, then $0.005 each. | Cloud only (SDKs MIT). Feed items kept "indefinitely". Message logs kept 30 days on non-Enterprise plans. No bulk export found. |
| **Novu** | `@novu/react` `<Inbox/>` (Bell, Notifications, Preferences), plus headless hooks and style overrides. Remix quickstart exists, with no SSR caveats stated. | Bring your own provider (Resend, Postmark, SMTP and others). Block editor and HTML editor; Resend + React Email via custom code steps. A demo email integration exists. | Real-time unread count. The self-hosted stack has a dedicated WS service, and the Inbox takes a `socketUrl` prop. | Per-workflow and global channel preferences, with a Preferences component. **No unsubscribe links by default**; you build the link yourself. List-Unsubscribe headers not mentioned. | `subscriberId` (your user id). HMAC-SHA256(secretKey, subscriberId) as `subscriberHash`; when HMAC is on, the Inbox won't load without it. | Dev and Prod environments. `npx novu dev` tunnels Novu Cloud to your local bridge, so it needs network. Self-host via Docker is possible (MongoDB, Redis, API, worker, WS, dashboard). | Free: 10,000 workflow runs/mo, 5 workflows, Novu branding. Pro: from $30/mo for 30k runs, then $1.20 per 1k. | Core is MIT (`enterprise/` folder is commercial). Community self-host lacks snooze, branding removal, email activity tracking, RBAC; limited to 1 team member. |
| **Courier** | `@trycourier/courier-react` (React 18+): `<CourierInbox/>`, popup menu, toast, preferences; `useCourier()`. Docs: renders **client-side only**; Next.js files need `'use client'`. | Bring your own provider (13 listed, including Resend and Postmark). Visual editor, or reuse provider templates. | WebSocket via `inbox.listenForUpdates()`. Without that call, the inbox loads once and doesn't update. | Topic preferences, hosted preference page, `<CourierPreferences/>`. List-Unsubscribe header per topic, but provider support is unclear (see open questions). | Backend mints a JWT through `POST /auth/issue-token` with `user_id:` scope. The SDK doesn't refresh tokens, and omitting `expires_in` gives a token that never expires. The recipient's email lives on the Courier profile. | Test and Production environments with separate keys. The Test testing provider only delivers to the signup address. Mock keys are Enterprise only. | Free (Developer): 10k sends/mo. Business: $0.005/send. The pricing page doesn't say which plans include Inbox. | No self-host found (**inferred** cloud only). SDK MIT. |
| **MagicBell** | `@magicbell/react`: ContextProvider, Inbox, FloatingInbox, UserPreferences, Toasts. CSS custom properties. No hooks documented on that page. No SSR notes. | Email providers listed: SES, Mailgun, SMTP, SendGrid, Ping Email. **Resend and Postmark not listed.** Template authoring not documented. | "Persistent connection" for real time; transport not named. | Per channel and category. Unsubscribe not documented. | HS256 user JWT signed with the project secret, carrying `user_email` and/or `user_external_id`. | Not documented in the pages read. | Free: 1,000 deliveries/mo. Startup: $249/mo for 50k, then $0.0025 each. Each channel counts as one delivery. | Cloud only. `magicbell-js` repo is under a **proprietary** licence agreement. The npm package lists no licence. |
| **SuprSend** (extra contender) | `@suprsend/react` `<Inbox/>`, embeddable and headless; the inbox handles WebSocket itself. | Bring your own provider (Resend and Postmark both documented). Handlebars in subject lines. | WebSocket (`initializeSocketConnection()` for custom UIs). | Global channel, category, and per-category channel opt-outs. Adds List-Unsubscribe **and** List-Unsubscribe-Post headers; automatic one-click for categories marked "Is commercial" **(snippet-level)**. | ES256 JWT with `entity_id` = distinct_id. HMAC is legacy and now only used for mobile. | Not researched in depth. | Free: 10k notifications/mo, feed carries SuprSend branding. Essentials: $100/mo for 50k, then $2 per 1k. | Self-host on Enterprise only. React inbox package MIT on npm. |
| **Home-built** (SQLite + Drizzle + Resend/Postmark) | Our own `notifications` table and React components; fully SSR (loaders render the inbox server-side). No vendor client code. | **Resend:** React Email templates (`email dev` local preview). **Postmark:** templates or raw HTML, separate transactional and broadcast Message Streams. | Polling or focus revalidation via `useRevalidator` (documented). Server-Sent Events via a resource route returning a streaming `Response` (**inferred**; React Router docs don't cover SSE). SQLite WAL allows one writer at a time with concurrent readers, on a single host. | We build preferences ourselves. Resend: we add List-Unsubscribe headers; automatic suppression of bounces and complaints applies to transactional sends too. Postmark: transactional streams default to no unsubscribe handling, our headers are passed through, and broadcast streams add RFC 8058 headers automatically. | Only the recipient's email address and the rendered email go to the email provider. Inbox data stays in SQLite. | Fully offline for the inbox (tests already use in-memory SQLite). Email: Resend test addresses (`delivered@resend.dev` and others, which count toward quota). Postmark `POSTMARK_API_TEST` token, Sandbox servers, blackhole/bounce addresses. | Resend free: 3,000/mo, capped at 100/day. Pro: $20/mo for 50k. Postmark free: 100/mo with no overage. Basic: $15/mo for 10k, then $1.80 per 1k. | No vendor lock-in for inbox data. Email provider is swappable behind one send function (**inferred**). We own all the code and its maintenance. |

## Per-option findings

### Knock

**In-app inbox**

- `@knocklabs/react` provides `NotificationFeedPopover`, `NotificationFeed` and `NotificationIconButton`, which shows the unread or unseen count ([docs.knock.app/in-app-ui/react/overview](https://docs.knock.app/in-app-ui/react/overview)).
- It can be used "in a headless way" with "a complete set of React hooks" ([same](https://docs.knock.app/in-app-ui/react/overview)).
- The README requires `import "@knocklabs/react/dist/index.css"` "unless you're overriding the styling" ([README via jsDelivr](https://cdn.jsdelivr.net/npm/@knocklabs/react/README.md)).
- `KnockProvider` has an `enabled` prop. When it is false, the provider renders its children but the client stays idle ([same](https://cdn.jsdelivr.net/npm/@knocklabs/react/README.md)).

**SSR**

- Neither the overview nor the README gives SSR, `'use client'` or Next.js guidance ([overview](https://docs.knock.app/in-app-ui/react/overview), [README](https://cdn.jsdelivr.net/npm/@knocklabs/react/README.md)).
- Knock's Next.js 15 tutorial (dated 23 May 2025) doesn't discuss SSR or hydration either ([knock.app blog](https://knock.app/blog/how-to-add-an-in-app-notification-feed-to-nextjs-15)).
- The npm metadata for v0.15.1 (published 2026-11-06) declares `next` and `@tanstack/react-router` as **optional** peer dependencies, alongside `react` ^17–19 ([registry.npmjs.org/@knocklabs/react/latest](https://registry.npmjs.org/@knocklabs/react/latest)). React Router is not listed.
- **Inferred:** with no RR7/RR8-specific integration documented, Cadence would likely mount the feed client-side only, for example after hydration. This has not been verified.

**Email**

- Knock delivers through downstream providers, including Postmark, Resend, SES, SMTP and others ([docs.knock.app/integrations/email/overview](https://docs.knock.app/integrations/email/overview)).
- Templates can be written in a drag-and-drop block editor or a raw HTML/CSS editor, with layouts, MJML support and auto-generated plain text ([same](https://docs.knock.app/integrations/email/overview)).
- "Knock (testing only)" is a listed provider, and a sandbox mode is described ([same](https://docs.knock.app/integrations/email/overview)).

**Real-time**

- Knock has a "real-time web socket connection for your users to subscribe to new messages" ([docs.knock.app/in-app-ui/api-overview](https://docs.knock.app/in-app-ui/api-overview)).
- The `new-message` event carries badge-count metadata, not full message content, and "Might be throttled" ([same](https://docs.knock.app/in-app-ui/api-overview)).
- `FeedMetadata` has `unread_count` and `unseen_count` ([same](https://docs.knock.app/in-app-ui/api-overview)).

**Preferences and unsubscribe**

- A PreferenceSet has `categories`, `channels`, `channel_types` and `workflows`. Preferences are opt-out by default (unset means enabled), and a message sends only if all applicable preferences are true ([docs.knock.app/preferences/overview](https://docs.knock.app/preferences/overview)).
- There is a hosted preference centre via a signed URL, which supports only the `default` set. You can also build a custom one against the API ([same](https://docs.knock.app/preferences/overview)).
- 1-click unsubscribe applies only to commercial/promotional notifications. It sets `commercial_subscribed=false`, and transactional messages continue ([same](https://docs.knock.app/preferences/overview)).
- Marking a workflow as commercial "Adds required unsubscribe headers to all emails sent through that workflow". The page doesn't name the headers ([docs.knock.app/preferences/commercial-unsubscribe](https://docs.knock.app/preferences/commercial-unsubscribe)).

**Identity**

- The client sends the public API key plus `user.id` ([docs.knock.app/in-app-ui/security-and-authentication](https://docs.knock.app/in-app-ui/security-and-authentication)).
- Without enhanced security, "Knock will not reject requests that do not include a signed user token", so anyone with the public key can act as any user ([same](https://docs.knock.app/in-app-ui/security-and-authentication)).
- With enhanced security, the backend signs an RS256 JWT (`sub` required) using `KNOCK_SIGNING_KEY`. The Node helper `signUserToken` defaults to 3600 s ([same](https://docs.knock.app/in-app-ui/security-and-authentication)).
- Users are identified with `PUT /v1/users/{id}`. Only `id` is required; `email` is needed for the email channel. Custom properties can be up to 256 kB ([docs.knock.app/managing-recipients/identifying-recipients](https://docs.knock.app/managing-recipients/identifying-recipients), snippet-level).

**Local dev and testing**

- Enabling environments adds a development environment, and changes are committed and promoted ([docs.knock.app/version-control/environments](https://docs.knock.app/version-control/environments), snippet-level).
- The CLI can pull and push workflows into the repo and fits CI/CD ([docs.knock.app/developer-tools/knock-cli](https://docs.knock.app/developer-tools/knock-cli), [docs.knock.app/tutorials/integrating-into-cicd](https://docs.knock.app/tutorials/integrating-into-cicd); snippet-level).
- I found no documented offline or local emulator mode.

**Pricing** ([knock.app/pricing](https://knock.app/pricing), read 2026-11-10)

- Free: 10,000 messages/month. A message is "a single message delivered to a single user on a single channel"; messages blocked by preferences are not billed.
- Knock does not hard-cap the free tier.
- Starter: $250/month with 50k messages, then $0.005 each.
- Preferences and environments are unlimited on all plans. Log retention is 30 days on Free and Starter.
- **Inferred:** an in-app message plus an email for the same event counts as 2 messages.

**Self-host and lock-in**

- The JS SDK monorepo is MIT ([github.com/knocklabs/javascript](https://github.com/knocklabs/javascript)). I found no backend source.
- Message log data (contents, events, delivery logs) is kept 30 days on non-Enterprise plans and 90 days on Enterprise. "In-app feed notifications are available indefinitely" via the feed endpoint ([docs.knock.app/manage-your-account/data-retention](https://docs.knock.app/manage-your-account/data-retention)).
- Data warehouse sync exists but is gated by plan ([snippet-level](https://docs.knock.app/manage-your-account/data-retention)).
- I found no self-serve bulk export of feed or preference data.

### Novu

**In-app inbox**

- `@novu/react` needs React 18 or later (19 supported). `@novu/js` is framework-agnostic. Both offer headless hooks, and you can "Override styles, replace every UI elements and icons" ([docs.novu.co/platform/inbox/overview](https://docs.novu.co/platform/inbox/overview)).
- The Inbox is composed of Bell, Notifications, InboxContent and Preferences ([same](https://docs.novu.co/platform/inbox/overview)).
- The Remix quickstart renders a plain component in `root.tsx` with no ClientOnly wrapper or hydration notes. A `subscriberId` that doesn't exist yet is auto-created ([docs.novu.co/platform/quickstart/remix](https://docs.novu.co/platform/quickstart/remix)).
- npm: v3.19.2, licence ISC ([registry.npmjs.org/@novu/react/latest](https://registry.npmjs.org/@novu/react/latest)).

**Email**

- "You must set up each provider individually." Novu does not send email itself. A demo email integration exists for a first test, with no limits stated ([docs.novu.co/platform/integrations/email](https://docs.novu.co/platform/integrations/email)).
- Resend and Postmark integrations are documented ([Resend](https://docs.novu.co/platform/integrations/email/resend), [Postmark](https://docs.novu.co/platform/integrations/email/postmark); snippet-level).
- The block editor and HTML editor are available on both Cloud and self-hosted ([docs.novu.co/community/self-hosted-and-novu-cloud](https://docs.novu.co/community/self-hosted-and-novu-cloud)).

**Real-time**

- The Inbox "manages the real-time unread count displayed on the bell icon" ([overview](https://docs.novu.co/platform/inbox/overview)).
- The transport isn't named on that page. However, the production guide has a `socketUrl` prop ([prepare-for-production](https://docs.novu.co/platform/inbox/prepare-for-production)), and the self-hosted stack runs a "WS" WebSocket service on port 3002 ([deploy-with-docker](https://docs.novu.co/community/self-hosting-novu/deploy-with-docker)).

**Preferences and unsubscribe**

- "By default, Novu does not add any unsubscribe links to the email." To add one, you build a secured link in your app, call the preferences API, and pass the link in the trigger payload (`{{payload.unsubscribeEmail}}`) ([docs.novu.co/platform/integrations/email](https://docs.novu.co/platform/integrations/email)).
- List-Unsubscribe headers are not mentioned.

**Identity**

- `subscriberId` is "typically the user's id in your database" ([remix quickstart](https://docs.novu.co/platform/quickstart/remix)).
- HMAC: `subscriberHash` = HMAC-SHA256(secretKey, subscriberId), computed on the server. "If HMAC encryption is active … and `subscriberHash` is not provided, the Inbox will not load" ([prepare-for-production](https://docs.novu.co/platform/inbox/prepare-for-production)).
- Removing Novu branding from the Inbox and emails requires a paid plan ([same](https://docs.novu.co/platform/inbox/prepare-for-production)).

**Local dev and testing**

- The free tier includes 2 environments (Dev and Prod) ([novu.co/pricing](https://novu.co/pricing)).
- `npx novu dev` creates a tunnel from Novu Cloud to a local bridge endpoint, by default `localhost:4000/api/novu` ([docs.novu.co/framework/studio](https://docs.novu.co/framework/studio), snippet-level). So it needs network access.
- Self-hosting via Docker gives a local stack: MongoDB, Redis, API, worker, WS and dashboard ([deploy-with-docker](https://docs.novu.co/community/self-hosting-novu/deploy-with-docker)).

**Pricing** ([novu.co/pricing](https://novu.co/pricing), read 2026-11-10)

- Free: 10,000 workflow runs/month, 5 workflows, 3 team members, 24 h activity-feed retention.
- Pro: from $30/month for 30k+ runs, then $1.20 per 1k; 20 workflows; 7-day retention.
- Self-hosted with support is on Enterprise.

**Self-host and lock-in**

- "Core technology is fully open source, licensed under MIT". The `enterprise` folder is under a commercial licence ([github.com/novuhq/novu](https://github.com/novuhq/novu)).
- Community self-host lacks snooze, branding removal, email activity tracking, custom environments and RBAC, and allows max 1 team member ([self-hosted-and-novu-cloud](https://docs.novu.co/community/self-hosted-and-novu-cloud)).
- Docker defaults are "not optimal for production". Migrations are manual ([deploy-with-docker](https://docs.novu.co/community/self-hosting-novu/deploy-with-docker)).
- **Inferred:** self-hosting adds MongoDB and Redis next to Cadence's single SQLite file. That is significant extra operational surface for this app.

### Courier

**In-app inbox**

- There are two packages: `@trycourier/courier-react` (React 18+) and `-17` ([courier.com/docs/platform/inbox/web/react-sdk](https://www.courier.com/docs/platform/inbox/web/react-sdk)).
- Components are `<CourierInbox/>`, `<CourierInboxPopupMenu/>`, `<CourierToast/>` and `<CourierPreferences/>`, plus the `useCourier()` hook. You can "Theme it, handle clicks, replace parts of it" ([same](https://www.courier.com/docs/platform/inbox/web/react-sdk)).
- **SSR:** "Courier Inbox and Toast render client-side only". Next.js 13+ files using them need `'use client'` ([same](https://www.courier.com/docs/platform/inbox/web/react-sdk)).
- npm: v9.3.5, MIT ([registry](https://registry.npmjs.org/@trycourier/courier-react/latest)).

**Email**

- Courier lists 13 email providers, including Resend and Postmark. You bring your own API key and a verified From address ([courier.com/docs/external-integrations/email/intro-to-email](https://courier.com/docs/external-integrations/email/intro-to-email), [Resend](https://www.courier.com/docs/integrations/email/resend); snippet-level).

**Real-time**

- `inbox.listenForUpdates()` "opens the realtime connection". Without it, the inbox loads once and doesn't update ([react-sdk](https://www.courier.com/docs/platform/inbox/web/react-sdk)).
- A search snippet describes the connection as a WebSocket ([snippet-level](https://www.courier.com/docs/platform/inbox/web/react-sdk)).

**Preferences and unsubscribe**

- Courier has a hosted preference page and an embeddable one ([preferences-editor](https://courier.com/docs/platform/preferences/preferences-editor)).
- "When a user opts out of a topic, Courier can add a `List-Unsubscribe` header … you enable it in your email provider's settings". The page names SendGrid and Mailgun as examples and doesn't mention `List-Unsubscribe-Post` ([same](https://courier.com/docs/platform/preferences/preferences-editor)).
- A search snippet claimed SendGrid is currently the only provider where Courier emits these headers. I could not confirm this on the page itself (see open questions).

**Identity**

- The backend calls `POST /auth/issue-token` with scope `user_id:<id> inbox:read:messages inbox:write:events …` ([courier.com/docs/platform/inbox/authentication](https://www.courier.com/docs/platform/inbox/authentication)).
- Omitting `expires_in` "mints a token that never expires". The SDKs don't refresh tokens ([same](https://www.courier.com/docs/platform/inbox/authentication)).
- The recipient email must be on the Courier profile ([Resend integration, snippet-level](https://www.courier.com/docs/integrations/email/resend)).

**Local dev and testing**

- Test and Production are separate environments with scoped keys. The Test environment's built-in testing provider delivers only to the signup address. Mock keys, which simulate sending without the provider, are listed under Enterprise ([courier.com/docs/platform/workspaces/environments-api-keys](https://courier.com/docs/platform/workspaces/environments-api-keys), snippet-level).

**Pricing** ([courier.com/pricing](https://www.courier.com/pricing), read 2026-11-10)

- Developer: free up to 10k sends/month.
- Business: $0.005 per send.
- The page lists Inbox as a product but doesn't show which plans include it.

**Self-host**

- I found none. **Inferred:** Courier is cloud only.

### MagicBell

**In-app inbox**

- `@magicbell/react` has `ContextProvider` (required `token` prop), `Inbox`, `FloatingInbox`, `UserPreferences`, `ToastContainer` and others ([magicbell.com/docs/libraries/magicbell-react](https://www.magicbell.com/docs/libraries/magicbell-react)).
- Styling uses CSS custom properties such as `--magicbell-bg-default`. Some buttons accept `unstyled` ([same](https://www.magicbell.com/docs/libraries/magicbell-react)).
- No hooks or SSR notes on that page.
- npm v1.14.0 (published 2026-07-29) lists no licence field ([registry](https://registry.npmjs.org/@magicbell/react)).

**Email**

- Providers are Mailgun, Amazon SES, SMTP, SendGrid and Ping Email. **Resend and Postmark are not listed** ([magicbell.com/docs/channels/email](https://www.magicbell.com/docs/channels/email)).
- **Inferred:** SMTP might reach Resend or Postmark through their SMTP endpoints. Not verified.

**Real-time**

- "MagicBell maintains a persistent connection to deliver notifications in real-time". The transport isn't named ([magicbell.com/docs/channels/in_app](https://www.magicbell.com/docs/channels/in_app)).

**Preferences**

- Per channel and per category ([same](https://www.magicbell.com/docs/channels/in_app)).
- Unsubscribe is not documented on the pages I read.

**Identity**

- User JWT "signed with your project's Secret Key using the HS256 algorithm". The claims are `user_email` and/or `user_external_id` plus `api_key` ([magicbell.com/docs/api/authentication/user](https://www.magicbell.com/docs/api/authentication/user)).

**Pricing** ([magicbell.com/pricing](https://www.magicbell.com/pricing), read 2026-11-10)

- Builder (free): 1,000 deliveries/month.
- Startup: $249/month for 50k, then $0.0025 each.
- Each channel per user counts as one delivery: 100 in-app plus 50 email = 150.

**Licence**

- The `magicbell-js` SDK monorepo's LICENSE is a proprietary "LICENSE AGREEMENT" granting a "limited, personal, non-exclusive … license" ([raw LICENSE](https://raw.githubusercontent.com/magicbell/magicbell-js/main/LICENSE)).
- I didn't confirm whether the current `@magicbell/react` is built from that repo.

### SuprSend (extra contender)

**Fit**

- SuprSend has a React inbox, supports Resend and Postmark, and has preference categories. Of the vendors here, it is the only one with documented List-Unsubscribe-Post support **(snippet-level)**.

**Inbox and real-time**

- `@suprsend/react` `<Inbox/>` "handles WebSocket connections, notification state, pagination, and real-time updates" ([docs.suprsend.com/docs/inbox-react](https://docs.suprsend.com/docs/inbox-react), snippet-level).
- The `@suprsend/react-inbox` package is MIT ([registry](https://registry.npmjs.org/@suprsend/react-inbox/latest)).

**Identity**

- Signed ES256 JWT with `entity_id` = distinct_id. The HMAC `subscriber_id` flow is legacy, used only by the React Native and Flutter SDKs ([docs.suprsend.com/docs/hmac-authentication](https://docs.suprsend.com/docs/hmac-authentication), snippet-level).

**Email and unsubscribe**

- Resend and Postmark vendor pages exist ([Resend](https://docs.suprsend.com/docs/resend), [Postmark](https://docs.suprsend.com/docs/postmark); snippet-level).
- SuprSend adds List-Unsubscribe and List-Unsubscribe-Post headers with a per-recipient link; one-click is automatic for categories marked "Is commercial" ([docs.suprsend.com/docs/user-preferences](https://docs.suprsend.com/docs/user-preferences), snippet-level).

**Pricing** ([suprsend.com/pricing](https://www.suprsend.com/pricing), read 2026-11-10)

- Free: 10k notifications/month, with SuprSend branding on the feed.
- Essentials: $100/month for 50k, then $2 per 1k.
- Self-hosted deployment is on Enterprise only.

### Home-built: Drizzle/SQLite inbox + Resend or Postmark

**In-app inbox**

- **Inferred:** a `notifications` table (recipient user id, type, payload or reference to the comment/lesson, `read_at`, `created_at`), read in route loaders.
- This means full SSR with no client-only boundary and no vendor SDK. Styling is entirely Cadence's existing Tailwind/Radix components.

**Real-time options in React Router**

- `useRevalidator()` revalidates page data "for reasons outside of normal data mutations like Window focus or polling on an interval" ([reactrouter.com/api/hooks/useRevalidator](https://reactrouter.com/api/hooks/useRevalidator)). This is the documented, low-effort way to keep an unread count fresh.
- Resource routes are routes that export a loader or action with no default component. They return `Response` objects, which can be "images, PDFs, JSON payloads, webhooks, etc." ([reactrouter.com/how-to/resource-routes](https://reactrouter.com/how-to/resource-routes)).
- **Inferred:** a resource route can return a `Response` with a `ReadableStream` body and `Content-Type: text/event-stream` to implement SSE. The React Router docs I read **do not document SSE**.
- **Inferred:** an in-process emitter that pushes to SSE clients only reaches clients connected to the same Node process. Multiple instances would need polling or a shared bus.

**SQLite constraints**

- WAL mode: "readers do not block writers and a writer does not block readers". There "can only be one writer at a time". All processes "must be on the same host computer; WAL does not work over a network filesystem" ([sqlite.org/wal.html](https://www.sqlite.org/wal.html)).
- **Inferred:** at Cadence's event-triggered volume, one notification insert per comment or reply adds trivial write load. Polling unread counts is read-only and concurrent with writes. The single-host rule pins the app to one machine or volume, which is already true today.

**Resend**

- Test addresses: `delivered@`, `bounced@`, `complained@`, and `suppressed@resend.dev`. "Test emails count against your account's sending quota" ([resend.com/docs/dashboard/emails/send-test-emails](https://resend.com/docs/dashboard/emails/send-test-emails)).
- "Resend doesn't manage contact lists for transactional emails". You add `List-Unsubscribe` yourself through `headers`. Bulk mail needs `List-Unsubscribe-Post: List-Unsubscribe=One-Click` per RFC 8058 ([resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails](https://resend.com/docs/dashboard/emails/add-unsubscribe-to-transactional-emails)).
- Hard bounces and complaints are suppressed automatically, team-wide, for both transactional and Broadcast mail. Gmail doesn't return complaint events ([resend.com/docs/dashboard/emails/email-suppressions](https://resend.com/docs/dashboard/emails/email-suppressions)).
- The React Email `email dev` command "Starts a local development server" for template previews. The docs don't say it needs an account ([react.email/docs/cli](https://react.email/docs/cli)).
- npm `resend` 6.37.0 is MIT ([registry](https://registry.npmjs.org/resend/latest)).
- Pricing ([resend.com/pricing](https://resend.com/pricing), read 2026-11-10): Free is 3,000/month, "limited to 100 emails per day", 3 domains. Pro is $20/month for 50k with no daily limit; overage is $0.90 per 1k.

**Postmark**

- Message Streams are "parallel but completely separate sending infrastructures for your transactional and broadcast emails" ([postmarkapp.com/pricing](https://postmarkapp.com/pricing)).
- Broadcast streams automatically add the one-click List-Unsubscribe-Post and List-Unsubscribe headers and suppress recipients who unsubscribe. On transactional streams the headers are "not required", and "If you add Unsubscribe headers to transactional messages, Postmark will include them in your send" ([postmarkapp.com/support/article/1299-…](https://postmarkapp.com/support/article/1299-how-to-include-a-list-unsubscribe-header)).
- Transactional streams default to `UnsubscribeHandlingType` None ([Message Streams API](https://postmarkapp.com/developer/api/message-streams-api), snippet-level).
- Testing options ([postmarkapp.com/support/article/1213-…](https://postmarkapp.com/support/article/1213-best-practices-for-testing-your-emails-through-postmark)):
  - `POSTMARK_API_TEST` token: messages are validated but not sent or shown in Activity.
  - Sandbox Mode servers: everything works "except for the actual email delivery".
  - `test@blackhole.postmarkapp.com`: dropped, but counts toward the monthly limit.
  - `hardbounce@bounce-testing.postmarkapp.com`: simulates a bounce.
- A search snippet adds that the test token can't be used with the send-with-Template endpoint ([snippet-level](https://postmarkapp.com/support/article/1213-best-practices-for-testing-your-emails-through-postmark)).
- npm `postmark` 5.1.0 is MIT ([registry](https://registry.npmjs.org/postmark/latest)).
- Pricing ([postmarkapp.com/pricing](https://postmarkapp.com/pricing), read 2026-11-10): Free developer tier is 100 emails/month with no overage. Basic is $15/month for 10k; extra emails cost $1.80 per 1k.

## Facts later decisions depend on

**Real-time**

- Knock, Courier, SuprSend and Novu document a live connection for unread counts:
  - Knock: WebSocket, throttleable, badge metadata only.
  - Courier: `listenForUpdates()` required.
  - SuprSend: WebSocket.
  - Novu: real-time unread count; WS service and `socketUrl` prop.
- MagicBell says "persistent connection" without naming the transport.
- Home-built has documented polling and focus revalidation via `useRevalidator`. SSE is possible in principle via a streaming resource route, but React Router does not document it (**inferred**), and it works per process.
- SQLite WAL allows one writer with concurrent readers on a single host.

**Dev and test without network**

- None of the hosted vendors documents an offline mode:
  - Knock and Courier offer cloud test/dev environments.
  - Courier's mock keys are Enterprise only.
  - `npx novu dev` tunnels to Novu Cloud.
- Novu is the only vendor where a fully local stack is possible (Docker self-host with MongoDB and Redis).
- The home-built inbox is fully offline; the existing tests already use in-memory SQLite (`app/test/setup.ts`). Email still needs network for Resend test addresses and Postmark's test token or sandbox. **Inferred:** an offline email fake behind our own send function would be required for no-network tests.

**Identity and data leaving the app**

- Every hosted vendor stores a recipient profile (our user id plus email) and the Notification content.
- Client feeds are secured with:
  - Knock: RS256 JWT, optional "enhanced security". Off means any user's feed is readable with the public key.
  - Novu: HMAC hash.
  - Courier: backend-minted JWT that never expires unless `expires_in` is set.
  - MagicBell: HS256 JWT.
  - SuprSend: ES256 JWT.
- Home-built sends only the email address and rendered email to Resend or Postmark.

**Unsubscribe compliance**

- These are event-triggered, transactional Notifications.
- Postmark says unsubscribe headers are not required on transactional streams. Resend's doc describes the RFC 8058 requirement as applying to "bulk messages".
- Vendors tie automatic one-click headers to *commercial* or *broadcast* mail:
  - Knock: commercial workflows.
  - SuprSend: "Is commercial" categories.
  - Postmark: Broadcast streams.
- Novu adds no unsubscribe link by default.
- Courier's List-Unsubscribe support depends on the provider.
- Whatever option is chosen, per-type email opt-out for Students and Instructors would be implemented through the preference model, not through provider headers (**inferred**).

## Open questions / couldn't verify

- **SSR with React Router:** no vendor except Courier ("client-side only") states SSR behaviour. Knock, Novu, MagicBell and SuprSend SSR/hydration behaviour under React Router framework mode is unverified, as is whether the components touch `window` at import time.
- **Version mismatch:** the brief says React Router v7; the repo is on 8.3.0. Docs read are the current reactrouter.com pages.
- **SSE in React Router:** whether a streaming `text/event-stream` resource route works cleanly with `@react-router/serve` (compression, buffering) was not verified.
- **Courier:** which email providers it emits List-Unsubscribe headers on. A snippet claimed SendGrid only; the page names SendGrid and Mailgun as examples. Whether Inbox is on the free Developer plan is also unconfirmed.
- **Knock:** the exact header names used for commercial unsubscribe; any self-serve export of feed items or preferences; any offline or local mode.
- **Novu:** the Inbox transport on Cloud (inferred WebSocket from `socketUrl`); limits of the demo email provider; whether Novu Cloud allows bulk export.
- **MagicBell:** real-time transport; whether Resend or Postmark work via SMTP; template authoring; unsubscribe support; the licence of the current `@magicbell/react` (npm lists none, and the `magicbell-js` repo is proprietary).
- **SuprSend:** several claims are snippet-level only (inbox WebSocket, unsubscribe headers, JWT flow); local dev and test options were not researched.
- **Postmark:** whether Sandbox-server sends and `POSTMARK_API_TEST` calls count toward quota.
- **Engagespot:** not researched.
