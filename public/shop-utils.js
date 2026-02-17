const CART_KEY = "demo_cart";
const SESSION_KEY = "demo_session_id";
const USER_KEY = "demo_user_id";

export function getSessionId() {
  return getOrCreate(SESSION_KEY, "S");
}

export function getUserId() {
  return getOrCreate(USER_KEY, "U");
}

export function getCart() {
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function addToCart(product) {
  const cart = getCart();
  cart.push({
    id: product.id,
    name: product.name,
    price: product.price
  });
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}

export function cartTotal() {
  return getCart().reduce((sum, item) => sum + Number(item.price || 0), 0);
}

export async function logEvent({ eventType, productId = null, price = 0, source }) {
  const payload = {
    event_id: crypto.randomUUID(),
    session_id: getSessionId(),
    user_id: getUserId(),
    event_type: eventType,
    product_id: productId,
    price,
    timestamp: new Date().toISOString(),
    source
  };

  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error || "Event logging failed");
  }
}

export function showToast(node, message) {
  node.textContent = message;
  node.classList.remove("hidden");
  setTimeout(() => node.classList.add("hidden"), 1700);
}

function getOrCreate(key, prefix) {
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const generated = `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  localStorage.setItem(key, generated);
  return generated;
}

