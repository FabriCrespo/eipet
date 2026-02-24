const els = {
  searchInput: document.getElementById("header-search-input") as HTMLInputElement | null,
  mobileSearchInput: document.getElementById("mobile-search-input") as HTMLInputElement | null,
  clearBtn: document.getElementById("header-clear-search-btn"),
  mobileClearBtn: document.getElementById("mobile-clear-search-btn"),
  resultsDropdown: document.getElementById("search-results-dropdown"),
  resultsContent: document.getElementById("search-results-content"),
  searchLoading: document.getElementById("search-loading"),
  searchEmpty: document.getElementById("search-empty"),
  mobileResultsDropdown: document.getElementById("mobile-search-results-dropdown"),
  mobileResultsContent: document.getElementById("mobile-search-results-content"),
  mobileSearchLoading: document.getElementById("mobile-search-loading"),
  mobileSearchEmpty: document.getElementById("mobile-search-empty"),
  mobileSearchToggleBtn: document.getElementById("mobile-search-toggle-btn"),
  mobileSearchContainer: document.getElementById("mobile-search-container"),
};

let products: { name?: string; brand?: string; description?: string; image: string; price: number }[] = [];
let debounce: ReturnType<typeof setTimeout> | null = null;

async function loadProducts(): Promise<void> {
  try {
    const res = await fetch("/data/products.json");
    const data = await res.json();
    products = data.products ?? [];
  } catch (e) {
    console.error("Error cargando productos:", e);
  }
}

function search(q: string): { name?: string; brand?: string; image: string; price: number }[] {
  if (!q.trim() || !products.length) return [];
  const term = q.toLowerCase().trim();
  return products
    .filter((p) => {
      const n = (p.name ?? "").toLowerCase();
      const b = (p.brand ?? "").toLowerCase();
      const d = (p.description ?? "").toLowerCase();
      return n.includes(term) || b.includes(term) || d.includes(term);
    })
    .slice(0, 5);
}

function renderResult(p: { name?: string; brand?: string; image: string; price: number }, query: string): string {
  return `
    <a href="/products?search=${encodeURIComponent(query)}" class="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-50 group" data-astro-prefetch>
      <div class="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0">
        <img src="${p.image}" alt="${p.name ?? ""}" class="w-full h-full object-cover group-hover:scale-110 transition-transform" loading="lazy" />
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold text-gray-900 truncate">${p.name ?? ""}</p>
        <p class="text-[10px] text-gray-500 truncate">${p.brand ?? ""}</p>
        <p class="text-xs font-bold text-[#5d3fbb] mt-0.5">Bs. ${(p.price ?? 0).toLocaleString()}</p>
      </div>
    </a>`;
}

function showResults(results: { name?: string; brand?: string; image: string; price: number }[], query: string): void {
  const html = results.map((p) => renderResult(p, query)).join("");

  const show = (dropdown: HTMLElement | null, content: HTMLElement | null, loading: HTMLElement | null, empty: HTMLElement | null) => {
    if (!dropdown || !content) return;
    dropdown.classList.remove("hidden");
    if (results.length === 0) {
      content.classList.add("hidden");
      loading?.classList.add("hidden");
      empty?.classList.remove("hidden");
    } else {
      content.classList.remove("hidden");
      content.innerHTML = html;
      loading?.classList.add("hidden");
      empty?.classList.add("hidden");
    }
  };

  show(els.resultsDropdown, els.resultsContent, els.searchLoading, els.searchEmpty);
  show(els.mobileResultsDropdown, els.mobileResultsContent, els.mobileSearchLoading, els.mobileSearchEmpty);
}

function handleSearch(query: string): void {
  if (debounce) clearTimeout(debounce);
  if (!query.trim()) {
    els.resultsDropdown?.classList.add("hidden");
    els.mobileResultsDropdown?.classList.add("hidden");
    els.clearBtn?.classList.add("hidden");
    els.mobileClearBtn?.classList.add("hidden");
    return;
  }
  els.clearBtn?.classList.remove("hidden");
  els.mobileClearBtn?.classList.remove("hidden");
  els.resultsDropdown?.classList.remove("hidden");
  els.resultsContent?.classList.add("hidden");
  els.searchLoading?.classList.remove("hidden");
  els.searchEmpty?.classList.add("hidden");
  els.mobileResultsDropdown?.classList.remove("hidden");
  els.mobileResultsContent?.classList.add("hidden");
  els.mobileSearchLoading?.classList.remove("hidden");
  els.mobileSearchEmpty?.classList.add("hidden");

  debounce = setTimeout(() => showResults(search(query), query), 300);
}

function clearSearch(): void {
  els.searchInput && (els.searchInput.value = "");
  els.mobileSearchInput && (els.mobileSearchInput.value = "");
  els.resultsDropdown?.classList.add("hidden");
  els.mobileResultsDropdown?.classList.add("hidden");
  els.clearBtn?.classList.add("hidden");
  els.mobileClearBtn?.classList.add("hidden");
  els.searchInput?.focus();
}

function isOutsideSearch(target: HTMLElement): boolean {
  return (
    els.resultsDropdown && !els.resultsDropdown.contains(target) &&
    els.mobileResultsDropdown && !els.mobileResultsDropdown.contains(target) &&
    target !== els.searchInput && target !== els.mobileSearchInput &&
    !els.mobileSearchToggleBtn?.contains(target) &&
    !els.mobileSearchContainer?.contains(target)
  );
}

export function initSearch(): void {
  const syncAndSearch = (q: string) => {
    if (els.searchInput) els.searchInput.value = q;
    if (els.mobileSearchInput) els.mobileSearchInput.value = q;
    handleSearch(q);
  };

  els.searchInput?.addEventListener("input", (e) => syncAndSearch((e.target as HTMLInputElement).value));
  els.searchInput?.addEventListener("focus", () => { const q = els.searchInput?.value ?? ""; if (q.trim()) showResults(search(q), q); });
  els.clearBtn?.addEventListener("click", clearSearch);

  els.mobileSearchInput?.addEventListener("input", (e) => syncAndSearch((e.target as HTMLInputElement).value));
  els.mobileSearchInput?.addEventListener("focus", () => { const q = els.mobileSearchInput?.value ?? ""; if (q.trim()) showResults(search(q), q); });
  els.mobileClearBtn?.addEventListener("click", clearSearch);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      els.resultsDropdown?.classList.add("hidden");
      els.mobileResultsDropdown?.classList.add("hidden");
      els.searchInput?.blur();
      els.mobileSearchInput?.blur();
    }
  });

  document.addEventListener("click", (e) => {
    const t = e.target as HTMLElement;
    if (isOutsideSearch(t)) {
      els.resultsDropdown?.classList.add("hidden");
      els.mobileResultsDropdown?.classList.add("hidden");
    }
  });

  loadProducts();
}
