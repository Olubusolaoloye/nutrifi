// SAMPLE DATA — placeholder values for the prototype, NOT for clinical use.
// Real values will come from the West African / Nigerian food composition tables
// and, for continental and international dishes, USDA FoodData Central.
import { recipeById, type Recipe } from "./recipes";

export interface Portion {
  label: string;
  grams: number;
}

export type Cuisine = "Nigerian" | "Continental" | "International";

export const CUISINES: Array<{ id: Cuisine; label: string; emoji: string; blurb: string }> = [
  { id: "Nigerian", label: "Naija", emoji: "🇳🇬", blurb: "Swallows, soups, rice and street favourites" },
  { id: "Continental", label: "Continental", emoji: "🍽️", blurb: "European-style breakfasts, mains and sides" },
  { id: "International", label: "International", emoji: "🌍", blurb: "Popular dishes from around the world" },
];

/** Category sections shown for each cuisine, in display order. */
export const CATEGORIES_BY_CUISINE: Record<Cuisine, string[]> = {
  Nigerian: ["Swallow", "Rice & grains", "Soups", "Beans", "Protein", "Snacks & drinks"],
  Continental: ["Breakfast", "Mains", "Pasta", "Salads & soups", "Sides & bakery"],
  International: ["Fast food", "Asian", "Middle Eastern", "Mexican", "Healthy bowls"],
};

export interface Food {
  id: string;
  name: string;
  cuisine: Cuisine;
  category: string;
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


const plate = (grams: number): Portion[] => [
  { label: "Small plate", grams: Math.round(grams * 0.7) },
  { label: "1 plate", grams },
  { label: "Large plate", grams: Math.round(grams * 1.4) },
];
const bowl = (grams: number): Portion[] => [
  { label: "Small bowl", grams: Math.round(grams * 0.7) },
  { label: "1 bowl", grams },
];

const CONTINENTAL: Food[] = [
  { id: "english-breakfast", cuisine: "Continental", category: "Breakfast", emoji: "🍳", name: "Full English breakfast", aliases: ["fry-up", "eggs and sausage"], kcal: 200, carbs: 8, protein: 11, fat: 14, portions: [{ label: "Light plate", grams: 250 }, { label: "Full plate", grams: 400 }], source: SAMPLE },
  { id: "omelette", cuisine: "Continental", category: "Breakfast", emoji: "🍳", name: "Vegetable omelette", aliases: ["omelet", "eggs"], kcal: 155, carbs: 2, protein: 11, fat: 12, portions: [{ label: "2-egg omelette", grams: 130 }, { label: "3-egg omelette", grams: 190 }], source: SAMPLE },
  { id: "pancakes", cuisine: "Continental", category: "Breakfast", emoji: "🥞", name: "Pancakes with syrup", aliases: ["pancake", "flapjacks"], kcal: 230, carbs: 32, protein: 6, fat: 9, portions: [{ label: "2 pancakes", grams: 120 }, { label: "3 pancakes", grams: 180 }], source: SAMPLE },
  { id: "french-toast", cuisine: "Continental", category: "Breakfast", emoji: "🍞", name: "French toast", aliases: ["eggy bread"], kcal: 230, carbs: 25, protein: 8, fat: 11, portions: [{ label: "1 slice", grams: 65 }, { label: "2 slices", grams: 130 }], source: SAMPLE },
  { id: "grilled-salmon", cuisine: "Continental", category: "Mains", emoji: "🐟", name: "Grilled salmon & vegetables", aliases: ["salmon", "fish fillet"], kcal: 150, carbs: 4, protein: 16, fat: 8, portions: plate(320), source: SAMPLE },
  { id: "steak-chips", cuisine: "Continental", category: "Mains", emoji: "🥩", name: "Steak & chips", aliases: ["steak frites", "beef steak"], kcal: 220, carbs: 15, protein: 15, fat: 11, portions: plate(350), source: SAMPLE },
  { id: "roast-chicken", cuisine: "Continental", category: "Mains", emoji: "🍗", name: "Roast chicken & potatoes", aliases: ["sunday roast"], kcal: 170, carbs: 10, protein: 15, fat: 8, portions: plate(350), source: SAMPLE },
  { id: "fish-chips", cuisine: "Continental", category: "Mains", emoji: "🍟", name: "Fish & chips", aliases: ["battered fish"], kcal: 230, carbs: 20, protein: 10, fat: 12, portions: plate(350), source: SAMPLE },
  { id: "bolognese", cuisine: "Continental", category: "Pasta", emoji: "🍝", name: "Spaghetti bolognese", aliases: ["spag bol", "spaghetti", "pasta"], kcal: 150, carbs: 18, protein: 7, fat: 5, portions: plate(350), source: SAMPLE },
  { id: "lasagne", cuisine: "Continental", category: "Pasta", emoji: "🫕", name: "Beef lasagne", aliases: ["lasagna"], kcal: 165, carbs: 15, protein: 9, fat: 8, portions: [{ label: "Small slice", grams: 180 }, { label: "1 slice", grams: 250 }], source: SAMPLE },
  { id: "alfredo", cuisine: "Continental", category: "Pasta", emoji: "🍝", name: "Chicken Alfredo pasta", aliases: ["creamy pasta", "fettuccine"], kcal: 190, carbs: 18, protein: 10, fat: 9, portions: plate(330), source: SAMPLE },
  { id: "caesar", cuisine: "Continental", category: "Salads & soups", emoji: "🥗", name: "Chicken Caesar salad", aliases: ["salad"], kcal: 130, carbs: 6, protein: 9, fat: 8, portions: bowl(280), source: SAMPLE },
  { id: "greek-salad", cuisine: "Continental", category: "Salads & soups", emoji: "🥗", name: "Greek salad with feta", aliases: ["feta salad", "salad"], kcal: 110, carbs: 5, protein: 4, fat: 9, portions: bowl(250), source: SAMPLE },
  { id: "cream-soup", cuisine: "Continental", category: "Salads & soups", emoji: "🥣", name: "Cream of mushroom soup", aliases: ["mushroom soup"], kcal: 70, carbs: 6, protein: 2, fat: 4, portions: bowl(300), source: SAMPLE },
  { id: "mash", cuisine: "Continental", category: "Sides & bakery", emoji: "🥔", name: "Mashed potatoes", aliases: ["mash", "potato"], kcal: 110, carbs: 16, protein: 2, fat: 4, portions: [{ label: "1 scoop", grams: 100 }, { label: "Side portion", grams: 180 }], source: SAMPLE },
  { id: "croissant", cuisine: "Continental", category: "Sides & bakery", emoji: "🥐", name: "Butter croissant", aliases: ["pastry"], kcal: 406, carbs: 45, protein: 8, fat: 21, portions: [{ label: "1 croissant", grams: 60 }], source: SAMPLE },
];

const INTERNATIONAL: Food[] = [
  { id: "shawarma", cuisine: "International", category: "Fast food", emoji: "🌯", name: "Chicken shawarma", aliases: ["wrap", "shawama"], kcal: 210, carbs: 20, protein: 13, fat: 9, portions: [{ label: "Regular wrap", grams: 250 }, { label: "Jumbo wrap", grams: 380 }], source: SAMPLE },
  { id: "burger", cuisine: "International", category: "Fast food", emoji: "🍔", name: "Beef burger", aliases: ["cheeseburger", "hamburger"], kcal: 260, carbs: 24, protein: 13, fat: 12, portions: [{ label: "1 burger", grams: 220 }, { label: "Double burger", grams: 320 }], source: SAMPLE },
  { id: "pizza", cuisine: "International", category: "Fast food", emoji: "🍕", name: "Pepperoni pizza", aliases: ["pizza slice"], kcal: 270, carbs: 30, protein: 12, fat: 11, portions: [{ label: "1 slice", grams: 110 }, { label: "2 slices", grams: 220 }, { label: "4 slices", grams: 440 }], source: SAMPLE },
  { id: "fried-chicken", cuisine: "International", category: "Fast food", emoji: "🍗", name: "Fried chicken", aliases: ["chicken wings", "crispy chicken"], kcal: 260, carbs: 9, protein: 20, fat: 16, portions: [{ label: "1 piece", grams: 100 }, { label: "2 pieces", grams: 200 }, { label: "3 pieces", grams: 300 }], source: SAMPLE },
  { id: "fries", cuisine: "International", category: "Fast food", emoji: "🍟", name: "French fries", aliases: ["chips", "fries"], kcal: 312, carbs: 41, protein: 3.4, fat: 15, portions: [{ label: "Small", grams: 80 }, { label: "Medium", grams: 115 }, { label: "Large", grams: 150 }], source: SAMPLE },
  { id: "chinese-fried-rice", cuisine: "International", category: "Asian", emoji: "🍚", name: "Chinese fried rice", aliases: ["egg fried rice"], kcal: 170, carbs: 25, protein: 5, fat: 6, portions: plate(300), source: SAMPLE },
  { id: "chicken-curry", cuisine: "International", category: "Asian", emoji: "🍛", name: "Chicken curry", aliases: ["curry", "tikka masala"], kcal: 150, carbs: 6, protein: 13, fat: 8, portions: bowl(250), source: SAMPLE },
  { id: "sushi", cuisine: "International", category: "Asian", emoji: "🍣", name: "Sushi rolls", aliases: ["maki", "california roll"], kcal: 150, carbs: 29, protein: 5, fat: 1.5, portions: [{ label: "6 pieces", grams: 180 }, { label: "12 pieces", grams: 360 }], source: SAMPLE },
  { id: "pad-thai", cuisine: "International", category: "Asian", emoji: "🍜", name: "Pad Thai", aliases: ["thai noodles"], kcal: 160, carbs: 22, protein: 7, fat: 5, portions: plate(300), source: SAMPLE },
  { id: "ramen", cuisine: "International", category: "Asian", emoji: "🍜", name: "Chicken ramen", aliases: ["noodle soup"], kcal: 90, carbs: 11, protein: 5, fat: 3, portions: bowl(450), source: SAMPLE },
  { id: "hummus-pita", cuisine: "International", category: "Middle Eastern", emoji: "🧆", name: "Hummus & pita", aliases: ["hummus", "pita bread"], kcal: 240, carbs: 30, protein: 8, fat: 10, portions: [{ label: "Small serving", grams: 100 }, { label: "1 serving", grams: 150 }], source: SAMPLE },
  { id: "falafel", cuisine: "International", category: "Middle Eastern", emoji: "🧆", name: "Falafel wrap", aliases: ["falafel"], kcal: 230, carbs: 28, protein: 8, fat: 10, portions: [{ label: "1 wrap", grams: 250 }], source: SAMPLE },
  { id: "tacos", cuisine: "International", category: "Mexican", emoji: "🌮", name: "Beef tacos", aliases: ["taco"], kcal: 220, carbs: 20, protein: 10, fat: 11, portions: [{ label: "1 taco", grams: 100 }, { label: "2 tacos", grams: 200 }, { label: "3 tacos", grams: 300 }], source: SAMPLE },
  { id: "burrito", cuisine: "International", category: "Mexican", emoji: "🌯", name: "Chicken burrito", aliases: ["burrito bowl"], kcal: 180, carbs: 20, protein: 10, fat: 6, portions: [{ label: "1 burrito", grams: 330 }], source: SAMPLE },
  { id: "oatmeal", cuisine: "International", category: "Healthy bowls", emoji: "🥣", name: "Oatmeal with banana", aliases: ["oats", "porridge oats"], kcal: 85, carbs: 15, protein: 2.5, fat: 1.5, portions: bowl(300), source: SAMPLE },
  { id: "yoghurt-bowl", cuisine: "International", category: "Healthy bowls", emoji: "🫐", name: "Greek yoghurt & berries", aliases: ["parfait", "yogurt"], kcal: 95, carbs: 10, protein: 7, fat: 3, portions: bowl(220), source: SAMPLE },
  { id: "poke", cuisine: "International", category: "Healthy bowls", emoji: "🥙", name: "Chicken quinoa bowl", aliases: ["grain bowl", "quinoa"], kcal: 140, carbs: 15, protein: 11, fat: 4, portions: bowl(350), source: SAMPLE },
];

const NIGERIAN: Food[] = [
  { id: "eba", cuisine: "Nigerian", category: "Swallow", emoji: "🫓", name: "Eba", aliases: ["garri", "gari"], kcal: 160, carbs: 38, protein: 0.5, fat: 0.3, portions: wraps, source: SAMPLE },
  { id: "amala", cuisine: "Nigerian", category: "Swallow", emoji: "🫓", name: "Amala", aliases: ["yam flour", "elubo"], kcal: 130, carbs: 31, protein: 1.5, fat: 0.2, portions: wraps, source: SAMPLE },
  { id: "pounded-yam", cuisine: "Nigerian", category: "Swallow", emoji: "🫓", name: "Pounded yam", aliases: ["iyan", "poundo"], kcal: 150, carbs: 35, protein: 1.5, fat: 0.2, portions: wraps, source: SAMPLE },
  { id: "jollof", cuisine: "Nigerian", category: "Rice & grains", emoji: "🍛", name: "Jollof rice", aliases: ["party rice"], kcal: 160, carbs: 26, protein: 3, fat: 5, portions: riceSpoons, source: SAMPLE },
  { id: "white-rice", cuisine: "Nigerian", category: "Rice & grains", emoji: "🍚", name: "White rice (boiled)", aliases: ["rice"], kcal: 130, carbs: 28, protein: 2.7, fat: 0.3, portions: riceSpoons, source: SAMPLE },
  { id: "ofada", cuisine: "Nigerian", category: "Rice & grains", emoji: "🍚", name: "Ofada rice (boiled)", aliases: ["local rice"], kcal: 125, carbs: 26, protein: 3, fat: 1, portions: riceSpoons, source: SAMPLE },
  { id: "beans", cuisine: "Nigerian", category: "Beans", emoji: "🫘", name: "Beans (stewed)", aliases: ["ewa", "porridge beans"], kcal: 140, carbs: 20, protein: 8, fat: 3,
    portions: [{ label: "1 cooking spoon", grams: 80 }, { label: "2 cooking spoons", grams: 160 }, { label: "1 plate", grams: 300 }], source: SAMPLE },
  { id: "moimoi", cuisine: "Nigerian", category: "Beans", emoji: "🫘", name: "Moi moi", aliases: ["moin moin", "bean pudding"], kcal: 150, carbs: 12, protein: 8, fat: 8,
    portions: [{ label: "Half wrap", grams: 75 }, { label: "1 wrap / leaf", grams: 150 }], source: SAMPLE },
  { id: "akara", cuisine: "Nigerian", category: "Beans", emoji: "🧆", name: "Akara", aliases: ["bean cake", "kosai"], kcal: 280, carbs: 18, protein: 10, fat: 18,
    portions: [{ label: "1 ball", grams: 25 }, { label: "3 balls", grams: 75 }, { label: "5 balls", grams: 125 }], source: SAMPLE },
  { id: "dodo", cuisine: "Nigerian", category: "Snacks & drinks", emoji: "🍌", name: "Fried plantain (dodo)", aliases: ["plantain", "dodo"], kcal: 230, carbs: 38, protein: 1, fat: 9,
    portions: [{ label: "5 pieces", grams: 75 }, { label: "10 pieces", grams: 150 }], source: SAMPLE },
  { id: "egusi", cuisine: "Nigerian", category: "Soups", emoji: "🍲", name: "Egusi soup", aliases: ["melon soup"], kcal: 250, carbs: 6, protein: 10, fat: 21, portions: soup, source: SAMPLE },
  { id: "efo", cuisine: "Nigerian", category: "Soups", emoji: "🥬", name: "Efo riro", aliases: ["vegetable soup", "spinach stew"], kcal: 120, carbs: 5, protein: 6, fat: 9, portions: soup, source: SAMPLE },
  { id: "okra", cuisine: "Nigerian", category: "Soups", emoji: "🍲", name: "Okra soup", aliases: ["okro", "ila"], kcal: 70, carbs: 6, protein: 4, fat: 3, portions: soup, source: SAMPLE },
  { id: "ogbono", cuisine: "Nigerian", category: "Soups", emoji: "🍲", name: "Ogbono soup", aliases: ["draw soup", "apon"], kcal: 230, carbs: 7, protein: 8, fat: 19, portions: soup, source: SAMPLE },
  { id: "beef", cuisine: "Nigerian", category: "Protein", emoji: "🥩", name: "Beef (stewed)", aliases: ["meat"], kcal: 250, carbs: 0, protein: 26, fat: 16,
    portions: [{ label: "Small piece", grams: 30 }, { label: "Medium piece", grams: 50 }, { label: "Large piece", grams: 80 }], source: SAMPLE },
  { id: "chicken", cuisine: "Nigerian", category: "Protein", emoji: "🍗", name: "Chicken (stewed)", aliases: ["fowl"], kcal: 220, carbs: 0, protein: 25, fat: 13,
    portions: [{ label: "Small piece", grams: 60 }, { label: "Medium piece", grams: 100 }, { label: "Large piece", grams: 150 }], source: SAMPLE },
  { id: "fish", cuisine: "Nigerian", category: "Protein", emoji: "🐟", name: "Fish (stewed, e.g. titus)", aliases: ["mackerel", "titus", "eja"], kcal: 200, carbs: 0, protein: 22, fat: 12,
    portions: [{ label: "Small piece", grams: 60 }, { label: "Medium piece", grams: 100 }], source: SAMPLE },
  { id: "suya", cuisine: "Nigerian", category: "Protein", emoji: "🍢", name: "Suya", aliases: ["kebab", "beef suya"], kcal: 260, carbs: 4, protein: 28, fat: 15,
    portions: [{ label: "1 stick", grams: 50 }, { label: "₦1,000 wrap", grams: 120 }], source: SAMPLE },
  { id: "bread", cuisine: "Nigerian", category: "Rice & grains", emoji: "🍞", name: "Bread (white)", aliases: ["agege bread", "loaf"], kcal: 265, carbs: 49, protein: 9, fat: 3,
    portions: [{ label: "1 slice", grams: 30 }, { label: "2 slices", grams: 60 }, { label: "4 slices", grams: 120 }], source: SAMPLE },
  { id: "pap", cuisine: "Nigerian", category: "Rice & grains", emoji: "🥣", name: "Pap (ogi / akamu)", aliases: ["ogi", "akamu", "koko"], kcal: 50, carbs: 11, protein: 0.5, fat: 0.3,
    portions: [{ label: "1 cup", grams: 250 }, { label: "1 bowl", grams: 400 }], source: SAMPLE },
  { id: "groundnut", cuisine: "Nigerian", category: "Snacks & drinks", emoji: "🥜", name: "Groundnuts (roasted)", aliases: ["peanuts", "epa"], kcal: 585, carbs: 21, protein: 24, fat: 50,
    portions: [{ label: "1 small pack", grams: 30 }, { label: "1 handful", grams: 40 }], source: SAMPLE },
  { id: "indomie", cuisine: "Nigerian", category: "Rice & grains", emoji: "🍜", name: "Instant noodles (cooked)", aliases: ["indomie", "noodles"], kcal: 190, carbs: 26, protein: 4, fat: 8,
    portions: [{ label: "1 pack (cooked)", grams: 200 }, { label: "2 packs (cooked)", grams: 400 }], source: SAMPLE },
  { id: "zobo", cuisine: "Nigerian", category: "Snacks & drinks", emoji: "🥤", name: "Zobo (sweetened)", aliases: ["hibiscus drink", "sobo"], kcal: 45, carbs: 11, protein: 0, fat: 0,
    portions: [{ label: "1 cup", grams: 250 }, { label: "1 bottle (35cl)", grams: 350 }], source: SAMPLE },
  { id: "tea", cuisine: "Nigerian", category: "Snacks & drinks", emoji: "☕", name: "Tea with milk & sugar", aliases: ["tea", "lipton"], kcal: 40, carbs: 6, protein: 1, fat: 1.5,
    portions: [{ label: "1 cup", grams: 250 }], source: SAMPLE },
  { id: "egg", cuisine: "Nigerian", category: "Protein", emoji: "🥚", name: "Egg (boiled)", aliases: ["eggs"], kcal: 155, carbs: 1, protein: 13, fat: 11,
    portions: [{ label: "1 egg", grams: 50 }, { label: "2 eggs", grams: 100 }], source: SAMPLE },
];

export const FOODS: Food[] = [...NIGERIAN, ...CONTINENTAL, ...INTERNATIONAL];

export function searchFoods(query: string): Food[] {
  const q = query.trim().toLowerCase();
  if (!q) return FOODS;
  return FOODS.filter(
    (f) => f.name.toLowerCase().includes(q) || f.aliases.some((a) => a.toLowerCase().includes(q)),
  );
}

export const RECIPE_PREFIX = "recipe:";

/** A recipe as a loggable food: 100 "g" = 1 serving, so the diary maths works unchanged. */
function recipeAsFood(r: Recipe): Food {
  return {
    id: RECIPE_PREFIX + r.id,
    name: r.name,
    cuisine: r.cuisine,
    category: "Recipe",
    emoji: r.emoji,
    aliases: ["recipe"],
    kcal: r.kcal,
    carbs: r.carbs,
    protein: r.protein,
    fat: r.fat,
    portions: [
      { label: "½ serving", grams: 50 },
      { label: "1 serving", grams: 100 },
      { label: "2 servings", grams: 200 },
    ],
    source: "Sample recipe – not for clinical use",
  };
}

export function foodById(id: string): Food | undefined {
  if (id.startsWith(RECIPE_PREFIX)) {
    const r = recipeById(id.slice(RECIPE_PREFIX.length));
    return r ? recipeAsFood(r) : undefined;
  }
  return FOODS.find((f) => f.id === id);
}

export function nutrientsFor(food: Food, grams: number) {
  const k = grams / 100;
  return { kcal: food.kcal * k, carbs: food.carbs * k, protein: food.protein * k, fat: food.fat * k };
}
