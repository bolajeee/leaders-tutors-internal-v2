# Leaders Tutors Phase 2

Unified marketing website and student learning portal for Leaders Tutors.

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

The default curriculum mode is `mock`, so the complete public site and student portal can be reviewed without production credentials. Open `/login` and choose **Explore the local demo**.

## Data modes

- `NEXT_PUBLIC_CURRICULUM_SOURCE=mock` uses typed local curriculum, payment, wallet, transaction, and subscription fixtures.
- `NEXT_PUBLIC_CURRICULUM_SOURCE=api` uses the configured Leaders Tutors API. It does not silently fall back to fixtures.
- `NEXT_PUBLIC_CURRICULUM_API_PATH` must return the normalized `CurriculumSubject[]` tree documented in `src/types/curriculum.ts`.
- `NEXT_PUBLIC_SUBSCRIPTION_RENEWAL_PATH` is optional. Renewal shows an unavailable message in API mode until it is configured.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright tests target both desktop Chrome and a Pixel 7 viewport. Install the Playwright Chromium browser before the first full browser run if it is not already available.
