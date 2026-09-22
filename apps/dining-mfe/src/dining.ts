export interface MenuItem {
  name: string;
  price: string;
}

export interface Review {
  id: string;
  author: string;
  comment: string;
}

export interface Restaurant {
  name: string;
  slug: string;
  hours: string;
  menu: MenuItem[];
  reviews: Review[];
}

// In-memory demo data. A real implementation would fetch this from an API;
// nothing about the sub-routing below depends on where it comes from.
export const restaurants: Restaurant[] = [
  {
    name: "Ocean Restaurant",
    slug: "ocean",
    hours: "18:00 - 22:00",
    menu: [
      { name: "Grilled Salmon", price: "$28" },
      { name: "Filet Mignon", price: "$34" },
    ],
    reviews: [
      { id: "r1", author: "J. Rivera", comment: "Best salmon on the ship." },
      { id: "r2", author: "M. Chen", comment: "Great service, a bit noisy." },
    ],
  },
  {
    name: "Seafood Grill",
    slug: "seafood-grill",
    hours: "19:00 - 23:00",
    menu: [
      { name: "Lobster Tail", price: "$42" },
      { name: "Shrimp Scampi", price: "$26" },
    ],
    reviews: [{ id: "r3", author: "A. Patel", comment: "Lobster was cooked perfectly." }],
  },
];

export function findRestaurantBySlug(slug: string): Restaurant | undefined {
  return restaurants.find((r) => r.slug === slug);
}
