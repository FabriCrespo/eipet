const els = {
  logoutBtn: document.getElementById("logout-btn"),
};

function initUserMenuToggle(): void {
  const userBtn = document.getElementById("user-btn");
  const userMenuWrap = document.getElementById("user-menu-wrap");
  if (!userBtn || !userMenuWrap) return;

  const closeUserMenu = (): void => {
    userMenuWrap.classList.remove("user-menu-open");
    userBtn.setAttribute("aria-expanded", "false");
  };

  userBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const opening = !userMenuWrap.classList.contains("user-menu-open");
    userMenuWrap.classList.toggle("user-menu-open");
    userBtn.setAttribute("aria-expanded", opening ? "true" : "false");
    if (opening) {
      window.dispatchEvent(new CustomEvent("eipet-close-cart"));
    }
  });

  document.addEventListener("click", (e) => {
    const t = e.target as Node;
    if (!userMenuWrap.contains(t)) closeUserMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeUserMenu();
  });

  window.addEventListener("eipet-close-user-menu", closeUserMenu);
}

export function updateAuthUI(user: { role?: string } | null): void {
  const loginMenuItems = document.getElementById("login-menu-items");
  const userMenuItems = document.querySelectorAll(
    '#user-menu-items a[href="/profile"], #user-menu-items a[href="/profile#orders"], #user-menu-items a[href="/profile#favorites"]'
  );
  const userMenuItemsContainer = document.getElementById("user-menu-items");
  const adminLink = document.getElementById("admin-link");
  const userMenuDivider = document.getElementById("user-menu-divider");

  const show = (el: Element | null) => { el?.classList.remove("hidden"); el?.classList.add("flex"); };
  const hide = (el: Element | null) => { el?.classList.add("hidden"); el?.classList.remove("flex"); };

  if (user) {
    show(els.logoutBtn);
    loginMenuItems?.classList.add("hidden");
    userMenuItemsContainer?.classList.remove("hidden");
    userMenuItems.forEach(show);

    if (user.role === "admin") {
      show(adminLink);
    } else {
      hide(adminLink);
    }
    show(userMenuDivider);
  } else {
    hide(els.logoutBtn);
    loginMenuItems?.classList.remove("hidden");
    userMenuItemsContainer?.classList.add("hidden");
    userMenuItems.forEach(hide);
    [adminLink, userMenuDivider].forEach(hide);
  }

  window.dispatchEvent(new CustomEvent("auth-state-changed", { detail: { user } }));
}

async function handleLogout(): Promise<void> {
  try {
    const { logout } = await import("../../lib/auth");
    await logout();
  } catch (e) {
    console.error("Error al cerrar sesión:", e);
  }
  localStorage.removeItem("user");
  updateAuthUI(null);
  window.location.href = "/";
}

export async function initAuth(): Promise<void> {
  initUserMenuToggle();
  els.logoutBtn?.addEventListener("click", handleLogout);
  try {
    const { onAuthStateChange, getCurrentUserData } = await import("../../lib/auth");
    onAuthStateChange(async (firebaseUser) => {
      if (!firebaseUser) {
        updateAuthUI(null);
        localStorage.removeItem("user");
        return;
      }
      try {
        const { success, user } = await getCurrentUserData();
        if (success && user) {
          localStorage.setItem("user", JSON.stringify(user));
          updateAuthUI(user);
        } else {
          updateAuthUI(null);
          localStorage.removeItem("user");
        }
      } catch {
        updateAuthUI(null);
        localStorage.removeItem("user");
      }
    });
  } catch (e) {
    console.error("Error initializing auth:", e);
    updateAuthUI(null);
  }
}
