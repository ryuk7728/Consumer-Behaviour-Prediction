import { cartTotal, getCart } from "./shop-utils.js";

const cartList = document.querySelector("#cartList");
const cartTotalNode = document.querySelector("#cartTotal");

const cart = getCart();

if (!cart.length) {
  cartList.innerHTML = `<li><span>Your cart is empty.</span><a class="nav-link" href="/">Add products</a></li>`;
} else {
  cartList.innerHTML = cart
    .map(
      (item) => `<li><span>${item.name}</span><span>$${Number(item.price).toFixed(2)}</span></li>`
    )
    .join("");
}

cartTotalNode.textContent = `$${cartTotal().toFixed(2)}`;

