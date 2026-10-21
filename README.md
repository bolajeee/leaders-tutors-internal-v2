# Leaders Tutors Phase 2

Unified marketing website and student learning portal for Leaders Tutors.

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

`.env.example` points the app at the live Leaders Tutors API. Add the site's public client key as `NEXT_PUBLIC_API_KEY` (it is the `apiKey` value in the page source of leaderstutors.com), then run `npm run dev`. To review the whole site and portal without any network, set `NEXT_PUBLIC_CURRICULUM_SOURCE=mock`, open `/login` and choose **Explore the local demo**. Unset, the mode defaults to `mock`.

## Data modes

- `NEXT_PUBLIC_CURRICULUM_SOURCE=mock` uses typed local curriculum, payment, wallet, transaction, and subscription fixtures.
- `NEXT_PUBLIC_CURRICULUM_SOURCE=api` uses the live API at `NEXT_PUBLIC_BASE_URL` (`https://leaderstutors.com/api/dev`). It does not silently fall back to fixtures.

### How the live API is called

The API is the one the existing leaderstutors.com site uses. Every call is a form-encoded `POST` with an `apiKey` header, plus `Authorization: Bearer <access key>` for signed-in routes. Replies are `{ success, message, response, ... }` with HTTP 200 even on failure; `src/lib/live-api.ts` turns `success: false` into an error carrying the API's message and ends the session when the access key is rejected (`response` below 100).

| Area | Endpoints |
| --- | --- |
| Sign-up | `/site/departments/fetch-department`, `/site/department-class-subject/fetch-class-by-department`, `/user/auth/signup`, `/user/auth/signup-complete`, `/user/auth/signup-cancelled` |
| Sign-in and recovery | `/user/auth/login`, `/user/auth/reset-password`, `/user/auth/resend-otp`, `/user/auth/create-new-password` |
| Curriculum | `/user/tutorials/fetch-deparment-class-subjects`, `.../fetch-deparment-class-subject-weeks`, `.../fetch-tutorial` (the misspelling is the API's) |
| Wallet and history | `/user/transactions/load-wallet-pending`, `.../load-wallet-success`, `.../load-wallet-cancelled`, `.../transaction-history` |
| Renewal | `/user/subscription/renew-subscription`, `.../subscription-success`, `.../subscription-cancelled` |

Things to know:

- The API has no "fetch my subscription" call. Login, payment and renewal replies carry the plan and wallet, so the app keeps the latest of those (`account` in the auth store) and works out days left from the plan's end date.
- Changing the password from inside the portal is unavailable (the API has no such call); students use "Forgot password" on the login page.
- CBT practice is not wired yet; lessons show that practice is unavailable.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright tests target both desktop Chrome and a Pixel 7 viewport. Install the Playwright Chromium browser before the first full browser run if it is not already available.
