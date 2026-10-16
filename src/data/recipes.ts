// SAMPLE RECIPES — placeholder nutrition and ₦ price estimates for the prototype, NOT for clinical use.
// Recipes and values will be written and reviewed by Nutrifi's dietitians.
import type { Meal } from "../state/store";
import type { Cuisine } from "./foods";

export type GroceryCategory = "Grains" | "Protein" | "Veggies" | "Fruits" | "Dairy" | "Oils & spices" | "Others";
export const GROCERY_CATEGORIES: GroceryCategory[] = ["Grains", "Protein", "Veggies", "Fruits", "Dairy", "Oils & spices", "Others"];

/** Shopping catalogue: unit and an estimated price per unit in Naira (sample values, not live market prices). */
export const INGREDIENTS = {
  rice: { name: "Rice", category: "Grains", unit: "kg", priceNaira: 1800 },
  garri: { name: "Garri", category: "Grains", unit: "kg", priceNaira: 1200 },
  oats: { name: "Rolled oats", category: "Grains", unit: "kg", priceNaira: 4500 },
  spaghetti: { name: "Spaghetti", category: "Grains", unit: "pack", priceNaira: 1100 },
  pita: { name: "Pita / shawarma bread", category: "Grains", unit: "piece", priceNaira: 400 },
  beans: { name: "Beans (oloyin)", category: "Protein", unit: "kg", priceNaira: 2200 },
  chicken: { name: "Chicken", category: "Protein", unit: "kg", priceNaira: 5500 },
  beef: { name: "Beef", category: "Protein", unit: "kg", priceNaira: 7000 },
  salmon: { name: "Salmon / mackerel fillet", category: "Protein", unit: "kg", priceNaira: 9000 },
  eggs: { name: "Eggs", category: "Protein", unit: "piece", priceNaira: 200 },
  crayfish: { name: "Ground crayfish", category: "Protein", unit: "cup", priceNaira: 1500 },
  egusi: { name: "Egusi (ground melon)", category: "Protein", unit: "cup", priceNaira: 1200 },
  groundnuts: { name: "Groundnuts", category: "Protein", unit: "cup", priceNaira: 600 },
  tomatoes: { name: "Tomatoes", category: "Veggies", unit: "kg", priceNaira: 2000 },
  peppers: { name: "Tatashe & rodo peppers", category: "Veggies", unit: "kg", priceNaira: 2500 },
  onions: { name: "Onions", category: "Veggies", unit: "piece", priceNaira: 150 },
  spinach: { name: "Spinach / ugu", category: "Veggies", unit: "bunch", priceNaira: 500 },
  cabbage: { name: "Cabbage", category: "Veggies", unit: "piece", priceNaira: 800 },
  carrots: { name: "Carrots", category: "Veggies", unit: "kg", priceNaira: 1500 },
  plantain: { name: "Ripe plantain", category: "Fruits", unit: "piece", priceNaira: 400 },
  banana: { name: "Banana", category: "Fruits", unit: "piece", priceNaira: 100 },
  berries: { name: "Mixed berries / fruit", category: "Fruits", unit: "cup", priceNaira: 1500 },
  pawpaw: { name: "Pawpaw", category: "Fruits", unit: "piece", priceNaira: 900 },
  watermelon: { name: "Watermelon", category: "Fruits", unit: "piece", priceNaira: 1500 },
  milk: { name: "Milk", category: "Dairy", unit: "litre", priceNaira: 2500 },
  yoghurt: { name: "Greek / plain yoghurt", category: "Dairy", unit: "cup", priceNaira: 1200 },
  palmOil: { name: "Palm oil", category: "Oils & spices", unit: "cup", priceNaira: 900 },
  vegOil: { name: "Vegetable oil", category: "Oils & spices", unit: "cup", priceNaira: 800 },
  spices: { name: "Curry, thyme & spices", category: "Oils & spices", unit: "tbsp", priceNaira: 100 },
  stock: { name: "Seasoning / stock", category: "Oils & spices", unit: "cube", priceNaira: 40 },
  garlicSauce: { name: "Garlic sauce", category: "Others", unit: "tbsp", priceNaira: 150 },
} satisfies Record<string, { name: string; category: GroceryCategory; unit: string; priceNaira: number }>;

export type IngredientId = keyof typeof INGREDIENTS;

export interface Recipe {
  id: string;
  name: string;
  cuisine: Cuisine;
  meal: Meal;
  emoji: string;
  description: string;
  prepMinutes: number;
  cookMinutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
  /** Number of servings the ingredient quantities make. */
  servings: number;
  /** Per serving. */
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  ingredients: Array<{ id: IngredientId; qty: number; note?: string }>;
  steps: Array<{ title: string; text: string }>;
  tips?: string[];
}

export const RECIPES: Recipe[] = [
  {
    id: "jollof-chicken", name: "Jollof rice with grilled chicken", cuisine: "Nigerian", meal: "Lunch", emoji: "🍛",
    description: "Smoky party-style jollof with less oil, served with grilled chicken and a side of steamed vegetables.",
    prepMinutes: 20, cookMinutes: 45, difficulty: "Medium", servings: 4, kcal: 560, carbs: 72, protein: 32, fat: 15,
    ingredients: [
      { id: "rice", qty: 0.5 }, { id: "chicken", qty: 0.6 }, { id: "tomatoes", qty: 0.5 }, { id: "peppers", qty: 0.3 },
      { id: "onions", qty: 2 }, { id: "vegOil", qty: 0.25 }, { id: "spices", qty: 2 }, { id: "stock", qty: 2 }, { id: "carrots", qty: 0.2 },
    ],
    steps: [
      { title: "Season the chicken", text: "Season with onion, thyme, curry and a little stock. Grill or bake until cooked through." },
      { title: "Make the base", text: "Blend tomatoes, peppers and one onion. Fry the blend in the oil until the raw taste is gone." },
      { title: "Cook the rice", text: "Add washed rice, stock and water to just cover. Cover tightly and cook on low heat until tender." },
      { title: "Serve", text: "Serve 2 cooking spoons of rice with one chicken piece and steamed carrots." },
    ],
    tips: ["Use less oil than usual and let the rice steam on low heat for the smoky bottom-pot flavour."],
  },
  {
    id: "egusi-eba", name: "Egusi soup with spinach & eba", cuisine: "Nigerian", meal: "Dinner", emoji: "🍲",
    description: "A vegetable-rich egusi with lean beef. Pair with a fist-sized wrap of eba for a balanced plate.",
    prepMinutes: 20, cookMinutes: 40, difficulty: "Medium", servings: 4, kcal: 640, carbs: 62, protein: 30, fat: 31,
    ingredients: [
      { id: "egusi", qty: 1 }, { id: "beef", qty: 0.5 }, { id: "spinach", qty: 2 }, { id: "palmOil", qty: 0.25 },
      { id: "crayfish", qty: 0.25 }, { id: "peppers", qty: 0.2 }, { id: "onions", qty: 1 }, { id: "stock", qty: 2 }, { id: "garri", qty: 0.6 },
    ],
    steps: [
      { title: "Cook the beef", text: "Boil the beef with onion and stock until tender. Keep the stock." },
      { title: "Fry the egusi", text: "Heat the palm oil, add ground egusi mixed with a little water and stir until it forms curds." },
      { title: "Simmer", text: "Add blended pepper, crayfish, beef and stock. Simmer for 15 minutes." },
      { title: "Add greens", text: "Stir in the chopped spinach and cook for 3 minutes. Serve with eba." },
    ],
  },
  {
    id: "moimoi", name: "Moi moi with egg", cuisine: "Nigerian", meal: "Breakfast", emoji: "🫘",
    description: "Steamed bean pudding — high in protein and fibre. Great for breakfast with pap or a cup of tea.",
    prepMinutes: 30, cookMinutes: 50, difficulty: "Medium", servings: 6, kcal: 290, carbs: 24, protein: 16, fat: 14,
    ingredients: [
      { id: "beans", qty: 0.5 }, { id: "peppers", qty: 0.2 }, { id: "onions", qty: 1 }, { id: "eggs", qty: 3 },
      { id: "vegOil", qty: 0.25 }, { id: "crayfish", qty: 0.25 }, { id: "stock", qty: 2 },
    ],
    steps: [
      { title: "Peel the beans", text: "Soak and peel the beans, then blend with pepper and onion until smooth." },
      { title: "Season", text: "Mix in oil, crayfish and stock. Add warm water until the batter pours." },
      { title: "Fill", text: "Pour into leaves or bowls and add slices of boiled egg." },
      { title: "Steam", text: "Steam for 45–50 minutes until firm." },
    ],
  },
  {
    id: "akara-pap", name: "Akara with pap", cuisine: "Nigerian", meal: "Breakfast", emoji: "🧆",
    description: "Classic weekend breakfast. Air-fry or shallow-fry the akara to cut down on oil.",
    prepMinutes: 25, cookMinutes: 20, difficulty: "Easy", servings: 4, kcal: 380, carbs: 46, protein: 13, fat: 16,
    ingredients: [
      { id: "beans", qty: 0.4 }, { id: "onions", qty: 1 }, { id: "peppers", qty: 0.1 }, { id: "vegOil", qty: 0.5 }, { id: "milk", qty: 0.25 },
    ],
    steps: [
      { title: "Make the batter", text: "Blend peeled beans with pepper and onion using very little water. Whisk until fluffy." },
      { title: "Fry", text: "Scoop spoonfuls into hot oil and fry until golden, or air-fry for a lighter version." },
      { title: "Serve", text: "Serve 3 akara balls with a cup of pap and a splash of milk." },
    ],
  },
  {
    id: "beans-dodo", name: "Beans porridge & dodo", cuisine: "Nigerian", meal: "Dinner", emoji: "🍌",
    description: "Comforting stewed beans with a side of fried plantain. Rich in fibre and plant protein.",
    prepMinutes: 10, cookMinutes: 60, difficulty: "Easy", servings: 4, kcal: 520, carbs: 78, protein: 20, fat: 14,
    ingredients: [
      { id: "beans", qty: 0.5 }, { id: "plantain", qty: 2 }, { id: "palmOil", qty: 0.2 }, { id: "tomatoes", qty: 0.2 },
      { id: "onions", qty: 1 }, { id: "crayfish", qty: 0.25 }, { id: "stock", qty: 1 },
    ],
    steps: [
      { title: "Cook the beans", text: "Boil the beans until soft. Drain the first water to reduce bloating." },
      { title: "Make the sauce", text: "Add blended tomatoes, onion, palm oil, crayfish and stock. Simmer until thick." },
      { title: "Fry the plantain", text: "Slice the plantain and shallow-fry until golden." },
    ],
  },
  {
    id: "fruit-salad", name: "Naija fruit salad", cuisine: "Nigerian", meal: "Snacks", emoji: "🍉",
    description: "Pawpaw, watermelon and banana — a sweet, hydrating snack with no added sugar.",
    prepMinutes: 10, cookMinutes: 0, difficulty: "Easy", servings: 4, kcal: 130, carbs: 30, protein: 2, fat: 0.5,
    ingredients: [{ id: "pawpaw", qty: 1 }, { id: "watermelon", qty: 0.5 }, { id: "banana", qty: 2 }],
    steps: [{ title: "Chop and mix", text: "Peel and cube the fruit. Chill before serving." }],
  },
  {
    id: "groundnut-banana", name: "Groundnuts & banana", cuisine: "Nigerian", meal: "Snacks", emoji: "🥜",
    description: "The classic on-the-go snack: a handful of roasted groundnuts with a banana.",
    prepMinutes: 1, cookMinutes: 0, difficulty: "Easy", servings: 1, kcal: 270, carbs: 30, protein: 9, fat: 14,
    ingredients: [{ id: "groundnuts", qty: 0.25 }, { id: "banana", qty: 1 }],
    steps: [{ title: "Pack it", text: "Measure a small handful of groundnuts and pair with one banana." }],
  },
  {
    id: "omelette", name: "Vegetable omelette & toast", cuisine: "Continental", meal: "Breakfast", emoji: "🍳",
    description: "Fluffy two-egg omelette packed with peppers, onions and spinach.",
    prepMinutes: 5, cookMinutes: 8, difficulty: "Easy", servings: 1, kcal: 330, carbs: 22, protein: 18, fat: 19,
    ingredients: [{ id: "eggs", qty: 2 }, { id: "peppers", qty: 0.05 }, { id: "onions", qty: 0.5 }, { id: "spinach", qty: 0.25 }, { id: "vegOil", qty: 0.05 }],
    steps: [
      { title: "Prep", text: "Chop the vegetables and whisk the eggs with a pinch of salt." },
      { title: "Cook", text: "Soften the vegetables in a little oil, pour in the eggs and cook until just set." },
    ],
  },
  {
    id: "salmon-veg", name: "Grilled salmon & vegetables", cuisine: "Continental", meal: "Dinner", emoji: "🐟",
    description: "Oily fish rich in omega-3, with roasted carrots and greens. Mackerel works well too.",
    prepMinutes: 10, cookMinutes: 20, difficulty: "Easy", servings: 2, kcal: 450, carbs: 18, protein: 36, fat: 25,
    ingredients: [{ id: "salmon", qty: 0.3 }, { id: "carrots", qty: 0.3 }, { id: "spinach", qty: 1 }, { id: "vegOil", qty: 0.05 }, { id: "spices", qty: 1 }],
    steps: [
      { title: "Season", text: "Rub the fish with oil, spices and a squeeze of lemon." },
      { title: "Roast", text: "Roast with sliced carrots at 200°C for 15–20 minutes." },
      { title: "Finish", text: "Wilt the greens in the hot tray and serve." },
    ],
  },
  {
    id: "bolognese", name: "Spaghetti bolognese", cuisine: "Continental", meal: "Lunch", emoji: "🍝",
    description: "Lean beef and tomato sauce with extra vegetables over spaghetti.",
    prepMinutes: 10, cookMinutes: 30, difficulty: "Easy", servings: 4, kcal: 520, carbs: 64, protein: 28, fat: 16,
    ingredients: [
      { id: "spaghetti", qty: 1 }, { id: "beef", qty: 0.4 }, { id: "tomatoes", qty: 0.6 }, { id: "onions", qty: 1 },
      { id: "carrots", qty: 0.2 }, { id: "vegOil", qty: 0.1 }, { id: "spices", qty: 2 },
    ],
    steps: [
      { title: "Brown the beef", text: "Fry minced beef with onion and grated carrot until browned." },
      { title: "Simmer the sauce", text: "Add blended tomatoes and spices. Simmer for 20 minutes." },
      { title: "Serve", text: "Cook the spaghetti and serve with the sauce." },
    ],
  },
  {
    id: "shawarma", name: "Chicken shawarma (lighter)", cuisine: "International", meal: "Dinner", emoji: "🌯",
    description: "Home-made shawarma with grilled chicken, crunchy cabbage and a light garlic sauce.",
    prepMinutes: 15, cookMinutes: 15, difficulty: "Easy", servings: 2, kcal: 540, carbs: 52, protein: 34, fat: 21,
    ingredients: [{ id: "pita", qty: 2 }, { id: "chicken", qty: 0.3 }, { id: "cabbage", qty: 0.25 }, { id: "carrots", qty: 0.1 }, { id: "garlicSauce", qty: 2 }, { id: "spices", qty: 1 }],
    steps: [
      { title: "Grill the chicken", text: "Season strips of chicken with spices and grill until charred." },
      { title: "Assemble", text: "Fill warm bread with chicken, shredded cabbage, carrots and a little garlic sauce. Roll tightly." },
    ],
  },
  {
    id: "curry-rice", name: "Chicken curry & rice", cuisine: "International", meal: "Lunch", emoji: "🍛",
    description: "A mild, tomato-based chicken curry with vegetables, served over boiled rice.",
    prepMinutes: 15, cookMinutes: 35, difficulty: "Medium", servings: 4, kcal: 540, carbs: 62, protein: 30, fat: 17,
    ingredients: [{ id: "chicken", qty: 0.5 }, { id: "rice", qty: 0.4 }, { id: "tomatoes", qty: 0.3 }, { id: "onions", qty: 2 }, { id: "carrots", qty: 0.2 }, { id: "spices", qty: 3 }, { id: "vegOil", qty: 0.1 }],
    steps: [
      { title: "Brown the chicken", text: "Fry onion and spices, then add chicken pieces and brown." },
      { title: "Simmer", text: "Add tomatoes and carrots with a little water. Simmer for 25 minutes." },
      { title: "Serve", text: "Serve with boiled rice." },
    ],
  },
  {
    id: "oatmeal", name: "Oatmeal with banana", cuisine: "International", meal: "Breakfast", emoji: "🥣",
    description: "Creamy oats cooked in milk, topped with sliced banana and a few groundnuts.",
    prepMinutes: 2, cookMinutes: 6, difficulty: "Easy", servings: 1, kcal: 340, carbs: 55, protein: 12, fat: 9,
    ingredients: [{ id: "oats", qty: 0.05 }, { id: "milk", qty: 0.25 }, { id: "banana", qty: 1 }, { id: "groundnuts", qty: 0.05 }],
    steps: [
      { title: "Cook the oats", text: "Simmer the oats in milk for 5 minutes, stirring often." },
      { title: "Top", text: "Top with sliced banana and a sprinkle of groundnuts." },
    ],
  },
  {
    id: "yoghurt-berries", name: "Yoghurt & fruit bowl", cuisine: "International", meal: "Snacks", emoji: "🫐",
    description: "Plain or Greek yoghurt with fresh fruit — a protein-rich snack.",
    prepMinutes: 3, cookMinutes: 0, difficulty: "Easy", servings: 1, kcal: 210, carbs: 24, protein: 14, fat: 6,
    ingredients: [{ id: "yoghurt", qty: 1 }, { id: "berries", qty: 0.5 }],
    steps: [{ title: "Assemble", text: "Spoon the yoghurt into a bowl and top with fruit." }],
  },
];

export function recipeById(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

export interface GroceryLine {
  key: IngredientId;
  name: string;
  category: GroceryCategory;
  unit: string;
  qty: number;
  costNaira: number;
}

/** Round shopping quantities to something you can actually buy. */
function roundQty(qty: number, unit: string): number {
  if (["piece", "cube", "bunch", "pack"].includes(unit)) return Math.max(1, Math.ceil(qty - 1e-9));
  return Math.max(0.05, Math.ceil(qty * 20 - 1e-9) / 20); // nearest 0.05 up
}

/**
 * Aggregate the ingredients for a list of planned recipes. Each planned item is one meal for
 * `people` people; recipe quantities are scaled from the recipe's own serving count.
 */
export function buildGroceryList(recipeIds: string[], people = 1): GroceryLine[] {
  const totals = new Map<IngredientId, number>();
  for (const id of recipeIds) {
    const r = recipeById(id);
    if (!r) continue;
    for (const ing of r.ingredients) {
      totals.set(ing.id, (totals.get(ing.id) ?? 0) + (ing.qty * people) / r.servings);
    }
  }
  return [...totals.entries()]
    .map(([key, raw]) => {
      const info = INGREDIENTS[key];
      const qty = roundQty(raw, info.unit);
      return { key, name: info.name, category: info.category as GroceryCategory, unit: info.unit, qty, costNaira: qty * info.priceNaira };
    })
    .sort((a, b) => GROCERY_CATEGORIES.indexOf(a.category) - GROCERY_CATEGORIES.indexOf(b.category) || a.name.localeCompare(b.name));
}

/**
 * A simple balanced sample week: rotates recipes for each meal, preferring the chosen cuisines.
 * Not a personalised plan — those are set by dietitians.
 */
export function sampleWeekPlan(dates: string[], cuisines: Cuisine[]): Array<{ date: string; meal: Meal; recipeId: string }> {
  const meals: Meal[] = ["Breakfast", "Lunch", "Dinner", "Snacks"];
  const out: Array<{ date: string; meal: Meal; recipeId: string }> = [];
  for (const meal of meals) {
    const preferred = RECIPES.filter((r) => r.meal === meal && cuisines.includes(r.cuisine));
    const pool = preferred.length > 0 ? preferred : RECIPES.filter((r) => r.meal === meal);
    dates.forEach((date, i) => out.push({ date, meal, recipeId: pool[i % pool.length].id }));
  }
  return out;
}
