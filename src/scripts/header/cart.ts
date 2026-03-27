let els: ReturnType<typeof getCartEls>;

function getCartEls() {
  return {
    cartBtn: document.getElementById("cart-btn"),
    cartDropdown: document.getElementById("cart-dropdown"),
    cartItems: document.getElementById("cart-items"),
    cartEmpty: document.getElementById("cart-empty"),
    cartFooter: document.getElementById("cart-footer"),
    cartSkeleton: document.getElementById("cart-skeleton"),
    cartCount: document.getElementById("cart-count"),
    cartSubtotal: document.getElementById("cart-subtotal"),
    cartTotal: document.getElementById("cart-total"),
    closeCartBtn: document.getElementById("close-cart-btn"),
    viewCartBtn: document.getElementById("view-cart-btn"),
    checkoutBtn: document.getElementById("checkout-btn"),
  };
}

type CartProduct = { id: string; name: string; price: number; image: string; brandName?: string; stock?: number };
type CartItem = { productId: string; quantity: number; product?: CartProduct };

let cartState: { items: CartItem[]; lastUpdated: number } = { items: [], lastUpdated: Date.now() };

function loadCart(): void {
  try {
    const raw = localStorage.getItem("cart");
    if (raw) {
      const p = JSON.parse(raw);
      cartState.items = p.items || [];
      cartState.lastUpdated = p.lastUpdated || Date.now();
    }
  } catch {
    cartState.items = [];
  }
}

function saveCart(): void {
  cartState.lastUpdated = Date.now();
  localStorage.setItem("cart", JSON.stringify(cartState));
}

const getCount = () => cartState.items.reduce((s, i) => s + i.quantity, 0);
const getSubtotal = () => cartState.items.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0);

function formatBsAmount(n: number): string {
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

let deliverySettingsCache: { data: any; at: number } | null = null;
const DELIVERY_CACHE_MS = 60_000;

async function getDeliverySettingsCached(): Promise<any> {
  if (deliverySettingsCache && Date.now() - deliverySettingsCache.at < DELIVERY_CACHE_MS) {
    return deliverySettingsCache.data;
  }
  const { getDeliverySettings } = await import("../../lib/db/storeSettings");
  const res = await getDeliverySettings();
  deliverySettingsCache = { data: res.data, at: Date.now() };
  return res.data;
}

const TOAST_VISIBLE_MS = 2600;
const TOAST_EXIT_ANIM_MS = 320;

function ensureCartDeliveryToastStyles(): void {
  if (document.getElementById("eipet-cart-delivery-toast-style")) return;
  const s = document.createElement("style");
  s.id = "eipet-cart-delivery-toast-style";
  s.textContent = `
    #eipet-cart-delivery-toast {
      position: fixed;
      left: 50%;
      top: max(0.75rem, env(safe-area-inset-top, 0px));
      z-index: 2000;
      width: min(100% - 2rem, 22rem);
      margin: 0;
      padding: 0.7rem 1rem;
      border-radius: 0.875rem;
      border: 1px solid rgba(93, 63, 187, 0.2);
      background: linear-gradient(145deg, #ffffff 0%, #f5f3ff 55%, #faf8ff 100%);
      box-shadow: 0 12px 36px rgba(93, 63, 187, 0.18), 0 4px 12px rgba(15, 23, 42, 0.06);
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1e1b4b;
      line-height: 1.35;
      text-align: center;
      pointer-events: none;
      transform: translate3d(-50%, -130%, 0) scale(0.96);
      opacity: 0;
      transition:
        transform 0.38s cubic-bezier(0.34, 1.35, 0.64, 1),
        opacity 0.28s ease;
      will-change: transform, opacity;
    }
    #eipet-cart-delivery-toast.eipet-cart-toast--in {
      transform: translate3d(-50%, 0, 0) scale(1);
      opacity: 1;
    }
    #eipet-cart-delivery-toast.eipet-cart-toast--out {
      transform: translate3d(-50%, -18px, 0) scale(0.98);
      opacity: 0;
      transition:
        transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        opacity 0.22s ease;
    }
  `;
  document.head.appendChild(s);
}

function showCartToast(message: string): void {
  ensureCartDeliveryToastStyles();
  let el = document.getElementById("eipet-cart-delivery-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "eipet-cart-delivery-toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }

  const timers = showCartToast as unknown as {
    _hide?: ReturnType<typeof setTimeout>;
    _cleanup?: ReturnType<typeof setTimeout>;
  };
  if (timers._hide) clearTimeout(timers._hide);
  if (timers._cleanup) clearTimeout(timers._cleanup);

  el.textContent = message;
  el.classList.remove("eipet-cart-toast--in", "eipet-cart-toast--out");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el?.classList.add("eipet-cart-toast--in");
    });
  });

  timers._hide = setTimeout(() => {
    el?.classList.remove("eipet-cart-toast--in");
    el?.classList.add("eipet-cart-toast--out");
    timers._cleanup = setTimeout(() => {
      el?.classList.remove("eipet-cart-toast--out");
    }, TOAST_EXIT_ANIM_MS);
  }, TOAST_VISIBLE_MS);
}

/** Tras agregar o subir cantidad: solo aviso "Te faltan {amount}..." si aún no alcanza el mínimo (el mensaje de envío gratis va solo en checkout con ubicación en cobertura). */
async function notifyTeFaltanEnvioGratis(): Promise<void> {
  try {
    const data = await getDeliverySettingsCached();
    if (!data || data.freeDeliveryEnabled === false) return;
    const min = Number(data.minPurchaseAmount ?? 0);
    if (min <= 0) return;
    const sub = getSubtotal();
    if (sub >= min) return;
    const falta = Math.max(0, min - sub);
    const template = data.messageTeFaltan || "Te faltan {amount} Bs para envío gratis";
    const text = String(template).replace(/\{amount\}/g, formatBsAmount(falta));
    showCartToast(text);
  } catch {
    /* silencioso */
  }
}

function updateCount(): void {
  if (!els.cartCount) return;
  const n = getCount();
  if (n > 0) {
    els.cartCount.textContent = n > 99 ? "99+" : String(n);
    els.cartCount.classList.toggle("px-1", n > 9);
    els.cartCount.classList.remove("hidden");
    els.cartCount.classList.add("flex", "animate-pulse-once");
    setTimeout(() => els.cartCount?.classList.remove("animate-pulse-once"), 500);
  } else {
    els.cartCount.classList.add("hidden");
    els.cartCount.classList.remove("flex", "px-1");
  }
}

function updateTotals(): void {
  const sub = getSubtotal();
  if (els.cartSubtotal) els.cartSubtotal.textContent = `Bs. ${sub.toLocaleString()}`;
  if (els.cartTotal) els.cartTotal.textContent = `Bs. ${sub.toLocaleString()}`;
}

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f3f4f6' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' dy='.3em' fill='%239ca3af' font-size='12' text-anchor='middle'%3EImagen%3C/text%3E%3C/svg%3E";

function renderItems(): void {
  if (!els.cartItems || !els.cartEmpty || !els.cartFooter) return;
  els.cartSkeleton?.classList.add("hidden");

  if (cartState.items.length === 0) {
    els.cartItems.classList.add("hidden");
    els.cartEmpty.classList.remove("hidden");
    els.cartFooter.classList.add("hidden");
    return;
  }

  els.cartItems.classList.remove("hidden");
  els.cartEmpty.classList.add("hidden");
  els.cartFooter.classList.remove("hidden");

  els.cartItems.innerHTML = cartState.items
    .map((item, idx) => {
      const p = item.product;
      if (!p) return "";
      const sub = (p.price || 0) * item.quantity;
      return `
        <div class="cart-item flex gap-3 p-2.5 bg-gray-50 rounded-lg" data-product-id="${item.productId}">
          <div class="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg overflow-hidden shrink-0">
            <img src="${p.image || ""}" alt="${p.name}" class="w-full h-full object-cover" onerror="this.src='${PLACEHOLDER_IMG}'" />
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 mb-1">${p.name}</h4>
            ${p.brandName ? `<p class="text-[10px] text-gray-500 mb-1">${p.brandName}</p>` : ""}
            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center gap-1.5">
                <button type="button" class="cart-decrease-btn w-6 h-6 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 flex items-center justify-center text-xs" data-product-id="${item.productId}" aria-label="Disminuir"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg></button>
                <span class="cart-item-quantity text-xs font-semibold w-6 text-center">${item.quantity}</span>
                <button type="button" class="cart-increase-btn w-6 h-6 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 flex items-center justify-center text-xs" data-product-id="${item.productId}" aria-label="Aumentar"><svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg></button>
              </div>
              <div class="text-right">
                <p class="text-xs sm:text-sm font-bold text-[#5d3fbb]">Bs. ${sub.toLocaleString()}</p>
                <p class="text-[10px] text-gray-500">Bs. ${(p.price || 0).toLocaleString()} c/u</p>
              </div>
            </div>
          </div>
          <button type="button" class="cart-remove-btn p-1 text-gray-400 hover:text-red-500 shrink-0 self-start" data-product-id="${item.productId}" aria-label="Eliminar"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
        </div>`;
    })
    .join("");
  updateTotals();
}

let delegationDone = false;
function setupDelegation(): void {
  if (delegationDone || !els.cartItems) return;
  delegationDone = true;
  els.cartItems.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    const inc = t.closest(".cart-increase-btn");
    const dec = t.closest(".cart-decrease-btn");
    const rm = t.closest(".cart-remove-btn");
    const id = inc?.getAttribute("data-product-id") ?? dec?.getAttribute("data-product-id") ?? rm?.getAttribute("data-product-id");
    if (inc && id) changeQty(id, 1);
    else if (dec && id) changeQty(id, -1);
    else if (rm && id) remove(id);
  });
}

function changeQty(pid: string, delta: number): void {
  const item = cartState.items.find((i) => i.productId === pid);
  if (!item) return;
  const q = item.quantity + delta;
  if (q <= 0) {
    remove(pid);
    return;
  }
  if (item.product?.stock != null && q > item.product.stock) {
    alert(`Stock insuficiente. Disponible: ${item.product.stock}`);
    return;
  }
  item.quantity = q;
  saveCart();
  renderItems();
  updateCount();
  window.dispatchEvent(new CustomEvent("cart-updated"));
  if (delta > 0) void notifyTeFaltanEnvioGratis();
}

function remove(pid: string): void {
  cartState.items = cartState.items.filter((i) => i.productId !== pid);
  saveCart();
  renderItems();
  updateCount();
  window.dispatchEvent(new CustomEvent("cart-updated"));
}

export function addToCart(product: CartProduct, qty = 1): boolean {
  const item = cartState.items.find((i) => i.productId === product.id);
  if (item) {
    if (product.stock != null && item.quantity + qty > product.stock) {
      alert(`Stock insuficiente. Disponible: ${product.stock}`);
      return false;
    }
    item.quantity += qty;
  } else {
    if (product.stock != null && qty > product.stock) {
      alert(`Stock insuficiente. Disponible: ${product.stock}`);
      return false;
    }
    cartState.items.push({ productId: product.id, quantity: qty, product });
  }
  saveCart();
  renderItems();
  updateCount();
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: { productId: product.id, action: "added" } }));
  void notifyTeFaltanEnvioGratis();
  return true;
}

async function loadProductData(): Promise<void> {
  const need = cartState.items.filter((i) => !i.product);
  if (!need.length) return;

  els.cartSkeleton?.classList.remove("hidden");
  els.cartItems?.classList.add("hidden");
  els.cartEmpty?.classList.add("hidden");

  try {
    const { getProductById } = await import("../../lib/db/products");
    const { getBrands } = await import("../../lib/db/brands");
    const brandsRes = await getBrands();
    const brands = brandsRes.data ?? [];

    for (const item of need) {
      const { data } = await getProductById(item.productId);
      if (data) {
        const brand = brands.find((b: { id: string }) => b.id === data.brand);
        item.product = {
          id: data.id,
          name: data.name,
          price: data.price,
          image: data.image,
          brandName: brand?.name,
          stock: data.stock,
        };
      }
    }
    saveCart();
    renderItems();
  } catch (e) {
    console.error("Error cargando productos:", e);
  }
}

function openDropdown(): void {
  if (!els.cartDropdown) return;
  document.body.classList.add("cart-open");
  els.cartDropdown.style.display = "flex";
  requestAnimationFrame(() => els.cartDropdown?.classList.remove("opacity-0", "invisible"));
  els.cartDropdown.classList.add("opacity-100", "visible");
}

function closeDropdown(): void {
  if (!els.cartDropdown) return;
  document.body.classList.remove("cart-open");
  els.cartDropdown.classList.remove("opacity-100", "visible");
  els.cartDropdown.classList.add("opacity-0", "invisible");
  setTimeout(() => { els.cartDropdown!.style.display = "none"; }, 200);
}

export async function initCart(): Promise<void> {
  els = getCartEls();
  setupDelegation();
  loadCart();
  await loadProductData();
  updateCount();
  renderItems();

  els.cartBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (els.cartDropdown?.classList.contains("opacity-0") || els.cartDropdown?.style.display === "none") openDropdown();
    else closeDropdown();
  });
  els.closeCartBtn?.addEventListener("click", (e) => { e.stopPropagation(); closeDropdown(); });

  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (els.cartDropdown && !els.cartDropdown.contains(t) && t !== els.cartBtn && !els.cartBtn?.contains(t)) closeDropdown();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.cartDropdown && !els.cartDropdown.classList.contains("opacity-0")) closeDropdown();
  });

  els.viewCartBtn?.addEventListener("click", () => (window.location.href = "/cart"));
  els.checkoutBtn?.addEventListener("click", () => (window.location.href = "/checkout"));

  if (!(window as any).__cartInit) {
    (window as any).__cartInit = true;
    window.addEventListener("storage", (e) => {
      if (e.key === "cart") { loadCart(); renderItems(); updateCount(); }
    });
  }

  (window as any).addToCart = addToCart;
  (window as any).getCartState = () => cartState;
}
