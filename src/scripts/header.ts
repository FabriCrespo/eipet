import { initMobileMenu } from "./header/mobile";
import { initCart } from "./header/cart";
import { initSearch } from "./header/search";
import { initAuth } from "./header/auth";

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initAuth();
  initCart();
  initSearch();
});
