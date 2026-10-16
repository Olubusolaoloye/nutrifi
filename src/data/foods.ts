// SAMPLE DATA — placeholder values for the prototype, NOT for clinical use.
// Real values will come from the West African / Nigerian food composition tables.

export interface Portion {
  label: string;
  grams: number;
}

export type FoodCategory = "Swallow" | "Rice & grains" | "Soups" | "Beans" | "Protein" | "Snacks & drinks";
export const FOOD_CATEGORIES: FoodCategory[] = ["Swallow", "Rice & grains", "Soups", "Beans", "Protein", "Snacks & drinks"];

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  /** Placeholder visual until real food photography is added. */
  emoji: string;
  aliases: string[];
  /** Per 100 g. */
  kcal: number;
  carbs: number;
  protein: number;
  fat: number;
  portions: Portion[];
  source: string;
}

const SAMPLE = "Sample data – not for clinical use";

const wraps: Portion[] = [
  { label: "Small wrap (fist-size)", grams: 150 },
  { label: "Medium wrap", grams: 250 },
  { label: "Large wrap", grams: 350 },
];
const riceSpoons: Portion[] = [
  { label: "1 cooking spoon", grams: 70 },
  { label: "2 cooking spoons", grams: 140 },
  { label: "1 plate", grams: 300 },
];
const soup: Portion[] = [
  { label: "Small serving", grams: 100 },
  { label: "1 serving", grams: 150 },
  { label: "Large serving", grams: 250 },
];

export const FOODS: Food[] = [
  { id: "eba", category: "Swallow", emoji: "🫓", name: "Eba", aliases: ["garri", "gari"], kcal: 160, carbs: 38, protein: 0.5, fat: 0.3, portions: wraps, source: SAMPLE },
  { id: "amala", category: "Swallow", emoji: "🫓", name: "Amala", aliases: ["yam flour", "elubo"], kcal: 130, carbs: 31, protein: 1.5, fat: 0.2, portions: wraps, source: SAMPLE },
  { id: "pounded-yam", category: "Swallow", emoji: "🫓", name: "Pounded yam", aliases: ["iyan", "poundo"], kcal: 150, carbs: 35, protein: 1.5, fat: 0.2, portions: wraps, source: SAMPLE },
  { id: "jollof", category: "Rice & grains", emoji: "🍛", name: "Jollof rice", aliases: ["party rice"], kcal: 160, carbs: 26, protein: 3, fat: 5, portions: riceSpoons, source: SAMPLE },
  { id: "white-rice", category: "Rice & grains", emoji: "🍚", name: "White rice (boiled)", aliases: ["rice"], kcal: 130, carbs: 28, protein: 2.7, fat: 0.3, portions: riceSpoons, source: SAMPLE },
  { id: "ofada", category: "Rice & grains", emoji: "🍚", name: "Ofada rice (boiled)", aliases: ["local rice"], kcal: 125, carbs: 26, protein: 3, fat: 1, portions: riceSpoons, source: SAMPLE },
  { id: "beans", category: "Beans", emoji: "🫘", name: "Beans (stewed)", aliases: ["ewa", "porridge beans"], kcal: 140, carbs: 20, protein: 8, fat: 3,
    portions: [{ label: "1 cooking spoon", grams: 80 }, { label: "2 cooking spoons", grams: 160 }, { label: "1 plate", grams: 300 }], source: SAMPLE },
  { id: "moimoi", category: "Beans", emoji: "🫘", name: "Moi moi", aliases: ["moin moin", "bean pudding"], kcal: 150, carbs: 12, protein: 8, fat: 8,
    portions: [{ label: "Half wrap", grams: 75 }, { label: "1 wrap / leaf", grams: 150 }], source: SAMPLE },
  { id: "akara", category: "Beans", emoji: "🧆", name: "Akara", aliases: ["bean cake", "kosai"], kcal: 280, carbs: 18, protein: 10, fat: 18,
    portions: [{ label: "1 ball", grams: 25 }, { label: "3 balls", grams: 75 }, { label: "5 balls", grams: 125 }], source: SAMPLE },
  { id: "dodo", category: "Snacks & drinks", emoji: "🍌", name: "Fried plantain (dodo)", aliases: ["plantain", "dodo"], kcal: 230, carbs: 38, protein: 1, fat: 9,
    portions: [{ label: "5 pieces", grams: 75 }, { label: "10 pieces", grams: 150 }], source: SAMPLE },
  { id: "egusi", category: "Soups", emoji: "🍲", name: "Egusi soup", aliases: ["melon soup"], kcal: 250, carbs: 6, protein: 10, fat: 21, portions: soup, source: SAMPLE },
  { id: "efo", category: "Soups", emoji: "🥬", name: "Efo riro", aliases: ["vegetable soup", "spinach stew"], kcal: 120, carbs: 5, protein: 6, fat: 9, portions: soup, source: SAMPLE },
  { id: "okra", category: "Soups", emoji: "🍲", name: "Okra soup", aliases: ["okro", "ila"], kcal: 70, carbs: 6, protein: 4, fat: 3, portions: soup, source: SAMPLE },
  { id: "ogbono", category: "Soups", emoji: "🍲", name: "Ogbono soup", aliases: ["draw soup", "apon"], kcal: 230, carbs: 7, protein: 8, fat: 19, portions: soup, source: SAMPLE },
  { id: "beef", category: "Protein", emoji: "🥩", name: "Beef (stewed)", aliases: ["meat"], kcal: 250, carbs: 0, protein: 26, fat: 16,
    portions: [{ label: "Small piece", grams: 30 }, { label: "Medium piece", grams: 50 }, { label: "Large piece", grams: 80 }], source: SAMPLE },
  { id: "chicken", category: "Protein", emoji: "🍗", name: "Chicken (stewed)", aliases: ["fowl"], kcal: 220, carbs: 0, protein: 25, fat: 13,
    portions: [{ label: "Small piece", grams: 60 }, { label: "Medium piece", grams: 100 }, { label: "Large piece", grams: 150 }], source: SAMPLE },
  { id: "fish", category: "Protein", emoji: "🐟", name: "Fish (stewed, e.g. titus)", aliases: ["mackerel", "titus", "eja"], kcal: 200, carbs: 0, protein: 22, fat: 12,
    portions: [{ label: "Small piece", grams: 60 }, { label: "Medium piece", grams: 100 }], source: SAMPLE },
  { id: "suya", category: "Protein", emoji: "🍢", name: "Suya", aliases: ["kebab", "beef suya"], kcal: 260, carbs: 4, protein: 28, fat: 15,
    portions: [{ label: "1 stick", grams: 50 }, { label: "₦1,000 wrap", grams: 120 }], source: SAMPLE },
  { id: "bread", category: "Rice & grains", emoji: "🍞", name: "Bread (white)", aliases: ["agege bread", "loaf"], kcal: 265, carbs: 49, protein: 9, fat: 3,
    portions: [{ label: "1 slice", grams: 30 }, { label: "2 slices", grams: 60 }, { label: "4 slices", grams: 120 }], source: SAMPLE },
  { id: "pap", category: "Rice & grains", emoji: "🥣", name: "Pap (ogi / akamu)", aliases: ["ogi", "akamu", "koko"], kcal: 50, carbs: 11, protein: 0.5, fat: 0.3,
    portions: [{ label: "1 cup", grams: 250 }, { label: "1 bowl", grams: 400 }], source: SAMPLE },
  { id: "groundnut", category: "Snacks & drinks", emoji: "🥜", name: "Groundnuts (roasted)", aliases: ["peanuts", "epa"], kcal: 585, carbs: 21, protein: 24, fat: 50,
    portions: [{ label: "1 small pack", grams: 30 }, { label: "1 handful", grams: 40 }], source: SAMPLE },
  { id: "indomie", category: "Rice & grains", emoji: "🍜", name: "Instant noodles (cooked)", aliases: ["indomie", "noodles"], kcal: 190, carbs: 26, protein: 4, fat: 8,
    portions: [{ label: "1 pack (cooked)", grams: 200 }, { label: "2 packs (cooked)", grams: 400 }], source: SAMPLE },
  { id: "zobo", category: "Snacks & drinks", emoji: "🥤", name: "Zobo (sweetened)", aliases: ["hibiscus drink", "sobo"], kcal: 45, carbs: 11, protein: 0, fat: 0,
    portions: [{ label: "1 cup", grams: 250 }, { label: "1 bottle (35cl)", grams: 350 }], source: SAMPLE },
  { id: "tea", category: "Snacks & drinks", emoji: "☕", name: "Tea with milk & sugar", aliases: ["tea", "lipton"], kcal: 40, carbs: 6, protein: 1, fat: 1.5,
    portions: [{ label: "1 cup", grams: 250 }], source: SAMPLE },
  { id: "egg", category: "Protein", emoji: "🥚", name: "Egg (boiled)", aliases: ["eggs"], kcal: 155, carbs: 1, protein: 13, fat: 11,
    portions: [{ label: "1 egg", grams: 50 }, { label: "2 eggs", grams: 100 }], source: SAMPLE },
];

export function searchFoods(query: string): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return FOODS;
  return FOODS.filter(
    (f) => f.name.toLowerCase().includes(q) || f.aliases.some((a) => a.toLowerCase().includes(q)),
  );
}

export function foodById(id: string): Food | undefined {
  return FOODS.find((f) => f.id === id);
}

export function nutrientsFor(food: Food, grams: number) {
  const k = grams / 100;
  return { kcal: food.kcal * k, carbs: food.carbs * k, protein: food.protein * k, fat: food.fat * k };
}
