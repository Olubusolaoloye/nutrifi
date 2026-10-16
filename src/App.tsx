import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AddFood } from "./pages/AddFood";
import { ArticlePage, Learn } from "./pages/Learn";
import { Diary } from "./pages/Diary";
import { Home } from "./pages/Home";
import { Landing } from "./pages/Landing";
import { Me } from "./pages/Me";
import { Onboarding } from "./pages/Onboarding";
import { Progress } from "./pages/Progress";
import { Workbench } from "./pages/Workbench";
import { Calendar } from "./pages/Calendar";
import { Credits } from "./pages/Credits";
import { Exercises } from "./pages/Exercises";
import { Grocery } from "./pages/Grocery";
import { MealPlan } from "./pages/MealPlan";
import { Messages } from "./pages/Messages";
import { RecipeDetail, Recipes } from "./pages/Recipes";
import { useStore } from "./state/store";

function RequireProfile({ children }: { children: ReactNode }) {
  const { profile } = useStore();
  return profile ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { profile } = useStore();
  return (
    <Routes>
      <Route path="/" element={profile ? <Navigate to="/home" replace /> : <Landing />} />
      <Route path="/start" element={<Onboarding />} />
      <Route path="/credits" element={<Credits />} />
      <Route
        element={
          <RequireProfile>
            <Layout />
          </RequireProfile>
        }
      >
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
