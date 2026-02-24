const els = {
  mobileMenuBtn: document.getElementById("mobile-menu-btn"),
  mobileMenu: document.getElementById("mobile-menu"),
  menuIcon: document.getElementById("menu-icon"),
  closeIcon: document.getElementById("close-icon"),
  mobileSearchToggleBtn: document.getElementById("mobile-search-toggle-btn"),
  mobileSearchContainer: document.getElementById("mobile-search-container"),
  searchIcon: document.getElementById("search-icon"),
  searchCloseIcon: document.getElementById("search-close-icon"),
  mobileResultsDropdown: document.getElementById("mobile-search-results-dropdown"),
};

export function initMobileMenu(): void {
  els.mobileMenuBtn?.addEventListener("click", () => {
    const isOpen = els.mobileMenu?.classList.contains("max-h-0");
    if (isOpen) {
      els.mobileMenu?.classList.remove("max-h-0");
      els.mobileMenu?.classList.add("max-h-screen");
      els.menuIcon?.classList.add("hidden");
      els.closeIcon?.classList.remove("hidden");
      if (els.mobileSearchContainer && !els.mobileSearchContainer.classList.contains("max-h-0")) {
        els.mobileSearchContainer.classList.add("max-h-0");
        els.mobileSearchContainer.classList.remove("max-h-64");
        els.searchIcon?.classList.remove("hidden");
        els.searchCloseIcon?.classList.add("hidden");
      }
    } else {
      els.mobileMenu?.classList.add("max-h-0");
      els.mobileMenu?.classList.remove("max-h-screen");
      els.menuIcon?.classList.remove("hidden");
      els.closeIcon?.classList.add("hidden");
    }
  });

  els.mobileSearchToggleBtn?.addEventListener("click", () => {
    const isOpen = els.mobileSearchContainer?.classList.contains("max-h-0");
    if (isOpen) {
      els.mobileSearchContainer?.classList.remove("max-h-0");
      els.mobileSearchContainer?.classList.add("max-h-64");
      els.searchIcon?.classList.add("hidden");
      els.searchCloseIcon?.classList.remove("hidden");
      if (els.mobileMenu && !els.mobileMenu.classList.contains("max-h-0")) {
        els.mobileMenu.classList.add("max-h-0");
        els.mobileMenu.classList.remove("max-h-screen");
        els.menuIcon?.classList.remove("hidden");
        els.closeIcon?.classList.add("hidden");
      }
      setTimeout(() => {
        (document.getElementById("mobile-search-input") as HTMLInputElement)?.focus();
      }, 100);
    } else {
      els.mobileSearchContainer?.classList.add("max-h-0");
      els.mobileSearchContainer?.classList.remove("max-h-64");
      els.searchIcon?.classList.remove("hidden");
      els.searchCloseIcon?.classList.add("hidden");
      els.mobileResultsDropdown?.classList.add("hidden");
    }
  });
}
