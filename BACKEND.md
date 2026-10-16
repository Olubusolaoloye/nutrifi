# Nutrifi backend (Convex)

Nutrifi runs in two modes:

- **On-device** (no `VITE_CONVEX_URL`): no accounts; data is saved in the browser. This is what runs until Convex is set up.
- **Cloud** (`VITE_CONVEX_URL` set): email + password accounts, data synced to Convex, real verification.

## What's in `convex/`

| File | What it does |
|---|---|
| `schema.ts` | Tables: profiles, verifications, diary, water, weights, notes, plan, grocery, events, exercises, waitlist (+ Convex Auth tables) |
| `auth.ts`, `auth.config.ts`, `http.ts` | Convex Auth with the Password provider (email + password) |
| `me.ts` | `snapshot` — one reactive query with everything the signed-in user needs |
| `profile.ts` | Create the profile at the end of onboarding; edit personal details (role and verification can't be changed by users) |
| `data.ts` | Diary, water, weight, notes, plan, grocery, calendar and exercise mutations; delete my data / account |
| `verification.ts` | Upload a document, submit for review, admin review queue and approve/reject |
| `importLocal.ts` | One-time import of data saved on a device before accounts |
| `waitlist.ts` | Public landing-page waitlist |
| `helpers.ts`, `validators.ts` | Auth checks, ownership checks, input validation |
| `backend.test.ts` | Tests (run with `npm test`) |

Every function checks who is signed in and only touches that user's rows. Only admins (emails in `ADMIN_EMAILS`) can approve verification.

## One-time setup (on your computer)

You need Node.js 20+ and a free Convex account (https://convex.dev).

```bash
git clone -b claude/nutrifi-strategy https://github.com/Olubusolaoloye/nutrifi
cd nutrifi
npm install

# 1. Create the Convex project and push the functions.
#    Log in when asked, choose "create a new project" (e.g. "nutrifi").
#    This writes CONVEX_DEPLOYMENT and VITE_CONVEX_URL into .env.local.
npx convex dev --once

# 2. Set up sign-in keys (answer the prompts; use http://localhost:5173 as the site URL).
npx @convex-dev/auth

# 3. Make yourself an admin so you can review verification requests.
npx convex env set ADMIN_EMAILS "you@example.com"

# 4. Run it.
npm run dev:backend   # keeps Convex in sync while you work (leave running)
npm run dev           # in a second terminal → http://localhost:5173
```

Create an account with the email you put in `ADMIN_EMAILS`, and the **Verification queue** appears in the sidebar.

## Going live on Netlify

1. In the Convex dashboard, open your project → **Production** → **Settings** → generate a **Production deploy key**.
2. Set up auth keys for production: `npx @convex-dev/auth --prod` (use `https://nutrifi-ng.netlify.app` as the site URL), then
   `npx convex env set --prod ADMIN_EMAILS "you@example.com"`.
3. In Netlify → **nutrifi-ng** → **Project configuration → Environment variables**, add `CONVEX_DEPLOY_KEY` with that key.
4. Redeploy. The build (`npm run build:ci`) deploys the Convex functions, sets `VITE_CONVEX_URL` automatically, and builds the app in cloud mode.

## Notes

- Sign-in is email + password for now. Phone OTP can be added with an SMS provider (e.g. Termii) as a custom Convex Auth provider.
- Verification documents are stored in Convex file storage and visible only to admins.
- `convex/_generated/` was written by hand to match Convex's output (this environment couldn't reach Convex); `npx convex dev` regenerates it.
