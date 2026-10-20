# Nutrintel

Eat well. Move more. Feel good. Nutrintel is a nutrition and fitness web app (a mobile-first React PWA), starting in Nigeria.

- [`NUTRINTEL_STRATEGY.md`](NUTRINTEL_STRATEGY.md): product strategy and roadmap
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
| CSV import for the food diary and meal plan: download a template, preview what will be imported, see each row that can't be (with its line number); names are matched to Nutrintel's foods and recipes | `src/lib/csvImport.ts`, `src/components/CsvImport.tsx` |
| Swap options: dishes with about the same calories for the same kind of meal, labelled "Cheaper" / "More protein" | `src/lib/planner.ts` |
| Reminders for meals (with the planned dish), water, weekly weigh-in and planning, and calendar events — by push notification and WhatsApp | `src/pages/Reminders.tsx`, `src/lib/reminders.ts`, `convex/reminders.ts`, `convex/notify.ts` |
| Sign in / create account / forgot password (cloud mode) | `src/pages/Auth.tsx` |
| Paid programmes: diabetes, blood pressure, weight loss, PCOS, kidney, pregnancy, child growth, sports, one-off consult. Choose a verified dietitian, intake with consent, Paystack checkout, then your dietitian's target, plan, approved supplements, weekly check-ins and chat | `src/pages/Programmes.tsx`, `src/data/programmes.ts`, `convex/interventions.ts`, `convex/payments.ts` |
| Dietitian client tools: client list with adherence flags, client detail (diary, water, weight, notes, intake), set target (Mifflin suggestion + macro presets), build and send a week plan, approve supplements, check-ins, messages, programmes & prices, earnings | `src/pages/Clients.tsx`, `convex/clients.ts` |
| Admin portal: live overview (accounts, active members, new sign-ups and activity charts, programmes and revenue, messaging and reminders), people list with search, activity feed, verification queue and dietitian payouts. Counts only, never message text or food logs | `src/pages/Admin.tsx`, `src/pages/AdminReview.tsx`, `convex/admin.ts` |
| Grocery list built from the plan, with ₦ estimates and purchased status. Share it on WhatsApp (checklist text), as an image, or to a Nutrintel friend in a chat, where either of you can tick items off as you shop | `src/pages/Grocery.tsx`, `src/lib/grocery.ts` |
| Calendar of planned meals, activities and appointments | `src/pages/Calendar.tsx` |
| Exercise log with calories from MET values | `src/pages/Exercises.tsx`, `src/lib/nutrition/activity.ts` |
| Health insights (featured, popular, tags, related articles) | `src/pages/Learn.tsx`, `src/data/articles.ts` |
| Messages between members (with an account): every member has an @username (made from their name, changeable on Me); find friends by username as you type, send a week of your meal plan that a friend adds to their own plan in one tap, block | `src/pages/Messages.tsx`, `convex/social.ts` |
| Programme chats: the dietitian chat opens as soon as a programme is paid for and stays pinned at the top of Messages (with a "Check out our programmes" pin before that); a programme ends only when both the member and the dietitian confirm. On phones the middle tab is Chat | `src/pages/Messages.tsx`, `convex/interventions.ts` |
| New-message notifications: push (and WhatsApp once it's set up) when a friend or dietitian writes and you haven't seen it; a prompt on Messages turns them on for the device; programme messages never show their text | `convex/alerts.ts`, `convex/notify.ts`, `src/components/ReminderChannels.tsx` |
| Share your meal plan or health journey: WhatsApp text, a story-sized image for Instagram / WhatsApp Status (phone share menu), save image, copy text, or send to a Nutrintel friend. Weight is only shared if you switch it on | `src/components/ShareSheet.tsx`, `src/lib/share.ts`, `src/lib/shareImage.ts` |

**Hybrid rule:** consumers see one simple daily target. People who report a medical condition, and anyone under 18, are sent to a dietitian instead of getting a target. Only verified students and dietitians can use the full Workbench.

## Backend and accounts

Accounts, cloud sync, verification review and the waitlist run on **Convex** — see [`BACKEND.md`](BACKEND.md) for setup.
Until Convex is configured (`VITE_CONVEX_URL`), the app runs in on-device mode: data is stored in the browser and
verification is simulated with a "Demo: approve my verification" button on the Me page.

## Prototype limits

- People with a medical condition, and under-18s, get a general week with standard portions instead of a personal plan; a dietitian should set theirs.
- Push and WhatsApp reminders need provider keys (see `BACKEND.md`). Without an account, reminders only show while the app is open.
- Without accounts, Programmes and the Clients tools run as a preview with sample (fictional) dietitians and clients; no payment is taken.
- Messaging needs an account; without one, sharing to WhatsApp and Instagram still works.
- Food photos come from Wikimedia Commons (public domain / Creative Commons) and are credited on the Photo credits page (`/credits`); a dish falls back to its emoji if its photo can't load.
- Food values, recipes, ₦ grocery prices and articles are **sample placeholders, not for clinical use**. They'll be replaced with the West African / Nigerian food composition tables and articles reviewed by dietitians.
