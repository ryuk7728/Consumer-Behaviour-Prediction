export const PRODUCT_CATALOG = [
  {
    id: "P-100",
    name: "Trailblazer Duffel",
    category: "Travel Gear",
    price: 99
  },
  {
    id: "P-200",
    name: "Ridge Utility Jacket",
    category: "Apparel",
    price: 149
  },
  {
    id: "P-300",
    name: "Summit Bottle 1L",
    category: "Outdoor",
    price: 29
  },
  {
    id: "P-400",
    name: "Waypoint Daypack",
    category: "Bags",
    price: 119
  }
];

export const PRODUCT_MAP = new Map(PRODUCT_CATALOG.map((p) => [p.id, p]));

