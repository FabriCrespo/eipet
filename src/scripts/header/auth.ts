const els = {
  logoutBtn: document.getElementById("logout-btn"),
  mobileLogoutBtn: document.getElementById("mobile-logout-btn"),
};

export function updateAuthUI(user: { role?: string } | null): void {
  const loginMenuItems = document.getElementById("login-menu-items");
  const userMenuItems = document.querySelectorAll('a[href="/profile"], a[href="/profile#orders"], a[href="/profile#favorites"]');
  const userMenuItemsContainer = document.getElementById("user-menu-items");
  const adminLink = document.getElementById("admin-link");
  const mobileAdminLink = document.getElementById("mobile-admin-link");
  const userMenuDivider = document.getElementById("user-menu-divider");
  const mobileLogoutDivider = document.getElementById("mobile-logout-divider");
  const mobileUserMenuItems = document.getElementById("mobile-user-menu-items");
  const mobileProfileLink = document.querySelector('a[href="/profile"]');
  const mobileOrdersLink = document.querySelector('a[href="/profile#orders"]');
  const mobileFavoritesLink = document.querySelector('a[href="/profile#favorites"]');

  const show = (el: Element | null) => { el?.classList.remove("hidden"); el?.classList.add("flex"); };
  const hide = (el: Element | null) => { el?.classList.add("hidden"); el?.classList.remove("flex"); };

  if (user) {
    show(els.logoutBtn);
    show(els.mobileLogoutBtn);
    document.getElementById("mobile-login-btn")?.classList.add("hidden");
    loginMenuItems?.classList.add("hidden");
    userMenuItemsContainer?.classList.remove("hidden");
    userMenuItems.forEach(show);
    show(mobileUserMenuItems);
    [mobileProfileLink, mobileOrdersLink, mobileFavoritesLink].forEach(show);

    if (user.role === "admin") {
      show(adminLink);
      show(mobileAdminLink);
    } else {
      hide(adminLink);
      hide(mobileAdminLink);
    }
    show(userMenuDivider);
    show(mobileLogoutDivider);
  } else {
    hide(els.logoutBtn);
    hide(els.mobileLogoutBtn);
    document.getElementById("mobile-login-btn")?.classList.remove("hidden");
    loginMenuItems?.classList.remove("hidden");
    userMenuItemsContainer?.classList.add("hidden");
    userMenuItems.forEach(hide);
    [mobileUserMenuItems, mobileProfileLink, mobileOrdersLink, mobileFavoritesLink].forEach(hide);
    [adminLink, mobileAdminLink, userMenuDivider, mobileLogoutDivider].forEach(hide);
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
  els.logoutBtn?.addEventListener("click", handleLogout);
  els.mobileLogoutBtn?.addEventListener("click", handleLogout);
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
