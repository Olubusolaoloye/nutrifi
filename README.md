# Nutrifi

Eat well. Move more. Feel good. Nutrifi is a nutrition and fitness web app (a mobile-first React PWA), starting in Nigeria.

- [`NUTRIFI_STRATEGY.md`](NUTRIFI_STRATEGY.md): product strategy and roadmap
- [`MVP_DESIGN_PROMPT.md`](MVP_DESIGN_PROMPT.md): UI/UX design brief for the MVP prototype

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # nutrition engine tests
npm run build      # production build in dist/
```

## What's in the MVP so far

| Area | Where |
|---|---|
| Nutrition engine: BMI, BMR (Mifflin-St Jeor, Harris-Benedict, Schofield, Katch-McArdle), energy requirement, consumer daily target, macro and meal distribution, water | `src/lib/nutrition/` |
| Onboarding with roles (member / student / dietitian) and the hybrid target rule | `src/pages/Onboarding.tsx` |
| Home dashboard, food diary, Nigerian portion picker + combos, water, weight/BMI progress | `src/pages/` |
| Learn newsfeed with WhatsApp sharing | `src/pages/Learn.tsx` |
| Professional Workbench (verified students and dietitians only) | `src/pages/Workbench.tsx` |
| Food diary: day view with meal notes and day reflection, week table with "Thoughts", weekly stat cards | `src/pages/Diary.tsx`, `src/components/NoteCard.tsx` |
| Add food: Naija, Continental and International sections | `src/pages/AddFood.tsx`, `src/data/foods.ts` |
| Healthy menu and recipe pages (servings scaling, ingredients, directions) | `src/pages/Recipes.tsx`, `src/data/recipes.ts` |
| Personal meal plans: a week sized to your daily target (portions in ¼ servings), using your cuisines, diet, allergies and ₦ budget | `src/pages/MealPlan.tsx`, `src/lib/planner.ts` |
| Swap options: dishes with about the same calories for the same kind of meal, labelled "Cheaper" / "More protein" | `src/lib/planner.ts` |
| Reminders for meals (with the planned dish), water, weekly weigh-in and planning, and calendar events — by push notification and WhatsApp | `src/pages/Reminders.tsx`, `src/lib/reminders.ts`, `convex/reminders.ts`, `convex/notify.ts` |
| Sign in / create account / forgot password (cloud mode) | `src/pages/Auth.tsx` |
| Paid programmes: diabetes, blood pressure, weight loss, PCOS, kidney, pregnancy, child growth, sports, one-off consult. Choose a verified dietitian, intake with consent, Paystack checkout, then your dietitian's target, plan, approved supplements, weekly check-ins and chat | `src/pages/Programmes.tsx`, `src/data/programmes.ts`, `convex/interventions.ts`, `convex/payments.ts` |
| Dietitian client tools: client list with adherence flags, client detail (diary, water, weight, notes, intake), set target (Mifflin suggestion + macro presets), build and send a week plan, approve supplements, check-ins, messages, programmes & prices, earnings | `src/pages/Clients.tsx`, `convex/clients.ts` |
| Admin: verification queue and dietitian payouts | `src/pages/Admin.tsx` |
| Grocery list built from the plan, with ₦ estimates and purchased status | `src/pages/Grocery.tsx` |
| Calendar of planned meals, activities and appointments | `src/pages/Calendar.tsx` |
| Exercise log with calories from MET values | `src/pages/Exercises.tsx`, `src/lib/nutrition/activity.ts` |
| Health insights (featured, popular, tags, related articles) | `src/pages/Learn.tsx`, `src/data/articles.ts` |
| Messages (preview with sample conversations) | `src/pages/Messages.tsx` |

**Hybrid rule:** consumers see one simple daily target. People who report a medical condition, and anyone under 18, are sent to a dietitian instead of getting a target. Only verified students and dietitians can use the full Workbench.

## Backend and accounts

Accounts, cloud sync, verification review and the waitlist run on **Convex** — see [`BACKEND.md`](BACKEND.md) for setup.
Until Convex is configured (`VITE_CONVEX_URL`), the app runs in on-device mode: data is stored in the browser and
verification is simulated with a "Demo: approve my verification" button on the Me page.

## Prototype limits

- People with a medical condition, and under-18s, get a general week with standard portions instead of a personal plan; a dietitian should set theirs.
- Push and WhatsApp reminders need provider keys (see `BACKEND.md`). Without an account, reminders only show while the app is open.
- Without accounts, Programmes and the Clients tools run as a preview with sample (fictional) dietitians and clients; no payment is taken.
- Messaging is a preview with sample conversations; it launches with paid interventions.
- Food photos come from Wikimedia Commons (public domain / Creative Commons) and are credited on the Photo credits page (`/credits`); a dish falls back to its emoji if its photo can't load.
- Food values, recipes, ₦ grocery prices and articles are **sample placeholders, not for clinical use**. They'll be replaced with the West African / Nigerian food composition tables and articles reviewed by dietitians.
