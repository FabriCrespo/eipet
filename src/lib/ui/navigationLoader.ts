/** Overlay de “navegando…” solo si la carga tarda (evita doble loader con prefetch rápido). */

const LOADER_ID = 'navigation-loader';
/** Si el documento nuevo llega antes, no se llega a mostrar. */
const SHOW_DELAY_MS = 400;

let showTimer: ReturnType<typeof setTimeout> | null = null;

function ensureLoaderEl(): HTMLElement {
  let el = document.getElementById(LOADER_ID) as HTMLElement | null;
  if (el) return el;
  el = document.createElement('div');
  el.id = LOADER_ID;
  el.className =
    'fixed inset-0 bg-white/95 z-[60] flex items-center justify-center transition-opacity duration-200';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-busy', 'true');
  el.innerHTML = `
    <div class="text-center px-4">
      <div class="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3">
        <div class="absolute inset-0 border-[3px] border-[#5d3fbb]/15 rounded-full"></div>
        <div class="absolute inset-0 border-[3px] border-transparent border-t-[#5d3fbb] rounded-full animate-spin"></div>
      </div>
      <p class="text-[#5d3fbb] font-semibold text-sm sm:text-base">Cargando…</p>
    </div>
  `;
  document.body.appendChild(el);
  return el;
}

export function scheduleNavigationLoader(): void {
  cancelNavigationLoaderSchedule();
  showTimer = setTimeout(() => {
    showTimer = null;
    const loader = ensureLoaderEl();
    loader.style.display = 'flex';
    loader.style.opacity = '1';
  }, SHOW_DELAY_MS);
}

export function cancelNavigationLoaderSchedule(): void {
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
}

export function hideNavigationLoader(): void {
  cancelNavigationLoaderSchedule();
  const el = document.getElementById(LOADER_ID);
  if (el) {
    el.style.display = 'none';
    el.remove();
  }
}
