import { PRODUCTS } from "./catalog.js";
import { getSessionId, showToast } from "./shop-utils.js";

const productsNode = document.querySelector("#products");
const sessionPill = document.querySelector("#sessionPill");
const toast = document.querySelector("#toast");

sessionPill.textContent = `Session: ${getSessionId()}`;
renderProducts();

function renderProducts() {
  productsNode.innerHTML = "";

  for (const product of PRODUCTS) {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <div class="card-content">
        <h3>${product.name}</h3>
        <p class="muted">${product.category}</p>
        <p class="price">$${product.price}</p>
        <p class="muted clamp-2">${product.description}</p>
        <a class="btn btn-secondary product-link" href="/product.html?id=${encodeURIComponent(product.id)}">View Product</a>
      </div>
    `;
    productsNode.appendChild(card);
  }

  showToast(toast, "Browse products and open a product page to continue");
}

