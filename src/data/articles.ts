// SAMPLE CONTENT for the prototype. Real articles are written or reviewed by dietitians.
export type ArticleScope = "Global" | "Nigeria" | "Prevention";

export interface Article {
  id: string;
  scope: ArticleScope;
  title: string;
  summary: string;
  body: string[];
  readMinutes: number;
  source: string;
}

export const ARTICLES: Article[] = [
  {
    id: "swallow-portions",
    scope: "Nigeria",
    title: "Enjoy your swallow — just mind the wrap size",
    summary: "Eba, amala and pounded yam can fit a healthy diet. Portion size is what matters.",
    body: [
      "Swallows are mostly starch, which gives you energy. A fist-sized wrap is a good portion for most adults at one meal.",
      "Fill more of your bowl with vegetable-rich soups like efo riro or okra, and add a palm-sized piece of fish, meat or beans.",
      "Try this plate: about half vegetables and soup, a quarter swallow, a quarter protein.",
    ],
    readMinutes: 2,
    source: "Sample content – Nutrifi editorial (to be dietitian-reviewed)",
  },
  {
    id: "water-sachets",
    scope: "Prevention",
    title: "Hot weather? Keep your water sachets coming",
    summary: "Simple ways to stay hydrated through the day, at work or on the road.",
    body: [
      "Thirst, dark urine and headaches can be signs you need more fluid.",
      "Keep a sachet or bottle within reach and drink regularly, not only with meals.",
      "Choose water over sugary drinks most of the time — zobo and soft drinks can carry a lot of sugar.",
    ],
    readMinutes: 2,
    source: "Sample content – Nutrifi editorial (to be dietitian-reviewed)",
  },
  {
    id: "salt-bp",
    scope: "Global",
    title: "Less salt, healthier blood pressure",
    summary: "Seasoning cubes and added salt add up. Small swaps make a difference.",
    body: [
      "Cutting down on salt is one of the simplest ways to protect your heart and blood pressure.",
      "Use fewer seasoning cubes, taste before adding salt, and flavour food with onions, pepper, ginger, garlic and local spices.",
      "If you have high blood pressure, ask a dietitian for a plan that fits your favourite meals.",
    ],
    readMinutes: 3,
    source: "Sample content – Nutrifi editorial (to be dietitian-reviewed)",
  },
  {
    id: "fruit-veg",
    scope: "Prevention",
    title: "Add colour to every meal",
    summary: "Local fruits and vegetables are affordable ways to get vitamins and fibre.",
    body: [
      "Garden egg, ugu, waterleaf, carrots, oranges, pawpaw and watermelon are easy local choices.",
      "Aim to include a vegetable or fruit at every meal and snack.",
    ],
    readMinutes: 2,
    source: "Sample content – Nutrifi editorial (to be dietitian-reviewed)",
  },
];
