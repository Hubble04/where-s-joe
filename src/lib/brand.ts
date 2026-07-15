/**
 * Where's Joe? — brand constants.
 * Logo assets live in /public/logos. Roles per the brand upload:
 *  - primary:   cup + question-mark mark (the "Where's Joe?" identity)
 *  - icon:      green square app icon
 *  - journey:   postcard / passport-stamp emblem
 *  - variants:  color-accented square marks (navy/brown/gold/amber)
 */
export const LOGOS = {
  primaryCupQM: '/logos/WIJ_Cup_QM.svg',
  cupHorizontal: '/logos/WIJ_Cup.svg',
  tile16: '/logos/WIJ_Cups-16.svg',
  tile17: '/logos/WIJ_Cups-17.svg',
  iconGreen: '/logos/WIJ_Cups_square_background-19.svg',
  iconBrownNavy: '/logos/WIJ_Cups_square_background-17.svg',
  iconNavyA: '/logos/WIJ_Cups_square_background-18.svg',
  iconNavyB: '/logos/WIJ_Cups_square_background-20.svg',
  iconBrown: '/logos/WIJ_Cups_square_background-21.svg',
  iconGold: '/logos/WIJ_Cups_square_background-22.svg',
  iconAmber: '/logos/WIJ_Cups_square_background-23.svg',
  journeyStampOutlined: '/logos/WIJ_Poscard_logo-16.svg',
  journeyStampText: '/logos/WIJ_Poscard_logo-17.svg',
} as const;

export const BRAND_COLORS = {
  racing: '#19452B',
  ivory: '#FDFAED',
  coffee: '#502A19',
  gold: '#5C4E19',
  navy: '#1B3A73',
  amber: '#B96912',
} as const;

/** The seven café-tag categories and their controlled vocabularies. */
export const TAG_TAXONOMY: { category: string; tags: string[] }[] = [
  {
    category: 'Atmosphere & Design',
    tags: [
      'Cozy', 'Minimalist', 'Industrial', 'Rustic', 'Vintage',
      'Mid-Century Modern', 'Plant-Filled', 'Artsy', 'Elegant', 'Bright & Airy',
    ],
  },
  {
    category: 'Amenities',
    tags: [
      'Wi-Fi', 'Outlets', 'Outdoor Seating', 'Restrooms', 'Pet Friendly',
      'Wheelchair Accessible', 'Parking', 'EV Charging',
    ],
  },
  {
    category: 'Food & Beverage Focus',
    tags: [
      'Third Wave Coffee', 'Multi-Roaster Program', 'Single Origin',
      'House-Made Syrups', 'Breakfast Menu', 'Lunch Menu', 'Dinner Menu',
      'Alcohol Served', 'Coffee Cocktails',
    ],
  },
  {
    category: 'Soundscape',
    tags: [
      'Quiet', 'Conversational', 'Lively', 'Background Music',
      'Live Music', 'DJ Sets', 'Vinyl Listening',
    ],
  },
  {
    category: 'Community',
    tags: [
      'Local Art', 'Events', 'Book Clubs', 'Open Mic', 'Workshops',
      'Community Gatherings',
    ],
  },
  {
    category: 'Dietary & Allergy Friendly',
    tags: [
      'Celiac Friendly', 'Gluten-Free Options', 'Dairy-Free Options',
      'Nut-Free Options', 'Vegan Friendly', 'Vegetarian Friendly',
    ],
  },
  {
    category: 'Type of Establishment',
    tags: [
      'Brick & Mortar Café', 'Coffee Truck', 'Coffee Stand', 'Coffee Cart',
      'Café & Bar', 'Roastery', 'Pop-Up',
    ],
  },
];

/** Flat lookup of tag -> category, for validating & grouping. */
export const TAG_CATEGORY: Record<string, string> = Object.fromEntries(
  TAG_TAXONOMY.flatMap(({ category, tags }) => tags.map((t) => [t, category])),
);

/** Quick filters shown on Explore (behavior/attribute-based). */
export const QUICK_FILTERS = [
  'Open Now',
  'Verified by Joe',
  'Wi-Fi',
  'Outdoor Seating',
  'Parking',
  'Nearby',
] as const;

export const DRINK_TYPES = [
  'Espresso', 'Cappuccino', 'Latte', 'Flat White', 'Cortado', 'Macchiato',
  'Americano', 'Pour Over', 'Cold Brew', 'Iced Latte', 'Mocha', 'Matcha',
  'Chai', 'Tea', 'Hot Chocolate', 'Coffee Cocktail',
] as const;

export const MILK_TYPES = [
  'Whole', 'Skim', '2%', 'Oat', 'Almond', 'Soy', 'Coconut', 'Macadamia', 'None',
] as const;

export const FEED_MODES = ['Nearby', 'Trending', 'Following', 'Global'] as const;
export type FeedMode = (typeof FEED_MODES)[number];

export const VISIBILITY = ['Public', 'Followers only', 'Private'] as const;
export type Visibility = (typeof VISIBILITY)[number];
