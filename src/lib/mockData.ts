import type { Cafe, Profile, Post, Comment, WeekHours } from './types';

/** Unsplash helper (domain is allow-listed in next.config). */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const std: WeekHours = {
  mon: { open: '07:00', close: '18:00' },
  tue: { open: '07:00', close: '18:00' },
  wed: { open: '07:00', close: '18:00' },
  thu: { open: '07:00', close: '18:00' },
  fri: { open: '07:00', close: '19:00' },
  sat: { open: '08:00', close: '19:00' },
  sun: { open: '08:00', close: '17:00' },
};
const lateHours: WeekHours = {
  mon: { open: '07:00', close: '22:00' },
  tue: { open: '07:00', close: '22:00' },
  wed: { open: '07:00', close: '22:00' },
  thu: { open: '07:00', close: '23:00' },
  fri: { open: '07:00', close: '00:00' },
  sat: { open: '08:00', close: '00:00' },
  sun: { open: '08:00', close: '21:00' },
};

type TagGroups = { category: string; tags: string[] }[];
const flat = (g: TagGroups) => g.flatMap((x) => x.tags);

const cafe = (
  c: Partial<Cafe> & { id: string; name: string; tagsByCategory: TagGroups },
): Cafe => ({
  address: '', city: 'Austin', state: 'TX', country: 'USA',
  lat: 30.2672, lng: -97.7431, description: '', coverPhotoUrl: '',
  gallery: [], verifiedByJoe: false, status: 'approved',
  createdAt: new Date().toISOString(), tags: flat(c.tagsByCategory),
  priceTier: 2, rating: 4.6, reviewCount: 0, hours: 'Mon–Sun 7:00–18:00',
  hoursStructured: std,
  ...c,
});

export const MOCK_CAFES: Cafe[] = [
  cafe({
    id: 'morning-house',
    name: 'Morning House Coffee',
    neighborhood: 'South Congress',
    address: '1420 S Congress Ave, Austin, TX 78704',
    lat: 30.2489, lng: -97.7501,
    description:
      'A sunlit corner room on South Congress where the light does half the work. Slow mornings, single-origin pour-overs, and a pastry case that empties by ten.',
    website: 'https://morninghouse.coffee',
    instagram: '@morninghousecoffee',
    phone: '(512) 555-0142',
    coverPhotoUrl: img('photo-1501339847302-ac426a4a7cbb'),
    gallery: [img('photo-1521017432531-fbd92d768814'), img('photo-1554118811-1e0d58224f24'), img('photo-1442512595331-e89e73853f31')],
    verifiedByJoe: true,
    signatureDrink: 'Honey Oat Cortado',
    rating: 4.8, reviewCount: 214, priceTier: 2,
    tagsByCategory: [
      { category: 'Atmosphere & Design', tags: ['Bright & Airy', 'Plant-Filled', 'Cozy'] },
      { category: 'Amenities', tags: ['Wi-Fi', 'Outlets', 'Outdoor Seating'] },
      { category: 'Food & Beverage Focus', tags: ['Single Origin', 'House-Made Syrups', 'Breakfast Menu'] },
      { category: 'Soundscape', tags: ['Conversational', 'Background Music'] },
      { category: 'Dietary & Allergy Friendly', tags: ['Vegan Friendly', 'Gluten-Free Options'] },
      { category: 'Type of Establishment', tags: ['Brick & Mortar Café'] },
    ],
  }),
  cafe({
    id: 'eastside-roasters',
    name: 'Eastside Roasters',
    neighborhood: 'East Austin',
    address: '2210 E 6th St, Austin, TX 78702',
    lat: 30.2617, lng: -97.7215,
    description:
      'A working roastery with a cupping table open to anyone curious. The espresso rotates weekly and the baristas will happily talk you through the roast.',
    website: 'https://eastsideroasters.co',
    instagram: '@eastsideroasters',
    phone: '(512) 555-0177',
    coverPhotoUrl: img('photo-1442550528053-c431ecb55509'),
    gallery: [img('photo-1447933601403-0c6688de566e'), img('photo-1495474472287-4d71bcdd2085'), img('photo-1459755486867-b55449bb39ff')],
    verifiedByJoe: true,
    signatureDrink: 'Rotating Single-Origin Espresso',
    rating: 4.7, reviewCount: 189, priceTier: 2,
    tagsByCategory: [
      { category: 'Atmosphere & Design', tags: ['Industrial', 'Minimalist'] },
      { category: 'Amenities', tags: ['Wi-Fi', 'Parking', 'Wheelchair Accessible'] },
      { category: 'Food & Beverage Focus', tags: ['Third Wave Coffee', 'Single Origin', 'Multi-Roaster Program'] },
      { category: 'Soundscape', tags: ['Lively', 'Vinyl Listening'] },
      { category: 'Community', tags: ['Workshops', 'Events'] },
      { category: 'Type of Establishment', tags: ['Roastery', 'Brick & Mortar Café'] },
    ],
  }),
  cafe({
    id: 'paper-cup',
    name: 'Paper Cup Café',
    neighborhood: 'Hyde Park',
    address: '4302 Ave G, Austin, TX 78751',
    lat: 30.3049, lng: -97.7281,
    description:
      'A tiny neighborhood favorite tucked into a Hyde Park bungalow. Mismatched chairs, zines by the register, and a flat white worth the wait.',
    instagram: '@papercupatx',
    phone: '(512) 555-0198',
    coverPhotoUrl: img('photo-1453614512568-c4024d13c247'),
    gallery: [img('photo-1509042239860-f550ce710b93'), img('photo-1600093463592-8e36ae95ef56')],
    verifiedByJoe: false,
    signatureDrink: 'Cardamom Flat White',
    rating: 4.6, reviewCount: 96, priceTier: 1,
    tagsByCategory: [
      { category: 'Atmosphere & Design', tags: ['Cozy', 'Vintage', 'Artsy'] },
      { category: 'Amenities', tags: ['Wi-Fi', 'Outlets', 'Pet Friendly'] },
      { category: 'Food & Beverage Focus', tags: ['House-Made Syrups', 'Breakfast Menu'] },
      { category: 'Soundscape', tags: ['Quiet'] },
      { category: 'Community', tags: ['Local Art', 'Book Clubs'] },
      { category: 'Dietary & Allergy Friendly', tags: ['Vegetarian Friendly', 'Dairy-Free Options'] },
      { category: 'Type of Establishment', tags: ['Brick & Mortar Café'] },
    ],
  }),
  cafe({
    id: 'green-room',
    name: 'Green Room Coffee',
    neighborhood: 'Clarksville',
    address: '1201 W Lynn St, Austin, TX 78703',
    lat: 30.2791, lng: -97.7593,
    description:
      'Ferns everywhere, filtered light, and a hush that makes it the unofficial study hall of Clarksville. Order the matcha; stay for the calm.',
    website: 'https://greenroom.coffee',
    instagram: '@greenroomatx',
    phone: '(512) 555-0110',
    coverPhotoUrl: img('photo-1521017432531-fbd92d768814'),
    gallery: [img('photo-1519864600265-abb23847ef2c'), img('photo-1470337458703-46ad1756a187')],
    verifiedByJoe: true,
    signatureDrink: 'Ceremonial Matcha Latte',
    rating: 4.7, reviewCount: 152, priceTier: 2,
    tagsByCategory: [
      { category: 'Atmosphere & Design', tags: ['Plant-Filled', 'Bright & Airy', 'Minimalist'] },
      { category: 'Amenities', tags: ['Wi-Fi', 'Outlets', 'Restrooms', 'Wheelchair Accessible'] },
      { category: 'Food & Beverage Focus', tags: ['Single Origin', 'House-Made Syrups'] },
      { category: 'Soundscape', tags: ['Quiet', 'Background Music'] },
      { category: 'Dietary & Allergy Friendly', tags: ['Vegan Friendly', 'Gluten-Free Options', 'Nut-Free Options'] },
      { category: 'Type of Establishment', tags: ['Brick & Mortar Café'] },
    ],
  }),
  cafe({
    id: 'ember-oak',
    name: 'Ember & Oak Coffee',
    neighborhood: 'Rainey Street',
    address: '86 Rainey St, Austin, TX 78701',
    lat: 30.2589, lng: -97.7385,
    description:
      'Coffee by day, coffee cocktails by night. Reclaimed oak, low amber light, and an espresso martini that has ruined other espresso martinis for us.',
    website: 'https://emberoak.bar',
    instagram: '@emberoakatx',
    phone: '(512) 555-0163',
    coverPhotoUrl: img('photo-1559925393-8be0ec4767c8'),
    gallery: [img('photo-1470337458703-46ad1756a187'), img('photo-1514066558159-fc8c737ef259')],
    verifiedByJoe: false,
    signatureDrink: 'Oak-Smoked Espresso Martini',
    rating: 4.5, reviewCount: 174, priceTier: 3,
    hours: 'Mon–Sun 7:00–00:00', hoursStructured: lateHours,
    tagsByCategory: [
      { category: 'Atmosphere & Design', tags: ['Rustic', 'Industrial', 'Elegant'] },
      { category: 'Amenities', tags: ['Wi-Fi', 'Outdoor Seating', 'Parking'] },
      { category: 'Food & Beverage Focus', tags: ['Coffee Cocktails', 'Alcohol Served', 'Dinner Menu'] },
      { category: 'Soundscape', tags: ['Lively', 'Live Music', 'DJ Sets'] },
      { category: 'Community', tags: ['Events', 'Open Mic'] },
      { category: 'Type of Establishment', tags: ['Café & Bar'] },
    ],
  }),
  cafe({
    id: 'south-congress-espresso',
    name: 'South Congress Espresso',
    neighborhood: 'South Congress',
    address: '1600 S Congress Ave, Austin, TX 78704',
    lat: 30.2470, lng: -97.7503,
    description:
      'A slim espresso bar built for the perfect shot and a quick hello. No laptops, no fuss — just some of the most dialed-in espresso in the city.',
    instagram: '@scespresso',
    phone: '(512) 555-0125',
    coverPhotoUrl: img('photo-1510707577719-ae7c14805e3a'),
    gallery: [img('photo-1461023058943-07fcbe16d735'), img('photo-1442512595331-e89e73853f31')],
    verifiedByJoe: true,
    signatureDrink: 'Piccolo Latte',
    rating: 4.9, reviewCount: 241, priceTier: 2,
    tagsByCategory: [
      { category: 'Atmosphere & Design', tags: ['Minimalist', 'Mid-Century Modern'] },
      { category: 'Amenities', tags: ['Outdoor Seating'] },
      { category: 'Food & Beverage Focus', tags: ['Third Wave Coffee', 'Single Origin'] },
      { category: 'Soundscape', tags: ['Conversational'] },
      { category: 'Dietary & Allergy Friendly', tags: ['Dairy-Free Options'] },
      { category: 'Type of Establishment', tags: ['Coffee Stand'] },
    ],
  }),
  cafe({
    id: 'juniper',
    name: 'Juniper Coffee Bar',
    neighborhood: 'Mueller',
    address: '1911 Aldrich St, Austin, TX 78723',
    lat: 30.2994, lng: -97.7052,
    description:
      'Airy and family-friendly on the Mueller lawn, with a big patio, house-made horchata cold brew, and enough outlets to survive a work sprint.',
    website: 'https://junipercoffee.bar',
    instagram: '@juniperatx',
    phone: '(512) 555-0189',
    coverPhotoUrl: img('photo-1600093463592-8e36ae95ef56'),
    gallery: [img('photo-1554118811-1e0d58224f24'), img('photo-1521017432531-fbd92d768814')],
    verifiedByJoe: false,
    signatureDrink: 'Horchata Cold Brew',
    rating: 4.6, reviewCount: 118, priceTier: 2,
    tagsByCategory: [
      { category: 'Atmosphere & Design', tags: ['Bright & Airy', 'Cozy'] },
      { category: 'Amenities', tags: ['Wi-Fi', 'Outlets', 'Outdoor Seating', 'Parking', 'EV Charging', 'Pet Friendly'] },
      { category: 'Food & Beverage Focus', tags: ['House-Made Syrups', 'Breakfast Menu', 'Lunch Menu'] },
      { category: 'Soundscape', tags: ['Conversational', 'Background Music'] },
      { category: 'Community', tags: ['Community Gatherings', 'Events'] },
      { category: 'Dietary & Allergy Friendly', tags: ['Vegan Friendly', 'Vegetarian Friendly', 'Celiac Friendly'] },
      { category: 'Type of Establishment', tags: ['Brick & Mortar Café'] },
    ],
  }),
];

// --------------------------------------------------------------------------
// Sample people
// --------------------------------------------------------------------------
const avatar = (id: string) => img(id, 240);

export const MOCK_USERS: Profile[] = [
  { id: 'u-guest', name: 'You', username: 'you', bio: 'Exploring Austin one cup at a time.', profilePhotoUrl: avatar('photo-1500648767791-00dcc994a43e'), location: 'Austin, TX', role: 'user', createdAt: '2026-01-02T00:00:00Z', followers: 12, following: 24, postCount: 2 },
  { id: 'u-mara', name: 'Mara Ellison', username: 'maradrinkscoffee', bio: 'Flat white purist. Will drive 40 min for a good croissant.', profilePhotoUrl: avatar('photo-1494790108377-be9c29b29330'), location: 'Austin, TX', role: 'user', createdAt: '2025-11-10T00:00:00Z', followers: 340, following: 180, postCount: 4 },
  { id: 'u-theo', name: 'Theo Nguyen', username: 'theopourover', bio: 'Home barista. Chasing the god shot.', profilePhotoUrl: avatar('photo-1507003211169-0a1dd7228f2d'), location: 'Austin, TX', role: 'user', createdAt: '2025-09-01T00:00:00Z', followers: 210, following: 95, postCount: 3 },
  { id: 'u-priya', name: 'Priya Shah', username: 'priyasips', bio: 'Matcha > everything. Plant café hunter.', profilePhotoUrl: avatar('photo-1438761681033-6461ffad8d80'), location: 'Austin, TX', role: 'user', createdAt: '2025-12-20T00:00:00Z', followers: 500, following: 300, postCount: 3 },
  { id: 'u-cal', name: 'Cal Rivera', username: 'calcaffeine', bio: 'Espresso, vinyl, and long patios.', profilePhotoUrl: avatar('photo-1633332755192-727a05c4013d'), location: 'Austin, TX', role: 'user', createdAt: '2025-10-05T00:00:00Z', followers: 145, following: 160, postCount: 2 },
  { id: 'u-joe', name: 'Joe (Admin)', username: 'joe', bio: 'Keeper of the map. Verified by Joe.', profilePhotoUrl: avatar('photo-1519085360753-af0119f7cbe7'), location: 'Austin, TX', role: 'admin', createdAt: '2025-01-01T00:00:00Z', followers: 1200, following: 3, postCount: 0 },
];

/** The signed-in user for demo mode. */
export const MOCK_ME: Profile = MOCK_USERS[0];

// --------------------------------------------------------------------------
// Sample posts (community feed)
// --------------------------------------------------------------------------
const ago = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const MOCK_POSTS: Post[] = [
  { id: 'p1', userId: 'u-mara', cafeId: 'morning-house', caption: 'Sunday light at Morning House hits different. This honey oat cortado is criminally good.', drinkTag: 'Cortado', visibility: 'public', createdAt: ago(3), photos: [img('photo-1521017432531-fbd92d768814'), img('photo-1554118811-1e0d58224f24')], likeCount: 48, commentCount: 3, cafeName: 'Morning House Coffee' },
  { id: 'p2', userId: 'u-theo', cafeId: 'eastside-roasters', caption: 'Cupping table at Eastside this morning. The Ethiopia natural is all blueberry.', drinkTag: 'Pour Over', visibility: 'public', createdAt: ago(6), photos: [img('photo-1447933601403-0c6688de566e')], likeCount: 31, commentCount: 2, cafeName: 'Eastside Roasters' },
  { id: 'p3', userId: 'u-priya', cafeId: 'green-room', caption: 'My office for the afternoon. The matcha here is the real deal.', drinkTag: 'Matcha', visibility: 'public', createdAt: ago(10), photos: [img('photo-1519864600265-abb23847ef2c')], likeCount: 72, commentCount: 5, cafeName: 'Green Room Coffee' },
  { id: 'p4', userId: 'u-cal', cafeId: 'ember-oak', caption: 'Vinyl night at Ember & Oak. Espresso martini count: classified.', drinkTag: 'Coffee Cocktail', visibility: 'public', createdAt: ago(22), photos: [img('photo-1514066558159-fc8c737ef259'), img('photo-1470337458703-46ad1756a187')], likeCount: 39, commentCount: 1, cafeName: 'Ember & Oak Coffee' },
  { id: 'p5', userId: 'u-mara', cafeId: 'south-congress-espresso', caption: 'Best piccolo in the city, no notes.', drinkTag: 'Latte', visibility: 'public', createdAt: ago(28), photos: [img('photo-1510707577719-ae7c14805e3a')], likeCount: 55, commentCount: 4, cafeName: 'South Congress Espresso' },
  { id: 'p6', userId: 'u-priya', cafeId: 'juniper', caption: 'Horchata cold brew on the Mueller patio. Summer, sorted.', drinkTag: 'Cold Brew', visibility: 'public', createdAt: ago(34), photos: [img('photo-1600093463592-8e36ae95ef56')], likeCount: 27, commentCount: 0, cafeName: 'Juniper Coffee Bar' },
  { id: 'p7', userId: 'u-theo', cafeId: 'paper-cup', caption: 'Cardamom flat white and a zine. Perfect quiet morning in Hyde Park.', drinkTag: 'Flat White', visibility: 'public', createdAt: ago(40), photos: [img('photo-1453614512568-c4024d13c247')], likeCount: 44, commentCount: 2, cafeName: 'Paper Cup Café' },
  { id: 'p8', userId: 'u-guest', cafeId: 'morning-house', caption: 'First stamp in my Coffee Passport!', drinkTag: 'Cappuccino', visibility: 'public', createdAt: ago(2), photos: [img('photo-1442512595331-e89e73853f31')], likeCount: 9, commentCount: 1, cafeName: 'Morning House Coffee' },
];

export const MOCK_COMMENTS: Comment[] = [
  { id: 'c1', postId: 'p1', userId: 'u-theo', content: 'Need to try this. Adding to my list now.', createdAt: ago(2) },
  { id: 'c2', postId: 'p1', userId: 'u-priya', content: 'That light!', createdAt: ago(2) },
  { id: 'c3', postId: 'p1', userId: 'u-cal', content: 'Cortado supremacy.', createdAt: ago(1) },
  { id: 'c4', postId: 'p3', userId: 'u-mara', content: 'Green Room is my happy place.', createdAt: ago(9) },
  { id: 'c5', postId: 'p8', userId: 'u-mara', content: 'Welcome to the passport life.', createdAt: ago(1) },
];

/** follower -> following edges (the guest follows several people). */
export const MOCK_FOLLOWS: { followerId: string; followingId: string }[] = [
  { followerId: 'u-guest', followingId: 'u-mara' },
  { followerId: 'u-guest', followingId: 'u-priya' },
  { followerId: 'u-guest', followingId: 'u-theo' },
  { followerId: 'u-mara', followingId: 'u-guest' },
  { followerId: 'u-priya', followingId: 'u-mara' },
];

export function userById(id: string): Profile {
  return MOCK_USERS.find((u) => u.id === id) ?? MOCK_ME;
}
export function cafeById(id: string): Cafe | undefined {
  return MOCK_CAFES.find((c) => c.id === id);
}
