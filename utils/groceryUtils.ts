// Grocery utility functions for categorization and recipe management

// Supermarket categories for organizing shopping lists
export const SUPERMARKET_CATEGORIES = {
  PRODUCE: {
    name: "Produce",
    icon: "leaf-outline",
    color: "#22C55E",
    keywords: [
      "apple",
      "banana",
      "orange",
      "lemon",
      "lime",
      "tomato",
      "onion",
      "garlic",
      "potato",
      "carrot",
      "celery",
      "bell pepper",
      "cucumber",
      "lettuce",
      "spinach",
      "broccoli",
      "cauliflower",
      "mushroom",
      "avocado",
      "ginger",
      "herbs",
      "parsley",
      "cilantro",
      "basil",
      "mint",
      "thyme",
      "rosemary",
      "oregano",
      "dill",
      "chives",
      "green onion",
      "spring onion",
      "scallion",
      "shallot",
      "leek",
      "cabbage",
      "kale",
      "arugula",
      "bok choy",
      "zucchini",
      "squash",
      "eggplant",
      "radish",
      "beets",
      "turnip",
      "sweet potato",
      "corn",
      "peas",
      "green beans",
      "asparagus",
      "artichoke",
      "fennel",
      "jalapeño",
      "serrano",
      "habanero",
      "poblano",
      "strawberry",
      "blueberry",
      "raspberry",
      "blackberry",
      "grape",
      "pineapple",
      "mango",
      "papaya",
      "kiwi",
      "peach",
      "pear",
      "plum",
      "cherry",
      "watermelon",
      "cantaloupe",
      "honeydew",
      "coconut",
      "dates",
      "figs",
    ],
  },
  MEAT_SEAFOOD: {
    name: "Meat & Seafood",
    icon: "fish-outline",
    color: "#EF4444",
    keywords: [
      "chicken",
      "beef",
      "pork",
      "lamb",
      "turkey",
      "duck",
      "fish",
      "salmon",
      "tuna",
      "cod",
      "halibut",
      "mahi mahi",
      "tilapia",
      "shrimp",
      "crab",
      "lobster",
      "scallops",
      "mussels",
      "clams",
      "oysters",
      "squid",
      "octopus",
      "ground beef",
      "ground turkey",
      "ground chicken",
      "ground pork",
      "steak",
      "roast",
      "ribs",
      "chops",
      "tenderloin",
      "breast",
      "thigh",
      "wing",
      "drumstick",
      "bacon",
      "sausage",
      "ham",
      "prosciutto",
      "pepperoni",
      "chorizo",
      "bratwurst",
      "hot dog",
      "deli meat",
      "lunch meat",
    ],
  },
  DAIRY_EGGS: {
    name: "Dairy & Eggs",
    icon: "ellipse-outline",
    color: "#F59E0B",
    keywords: [
      "milk",
      "cream",
      "butter",
      "cheese",
      "cheddar",
      "mozzarella",
      "parmesan",
      "swiss",
      "goat cheese",
      "feta",
      "ricotta",
      "cottage cheese",
      "cream cheese",
      "sour cream",
      "yogurt",
      "greek yogurt",
      "eggs",
      "egg whites",
      "egg yolks",
      "heavy cream",
      "half and half",
      "buttermilk",
      "whipped cream",
      "mascarpone",
      "brie",
      "camembert",
      "blue cheese",
      "gorgonzola",
      "provolone",
      "monterey jack",
      "colby",
      "american cheese",
      "string cheese",
      "shredded cheese",
    ],
  },
  PANTRY_STAPLES: {
    name: "Pantry Staples",
    icon: "library-outline",
    color: "#8B5CF6",
    keywords: [
      "flour",
      "sugar",
      "salt",
      "pepper",
      "oil",
      "olive oil",
      "vegetable oil",
      "coconut oil",
      "vinegar",
      "balsamic vinegar",
      "apple cider vinegar",
      "rice vinegar",
      "soy sauce",
      "worcestershire",
      "hot sauce",
      "ketchup",
      "mustard",
      "mayonnaise",
      "honey",
      "maple syrup",
      "vanilla",
      "baking powder",
      "baking soda",
      "yeast",
      "cornstarch",
      "breadcrumbs",
      "panko",
      "pasta",
      "spaghetti",
      "penne",
      "fusilli",
      "linguine",
      "fettuccine",
      "lasagna",
      "rice",
      "quinoa",
      "barley",
      "oats",
      "couscous",
      "bulgur",
      "farro",
      "lentils",
      "chickpeas",
      "black beans",
      "kidney beans",
      "pinto beans",
      "navy beans",
      "cannellini beans",
      "split peas",
      "nuts",
      "almonds",
      "walnuts",
      "pecans",
      "cashews",
      "peanuts",
      "pine nuts",
      "hazelnuts",
      "sesame seeds",
      "sunflower seeds",
      "pumpkin seeds",
      "chia seeds",
      "flax seeds",
      "tahini",
      "peanut butter",
      "almond butter",
    ],
  },
  SPICES_SEASONINGS: {
    name: "Spices & Seasonings",
    icon: "sparkles-outline",
    color: "#F97316",
    keywords: [
      "cumin",
      "paprika",
      "chili powder",
      "cayenne",
      "turmeric",
      "curry powder",
      "garam masala",
      "cinnamon",
      "nutmeg",
      "allspice",
      "cloves",
      "cardamom",
      "bay leaves",
      "oregano",
      "basil",
      "thyme",
      "rosemary",
      "sage",
      "tarragon",
      "marjoram",
      "dill",
      "fennel seeds",
      "coriander",
      "mustard seeds",
      "celery seeds",
      "caraway seeds",
      "anise",
      "star anise",
      "vanilla extract",
      "almond extract",
      "lemon extract",
      "garlic powder",
      "onion powder",
      "smoked paprika",
      "chipotle",
      "adobo",
      "italian seasoning",
      "herbs de provence",
      "old bay",
      "cajun seasoning",
      "taco seasoning",
      "ranch seasoning",
      "everything bagel seasoning",
      "sesame oil",
      "fish sauce",
      "oyster sauce",
      "hoisin sauce",
      "sriracha",
      "sambal oelek",
      "miso paste",
      "tomato paste",
      "anchovy paste",
      "capers",
      "olives",
      "pickles",
      "relish",
    ],
  },
  GRAINS_BREAD: {
    name: "Grains & Bread",
    icon: "grid-outline",
    color: "#D97706",
    keywords: [
      "bread",
      "white bread",
      "wheat bread",
      "sourdough",
      "rye bread",
      "pumpernickel",
      "bagels",
      "english muffins",
      "pita bread",
      "naan",
      "tortillas",
      "wraps",
      "crackers",
      "breadsticks",
      "rolls",
      "buns",
      "hamburger buns",
      "hot dog buns",
      "croissants",
      "muffins",
      "cereal",
      "granola",
      "oatmeal",
      "grits",
      "polenta",
      "cornmeal",
      "wheat germ",
      "bran",
      "graham crackers",
      "saltines",
      "pretzels",
    ],
  },
  CANNED_JARRED: {
    name: "Canned & Jarred",
    icon: "cube-outline",
    color: "#6366F1",
    keywords: [
      "canned tomatoes",
      "tomato sauce",
      "tomato paste",
      "diced tomatoes",
      "crushed tomatoes",
      "tomato puree",
      "marinara sauce",
      "pasta sauce",
      "pizza sauce",
      "salsa",
      "canned beans",
      "canned corn",
      "canned peas",
      "canned carrots",
      "canned beets",
      "canned artichokes",
      "canned olives",
      "canned mushrooms",
      "canned peppers",
      "roasted red peppers",
      "pickled jalapeños",
      "coconut milk",
      "evaporated milk",
      "condensed milk",
      "chicken broth",
      "beef broth",
      "vegetable broth",
      "bone broth",
      "stock",
      "bouillon",
      "canned tuna",
      "canned salmon",
      "canned sardines",
      "canned crab",
      "canned chicken",
      "spam",
      "corned beef",
      "jam",
      "jelly",
      "preserves",
      "marmalade",
      "applesauce",
      "cranberry sauce",
      "pickles",
      "relish",
      "sauerkraut",
      "kimchi",
      "salad dressing",
      "barbecue sauce",
      "teriyaki sauce",
    ],
  },
  FROZEN: {
    name: "Frozen",
    icon: "snow-outline",
    color: "#06B6D4",
    keywords: [
      "frozen vegetables",
      "frozen peas",
      "frozen corn",
      "frozen broccoli",
      "frozen spinach",
      "frozen carrots",
      "frozen green beans",
      "frozen lima beans",
      "frozen edamame",
      "frozen fruit",
      "frozen berries",
      "frozen strawberries",
      "frozen blueberries",
      "frozen raspberries",
      "frozen mango",
      "frozen pineapple",
      "frozen fish",
      "frozen shrimp",
      "frozen chicken",
      "frozen beef",
      "frozen pork",
      "frozen pizza",
      "frozen meals",
      "frozen entrees",
      "ice cream",
      "frozen yogurt",
      "sorbet",
      "popsicles",
      "frozen bread",
      "frozen pastry",
      "frozen pie",
      "frozen waffles",
      "frozen pancakes",
      "frozen hash browns",
      "frozen fries",
      "frozen onion rings",
      "frozen mozzarella sticks",
      "frozen dumplings",
      "frozen burritos",
      "frozen pot pies",
    ],
  },
  BEVERAGES: {
    name: "Beverages",
    icon: "wine-outline",
    color: "#EC4899",
    keywords: [
      "water",
      "sparkling water",
      "soda",
      "juice",
      "orange juice",
      "apple juice",
      "cranberry juice",
      "grape juice",
      "tomato juice",
      "coffee",
      "tea",
      "green tea",
      "black tea",
      "herbal tea",
      "chai",
      "beer",
      "wine",
      "red wine",
      "white wine",
      "champagne",
      "vodka",
      "rum",
      "whiskey",
      "gin",
      "tequila",
      "brandy",
      "liqueur",
      "energy drink",
      "sports drink",
      "coconut water",
      "almond milk",
      "soy milk",
      "oat milk",
      "rice milk",
      "hemp milk",
      "kombucha",
      "kefir",
    ],
  },
  SNACKS_SWEETS: {
    name: "Snacks & Sweets",
    icon: "heart-outline",
    color: "#F472B6",
    keywords: [
      "chips",
      "potato chips",
      "tortilla chips",
      "corn chips",
      "pretzels",
      "popcorn",
      "nuts",
      "trail mix",
      "granola bars",
      "protein bars",
      "crackers",
      "cookies",
      "chocolate",
      "candy",
      "gum",
      "mints",
      "dried fruit",
      "raisins",
      "dates",
      "figs",
      "apricots",
      "banana chips",
      "apple chips",
      "jerky",
      "beef jerky",
      "turkey jerky",
      "fruit snacks",
      "fruit leather",
      "rice cakes",
      "veggie chips",
      "cheese crackers",
      "goldfish",
      "animal crackers",
    ],
  },
  HOUSEHOLD: {
    name: "Household",
    icon: "home-outline",
    color: "#6B7280",
    keywords: [
      "paper towels",
      "toilet paper",
      "tissues",
      "napkins",
      "aluminum foil",
      "plastic wrap",
      "parchment paper",
      "wax paper",
      "ziplock bags",
      "trash bags",
      "dish soap",
      "laundry detergent",
      "fabric softener",
      "bleach",
      "cleaning spray",
      "disinfectant",
      "sponges",
      "paper plates",
      "plastic cups",
      "plastic utensils",
      "candles",
      "matches",
      "lighter",
      "batteries",
      "light bulbs",
    ],
  },
};

// Recipe color palette for visual distinction
export const RECIPE_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FECA57", // Yellow
  "#FF9FF3", // Pink
  "#A78BFA", // Purple
  "#F97316", // Orange
  "#06B6D4", // Cyan
  "#EC4899", // Magenta
  "#8B5CF6", // Violet
  "#10B981", // Emerald
];

/**
 * Categorize an ingredient based on supermarket layout
 */
export function categorizeIngredient(ingredientName: string): {
  category: string;
  icon: string;
  color: string;
} {
  const name = ingredientName.toLowerCase().trim();

  // Check each category for keyword matches
  for (const [key, category] of Object.entries(SUPERMARKET_CATEGORIES)) {
    if (
      category.keywords.some(
        (keyword) => name.includes(keyword) || keyword.includes(name)
      )
    ) {
      return {
        category: category.name,
        icon: category.icon,
        color: category.color,
      };
    }
  }

  // Default to pantry staples if no match found (removed "Other" category)
  return {
    category: SUPERMARKET_CATEGORIES.PANTRY_STAPLES.name,
    icon: SUPERMARKET_CATEGORIES.PANTRY_STAPLES.icon,
    color: SUPERMARKET_CATEGORIES.PANTRY_STAPLES.color,
  };
}

/**
 * Assign a consistent color to a recipe based on its ID
 */
export function getRecipeColor(recipeId: string): string {
  // Use a simple hash function to get consistent color for same recipe
  let hash = 0;
  for (let i = 0; i < recipeId.length; i++) {
    const char = recipeId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const index = Math.abs(hash) % RECIPE_COLORS.length;
  return RECIPE_COLORS[index];
}

/**
 * Get a lighter version of a color for subtle backgrounds
 */
export function getLightColor(color: string, opacity: number = 0.1): string {
  // Remove # if present
  const hex = color.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Return rgba with opacity
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Group shopping list items by supermarket category
 */
export function groupItemsByCategory(items: any[]): {
  [category: string]: any[];
} {
  const grouped: { [category: string]: any[] } = {};

  items.forEach((item) => {
    const { category } = categorizeIngredient(item.name);

    if (!grouped[category]) {
      grouped[category] = [];
    }

    grouped[category].push(item);
  });

  // Sort categories by typical shopping order
  const categoryOrder = [
    "Produce",
    "Meat & Seafood",
    "Dairy & Eggs",
    "Grains & Bread",
    "Pantry Staples",
    "Canned & Jarred",
    "Spices & Seasonings",
    "Frozen",
    "Beverages",
    "Snacks & Sweets",
    "Household",
  ];

  const sortedGrouped: { [category: string]: any[] } = {};

  categoryOrder.forEach((category) => {
    if (grouped[category]) {
      sortedGrouped[category] = grouped[category];
    }
  });

  // Add any remaining categories not in the order
  Object.keys(grouped).forEach((category) => {
    if (!sortedGrouped[category]) {
      sortedGrouped[category] = grouped[category];
    }
  });

  return sortedGrouped;
}

/**
 * Get category info for display
 */
export function getCategoryInfo(categoryName: string): {
  name: string;
  icon: string;
  color: string;
} {
  const category = Object.values(SUPERMARKET_CATEGORIES).find(
    (cat) => cat.name === categoryName
  );

  return category || SUPERMARKET_CATEGORIES.PANTRY_STAPLES;
}
