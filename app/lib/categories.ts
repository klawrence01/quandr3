// C:\Users\Owner\quandr3\app\lib\categories.ts

export type Category = {
  id: string;          // machine id, e.g. "money"
  name: string;        // display name
  label: string;       // alias for display name
  description: string; // short explanation
  emoji: string;       // emoji icon
};

// QUANDR3 Categories V1 (locked list)
export const CATEGORIES_V1: Category[] = [
  {
    id: "money",
    name: "Money",
    label: "Money",
    description: "Earning, saving, debt, investing, and financial decisions.",
    emoji: "💰",
  },
  {
    id: "style",
    name: "Style",
    label: "Style",
    description: "Clothes, shoes, fits, and overall look.",
    emoji: "👗",
  },
  {
    id: "relationships",
    name: "Relationships",
    label: "Relationships",
    description: "Dating, friendships, and everything in between.",
    emoji: "💞",
  },
  {
    id: "cars",
    name: "Cars",
    label: "Cars",
    description: "Buying, selling, modding, and choosing cars.",
    emoji: "🚗",
  },
  {
    id: "career",
    name: "Career",
    label: "Career",
    description: "Jobs, promotions, switching fields, and big moves.",
    emoji: "💼",
  },
  {
    id: "health-fitness",
    name: "Health & Fitness",
    label: "Health & Fitness",
    description: "Workouts, diets, routines, and staying healthy.",
    emoji: "🏋️",
  },
  {
    id: "family-parenting",
    name: "Family & Parenting",
    label: "Family & Parenting",
    description: "Kids, parents, and family decisions.",
    emoji: "👨‍👩‍👧",
  },
  {
    id: "food",
    name: "Food",
    label: "Food",
    description: "What to eat, where to eat, and how to cook.",
    emoji: "🍽️",
  },
  {
    id: "home-diy",
    name: "Home & DIY",
    label: "Home & DIY",
    description: "Home setup, decor, and fix-it decisions.",
    emoji: "🏠",
  },
  {
    id: "tech-gadgets",
    name: "Tech & Gadgets",
    label: "Tech & Gadgets",
    description: "Phones, laptops, consoles, and new tech.",
    emoji: "📱",
  },
  {
    id: "travel",
    name: "Travel",
    label: "Travel",
    description: "Trips, destinations, and how to get away.",
    emoji: "✈️",
  },
  {
    id: "school-college",
    name: "School & College",
    label: "School & College",
    description: "Classes, majors, schools, and study moves.",
    emoji: "🎓",
  },
  {
    id: "movies",
    name: "Movies",
    label: "Movies",
    description: "What to watch and what’s worth it.",
    emoji: "🎬",
  },
  {
    id: "television",
    name: "Television",
    label: "Television",
    description: "Shows, series, and binge decisions.",
    emoji: "📺",
  },
  {
    id: "music",
    name: "Music",
    label: "Music",
    description: "Artists, albums, playlists, and vibes.",
    emoji: "🎵",
  },
  {
    id: "sports",
    name: "Sports",
    label: "Sports",
    description: "Teams, players, leagues, and picks.",
    emoji: "🏀",
  },
  {
    id: "nature-animals",
    name: "Nature & Animals",
    label: "Nature & Animals",
    description: "Pets, wildlife, and outdoor life.",
    emoji: "🐾",
  },
  {
    id: "events-activities",
    name: "Events & Activities",
    label: "Events & Activities",
    description: "What to do, where to go, and how to spend time.",
    emoji: "🎉",
  },
  {
    id: "gifts",
    name: "Gifts",
    label: "Gifts",
    description: "What to buy for who, and whether it lands.",
    emoji: "🎁",
  },
  {
    id: "beauty-wellness",
    name: "Beauty & Wellness",
    label: "Beauty & Wellness",
    description: "Skin, hair, grooming, and self-care.",
    emoji: "💄",
  },
  {
    id: "business",
    name: "Business",
    label: "Business",
    description: "Entrepreneurship, deals, partnerships, and strategy.",
    emoji: "📊",
  },
];

// Quick lookup: id -> emoji
export const CATEGORY_EMOJI: Record<string, string> = Object.fromEntries(
  CATEGORIES_V1.map((c) => [c.id, c.emoji])
);
