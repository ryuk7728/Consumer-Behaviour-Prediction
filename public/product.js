import { PRODUCTS_BY_ID } from "./catalog.js";
import { addToCart, logEvent, showToast } from "./shop-utils.js";

const productLayout = document.querySelector("#productLayout");
const toast = document.querySelector("#toast");

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const product = PRODUCTS_BY_ID.get(productId);

if (!product) {
  productLayout.innerHTML = `<section class="panel"><h1>Product not found</h1><p class="muted">Return to the storefront and try again.</p><a class="btn btn-secondary product-link" href="/">Go Home</a></section>`;
} else {
  renderProduct(product);
  logEvent({
    eventType: "product_view",
    productId: product.id,
    price: product.price,
    source: "product_page"
  }).catch(() => {});
}

function renderProduct(item) {
  productLayout.innerHTML = `
    <section class="product-media">
      <img src="${item.image}" alt="${item.name}" />
    </section>
    <section class="product-details panel">
      <p class="eyebrow">${item.category}</p>
      <h1>${item.name}</h1>
      <p class="product-price">$${item.price}</p>
      <p class="muted">${item.description}</p>
      <ul class="feature-list">
        <li>Durable everyday build</li>
        <li>Designed for travel and outdoor carry</li>
        <li>Limited stock prototype listing</li>
      </ul>
      <button id="addToCartBtn" class="btn btn-primary">Add To Cart</button>
      <a class="btn btn-secondary product-link" href="/cart.html">Go To Cart</a>
    </section>
  `;

  document.querySelector("#addToCartBtn").addEventListener("click", async () => {
    addToCart(item);
    try {
      await logEvent({
        eventType: "add_to_cart",
        productId: item.id,
        price: item.price,
        source: "product_page"
      });
      showToast(toast, `${item.name} added to cart`);
    } catch (error) {
      showToast(toast, error.message);
    }
  });
}

