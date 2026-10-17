import { useConvexAuth } from "convex/react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AddFood } from "./pages/AddFood";
import { Admin } from "./pages/Admin";
import { ClientPage, Clients } from "./pages/Clients";
import { Auth } from "./pages/Auth";
import { Calendar } from "./pages/Calendar";
import { Credits } from "./pages/Credits";
import { Diary } from "./pages/Diary";
import { Exercises } from "./pages/Exercises";
import { Grocery } from "./pages/Grocery";
import { Home } from "./pages/Home";
import { Landing } from "./pages/Landing";
import { ArticlePage, Learn } from "./pages/Learn";
import { MealPlan } from "./pages/MealPlan";
import { Me } from "./pages/Me";
import { Messages } from "./pages/Messages";
import { Onboarding } from "./pages/Onboarding";
import { Progress } from "./pages/Progress";
import { MyProgramme, PaymentReturn, ProgrammeDetail, Programmes } from "./pages/Programmes";
import { RecipeDetail, Recipes } from "./pages/Recipes";
import { Reminders } from "./pages/Reminders";
import { Workbench } from "./pages/Workbench";
import { useStore } from "./state/store";

/** The signed-in app (sidebar layout). */
function appRoutes(isAdmin: boolean) {
  return (
    <Route element={<Layout />}>
      <Route path="/home" element={<Home />} />
      <Route path="/diary" element={<Diary />} />
      <Route path="/add" element={<AddFood />} />
      <Route path="/progress" element={<Progress />} />
      <Route path="/learn" element={<Learn />} />
      <Route path="/learn/:id" element={<ArticlePage />} />
      <Route path="/me" element={<Me />} />
      <Route path="/workbench" element={<Workbench />} />
      <Route path="/recipes" element={<Recipes />} />
      <Route path="/recipes/:id" element={<RecipeDetail />} />
      <Route path="/plan" element={<MealPlan />} />
      <Route path="/grocery" element={<Grocery />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/exercises" element={<Exercises />} />
      <Route path="/reminders" element={<Reminders />} />
      <Route path="/programmes" element={<Programmes />} />
      <Route path="/programmes/paid" element={<PaymentReturn />} />
      <Route path="/programmes/:id" element={<ProgrammeDetail />} />
      <Route path="/my-programmes/:id" element={<MyProgramme />} />
      <Route path="/clients" element={<Clients />} />
      <Route path="/clients/:id" element={<ClientPage />} />
      {isAdmin && <Route path="/admin" element={<Admin />} />}
    </Route>
  );
}

function Splash() {
  return (
    <div className="splash" role="status" aria-live="polite">
      <img src="/icon.svg" alt="" width={56} height={56} />
      <span className="muted small">Loading Nutrifi…</span>
    </div>
  );
}

/** On-device mode: no accounts. */
function LocalApp() {
  const { profile } = useStore();
  return (
    <Routes>
      <Route path="/" element={profile ? <Navigate to="/home" replace /> : <Landing />} />
      <Route path="/start" element={profile ? <Navigate to="/home" replace /> : <Onboarding />} />
      <Route path="/credits" element={<Credits />} />
      {profile && appRoutes(false)}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** Cloud mode: sign in → set up profile → app. */
function CloudApp() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { ready, profile, account } = useStore();

  if (isLoading || (isAuthenticated && !ready)) return <Splash />;

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/start" element={<Navigate to="/auth?mode=signup" replace />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  if (!profile) {
    return (
      <Routes>
        <Route path="/start" element={<Onboarding />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="*" element={<Navigate to="/start" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/credits" element={<Credits />} />
      {appRoutes(!!account?.isAdmin)}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default function App() {
  const { mode } = useStore();
  return mode === "cloud" ? <CloudApp /> : <LocalApp />;
}
