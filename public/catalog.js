export const PRODUCTS = [
  {
    id: "P-100",
    name: "Trailblazer Duffel",
    category: "Travel Gear",
    price: 99,
    description:
      "Rugged weekender duffel with weather-resistant shell, structured base, and 38L carry capacity.",
    image:
      "https://m.media-amazon.com/images/I/71Ow+BMVkZL._AC_UF894,1000_QL80_.jpg"
  },
  {
    id: "P-200",
    name: "Ridge Utility Jacket",
    category: "Apparel",
    price: 149,
    description:
      "Layer-ready utility jacket built for shifting weather with reinforced cuffs and storage pockets.",
    image:
      "https://www.columbiasportswear.co.in/cdn/shop/files/AE5185-023_1.jpg?v=1743238505"
  },
  {
    id: "P-300",
    name: "Summit Bottle 1L",
    category: "Outdoor",
    price: 29,
    description:
      "Double-wall insulated hydration bottle that keeps drinks cold through long outdoor sessions.",
    image: "https://m.media-amazon.com/images/I/71NJuzuXeQL.jpg"
  },
  {
    id: "P-400",
    name: "Waypoint Daypack",
    category: "Bags",
    price: 119,
    description:
      "Compact daypack with padded straps, side bottle pockets, and organizer panel for daily carry.",
    image:
      "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?auto=format&fit=crop&w=1000&q=60"
  }
];

export const PRODUCTS_BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]));

