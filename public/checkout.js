import { clearCart, cartTotal, getCart, logEvent } from "./shop-utils.js";

const form = document.querySelector("#checkoutForm");
const message = document.querySelector("#checkoutMessage");
const itemsNode = document.querySelector("#checkoutItems");
const totalNode = document.querySelector("#checkoutTotal");

const cart = getCart();

if (!cart.length) {
  itemsNode.innerHTML = `<li><span>No items to checkout.</span><a class="nav-link" href="/">Go shopping</a></li>`;
  form.classList.add("hidden");
} else {
  itemsNode.innerHTML = cart
    .map(
      (item) => `<li><span>${item.name}</span><span>$${Number(item.price).toFixed(2)}</span></li>`
    )
    .join("");
}

totalNode.textContent = `$${cartTotal().toFixed(2)}`;

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const uniqueProductIds = [...new Set(cart.map((item) => item.id))];
    for (const productId of uniqueProductIds) {
      const productTotal = cart
        .filter((item) => item.id === productId)
        .reduce((sum, item) => sum + Number(item.price || 0), 0);
      await logEvent({
        eventType: "purchase",
        productId,
        price: productTotal,
        source: "checkout"
      });
    }

    clearCart();
    form.classList.add("hidden");
    message.textContent =
      "Order placed successfully. This purchase event has been captured for analytics.";
    message.classList.remove("muted");
    message.classList.add("success-text");
  } catch (error) {
    message.textContent = error.message;
    message.classList.remove("muted");
    message.classList.add("error-text");
  }
});

