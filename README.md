# Nutrifi

Eat well, the Naija way. Nutrifi is a nutrition web app (a mobile-first React PWA) for Nigeria.

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

**Hybrid rule:** consumers see one simple daily target. People who report a medical condition, and anyone under 18, are sent to a dietitian instead of getting a target. Only verified students and dietitians can use the full Workbench.

## Prototype limits

- Data is stored in the browser (`localStorage`). There's no backend or accounts yet.
- Verification is simulated with a "Demo: approve my verification" button on the Me page.
- Food values in `src/data/foods.ts` and the articles are **sample placeholders, not for clinical use**. They'll be replaced with the West African / Nigerian food composition tables and articles reviewed by dietitians.
