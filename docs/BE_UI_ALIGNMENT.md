# BE ↔ UI Alignment Review

Review date: 2026-10-12
Repos: `node_queue` (BE) and `node-queue-ui` (UI)

Endpoint paths, HTTP methods, search/sort params, cron types and most form payloads match.
The gaps below are what remains. Each item says which repo owns the fix.

## High: visible to users

### 1. Websocket events go to every client and ignore the service — BE
- `src/core/services/broadcastService.js` publishes `{ event, data }` to Redis without the rooms.
- `src/infra/webSocket/WebSocketGateway.js` `broadcast()` sends to all connected clients.
- `src/core/dto/websocket/TicketCalledDTO.js` has no `serviceId`, so the UI can't filter either.
- **Effect:** a counter on service A gets toasts, beeps and full refetches for tickets in service B,
  including other organizations.
- **Fix:** add `serviceId` (and `organizationId`) to every ticket DTO. Then either route by room in the
  gateway (clients send `join-service-room`), or have the UI ignore events for other services.

### 2. Kiosk phone numbers aren't checked in the UI — UI
- BE accepts only `^(?:\+62|62|0)8\d{7,11}$` (`src/infra/utils/phoneNormalizer.js`).
- UI `src/views/Ticket/GetTicket.vue` only checks the field isn't empty.
- **Effect:** a 400 "Invalid phone number format" appears as a generic popup plus the error modal,
  not inline under the field.
- **Fix:** run the same regex in `validateVisitorForm()` and show the error inline.

### 3. An empty organization Full Name fails to save — BE or UI
- UI `src/views/Organization/OrganizationForm.vue` treats Full Name as optional and sends `fullName: ''`.
- BE `src/api/validation/organization.schema.js` uses `Joi.string()`, which rejects `''`.
- **Fix:** BE `.allow('', null)` on `fullName`, or UI omits `fullName` when it's blank.

### 4. Visitor and visitor-history report errors lose the real message — UI
- These requests use `responseType: 'blob'`, so `src/helpers/request.js` can't read the error JSON
  and shows "An unexpected error occurred…".
- `src/views/Report/ReportPage.vue` already parses the blob. `src/views/Visitor/VisitorTable.vue`
  and `src/views/Visitor/VisitorHistoryTable.vue` don't.
- **Effect:** messages like "endDate must be within 1 month from startDate" never reach the user.
- **Fix:** in the response interceptor, parse a Blob `error.response.data` into JSON before
  building the message.

## Medium: missing or mismatched features

### 5. Prioritizing has no button — UI
- BE `PUT /v1/queues/:queueId/prioritize` exists, and the UI store has `prioritizeTicket()` in
  `src/stores/queue.js`.
- No view calls it.
- **Fix:** add a "Prioritize" action on waiting tickets in `AdminDashboard.vue`, or remove the dead code.

### 6. The "prioritized" toast shows a UUID — BE and UI
- UI `AdminDashboard.vue` shows `Ticket ${data.id} prioritized!`.
- BE `TicketPrioritizedDTO` only has `id`, `isPriority` and `serviceId`.
- **Fix:** add `prefix` and `queueNumber` to the DTO and use them in the toast.

### 7. The user-table Role search returns 400 for lowercase text — UI
- BE `getUserSchema.role` accepts only exactly `ADMIN` or `USER`.
- UI `src/views/User/UserTable.vue` takes free text, so "admin" fails validation.
- **Fix:** use a dropdown, or uppercase the value before sending it.

### 8. Admin-only pages aren't protected in the router — UI
- `/admin/organizations`, `/admin/users` and `/admin/activity` in `src/router/index.js` don't have
  `requiresAdmin`.
- BE allows only ADMIN on these endpoints. USER doesn't see them in the sidebar, but opening the URL
  directly gives a 403 popup.
- **Fix:** add `meta.requiresAdmin: true` to those routes.

### 9. The organization dropdown stops at 25 — UI
- `AdminDashboard.vue` and `ReportPage.vue` call
  `fetchOrganizations({ pagination: true, pageSize: 25 })`.
- **Effect:** a 26th organization never appears.
- **Fix:** use `pagination: false`, which the BE supports.

### 10. Ticket creation sends a duplicate event — BE
- `src/api/controllers/ticketController.js` sends `new-ticket`, and
  `src/core/services/ticketService.js` also sends `ticket:created`.
- The UI ignores `new-ticket`. Its payload includes organization names and goes to every websocket
  client, including the public monitor, which needs no login.
- **Fix:** remove the `new-ticket` emit.

## Low: cleanup

### 11. Login always returns an empty organization `fullName` — BE
- `src/api/controllers/authController.js:33` reads `organization?.FullName`, but the Prisma field is
  `fullName`.
- The UI doesn't display it yet.

### 12. `ticket:recalled` is never handled — UI
- No UI listener. That's harmless today because a recall also sends `ticket:called`.

### 13. `GET /v1/auth/validate-token` is unused — UI
- The UI never checks the token when the page loads, so an expired session is only noticed on the
  first request that gets a 401.
- **Fix (optional):** call it from the router guard on first navigation to `/admin`.

### 14. 403 and 429 responses get a generic popup — UI
- `src/helpers/request.js` shows the "Oops…" popup with the server message.
- The kiosk may hit the public rate limit (`publicRateLimiter`). A friendly "please wait" message
  would read better there.

## Summary

| #  | Issue                                    | Severity | Fix in   |
|----|------------------------------------------|----------|----------|
| 1  | Websocket events reach all clients        | High     | BE (+UI) |
| 2  | Kiosk doesn't check phone format          | High     | UI       |
| 3  | Empty org Full Name rejected              | High     | BE or UI |
| 4  | Report errors lose the real message       | High     | UI       |
| 5  | Prioritize has no button                  | Medium   | UI       |
| 6  | Prioritized toast shows a UUID            | Medium   | BE + UI  |
| 7  | Role search returns 400 for lowercase     | Medium   | UI       |
| 8  | Admin-only routes not protected           | Medium   | UI       |
| 9  | Org dropdown stops at 25                  | Medium   | UI       |
| 10 | Duplicate `new-ticket` event              | Medium   | BE       |
| 11 | Login `FullName` typo                     | Low      | BE       |
| 12 | `ticket:recalled` not handled             | Low      | UI       |
| 13 | `validate-token` unused                   | Low      | UI       |
| 14 | Generic 403/429 popup                     | Low      | UI       |

## Fix status (branch `fix/be-ui-alignment` in both repos)

All 14 items are fixed. Two more bugs turned up during smoke testing and are fixed too:

- **Every websocket event was delivered twice** (BE). `MessageBroker` subscribed with a new arrow function
  on both `subscribe()` and `resubscribeAll()`, so node-redis registered two listeners. Every Redis
  reconnect added another. It now reuses one listener per channel.
- **Custom validation messages were dropped** (BE, part of #4). `validate.js` turned `any.custom` errors
  into "Validation failed", so the date-range message never reached the UI.

Still open (not in scope):

- `WebSocketGateway.handleMessage` re-broadcasts any client message that has no registered handler to
  every client. Any websocket client can send fake `ticket:called` events to the monitor.
