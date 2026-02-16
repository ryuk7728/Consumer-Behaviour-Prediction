const products = [
  {
    id: "P-100",
    name: "Trailblazer Duffel",
    category: "Travel Gear",
    price: 99,
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=60"
  },
  {
    id: "P-200",
    name: "Ridge Utility Jacket",
    category: "Apparel",
    price: 149,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=60"
  },
  {
    id: "P-300",
    name: "Summit Bottle 1L",
    category: "Outdoor",
    price: 29,
    image:
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1000&q=60"
  },
  {
    id: "P-400",
    name: "Waypoint Daypack",
    category: "Bags",
    price: 119,
    image:
      "https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?auto=format&fit=crop&w=1000&q=60"
  }
];

const sessionId = getOrCreate("demo_session_id");
const userId = getOrCreate("demo_user_id", "U");
const cart = [];

const productsNode = document.querySelector("#products");
const cartNode = document.querySelector("#cartItems");
const sessionPill = document.querySelector("#sessionPill");
const predictBtn = document.querySelector("#predictBtn");
const purchaseBtn = document.querySelector("#purchaseBtn");
const toast = document.querySelector("#toast");
const predictionCard = document.querySelector("#predictionCard");

sessionPill.textContent = `Session: ${sessionId}`;

renderProducts();
renderCart();

predictBtn.addEventListener("click", async () => {
  try {
    const response = await fetch(`/api/predict?session_id=${encodeURIComponent(sessionId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Prediction failed");

    predictionCard.classList.remove("hidden");
    predictionCard.innerHTML = `
      <strong>Purchase Likelihood: ${(data.purchase_likelihood * 100).toFixed(1)}%</strong>
      <p class="muted">Label: ${data.label}</p>
      <p class="muted">Features: views ${data.features.product_views}, cart adds ${data.features.cart_adds}, session secs ${data.features.session_seconds}</p>
    `;
    showToast("Prediction generated");
  } catch (error) {
    showToast(error.message);
  }
});

purchaseBtn.addEventListener("click", async () => {
  const item = cart.at(-1);
  if (!item) {
    showToast("Add an item to cart first");
    return;
  }

  await sendEvent({
    event_type: "purchase",
    product_id: item.id,
    price: item.price
  });
  showToast("Purchase event sent");
});

function renderProducts() {
  productsNode.innerHTML = "";
  for (const product of products) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <div class="card-content">
        <h3>${product.name}</h3>
        <p class="muted">${product.category}</p>
        <p class="price">$${product.price}</p>
        <button class="btn btn-secondary" data-action="view" data-id="${product.id}">View Product</button>
        <button class="btn btn-primary" data-action="cart" data-id="${product.id}">Add To Cart</button>
      </div>
    `;
    productsNode.appendChild(card);
  }

  productsNode.addEventListener("click", async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    const productId = target.dataset.id;
    if (!action || !productId) return;

    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (action === "view") {
      await sendEvent({
        event_type: "product_view",
        product_id: product.id,
        price: product.price
      });
      showToast(`${product.name} viewed`);
    }

    if (action === "cart") {
      cart.push(product);
      renderCart();
      await sendEvent({
        event_type: "add_to_cart",
        product_id: product.id,
        price: product.price
      });
      showToast(`${product.name} added to cart`);
    }
  });
}

function renderCart() {
  cartNode.innerHTML = "";
  if (!cart.length) {
    cartNode.innerHTML = `<li><span>No items yet</span><span>$0</span></li>`;
    return;
  }

  for (const item of cart) {
    const row = document.createElement("li");
    row.innerHTML = `<span>${item.name}</span><span>$${item.price}</span>`;
    cartNode.appendChild(row);
  }
}

async function sendEvent({ event_type, product_id, price }) {
  const payload = {
    event_id: crypto.randomUUID(),
    session_id: sessionId,
    user_id: userId,
    event_type,
    product_id,
    price,
    timestamp: new Date().toISOString(),
    source: "storefront"
  };

  const response = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to send event");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 1800);
}

function getOrCreate(key, prefix = "S") {
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const generated = `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  localStorage.setItem(key, generated);
  return generated;
}

