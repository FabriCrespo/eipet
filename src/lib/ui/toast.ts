/**
 * Toasts globales (misma idea que en products: esquina superior derecha, slideInRight).
 * Usar en lugar de alert() en toda la app.
 */
export type ToastType = 'success' | 'info' | 'error' | 'warning';

const TOAST_ID = 'eipet-app-toast';
const DURATION_MS = 3200;

const typeClasses: Record<ToastType, string> = {
  success: 'bg-green-500 text-white',
  info: 'bg-blue-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-amber-500 text-white',
};

function iconPath(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'M5 13l4 4L19 7';
    case 'error':
      return 'M6 18L18 6M6 6l12 12';
    case 'warning':
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z';
    default:
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }
}

export function showToast(message: string, type: ToastType = 'info'): void {
  if (typeof document === 'undefined') return;

  document.getElementById(TOAST_ID)?.remove();

  const wrap = document.createElement('div');
  wrap.id = TOAST_ID;
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-live', 'polite');
  wrap.className = `fixed top-4 right-4 z-[9999] px-5 py-3.5 rounded-xl shadow-2xl flex items-start gap-3 max-w-[min(100vw-2rem,28rem)] ${typeClasses[type]}`;
  wrap.style.animation = 'slideInRight 0.3s ease-out';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'w-6 h-6 shrink-0 mt-0.5');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('d', iconPath(type));
  svg.appendChild(path);

  const span = document.createElement('span');
  span.className = 'font-semibold text-sm md:text-base leading-snug break-words';
  span.textContent = message;

  wrap.appendChild(svg);
  wrap.appendChild(span);
  document.body.appendChild(wrap);

  window.setTimeout(() => {
    wrap.style.animation = 'slideOutRight 0.3s ease-out';
    window.setTimeout(() => wrap.remove(), 280);
  }, DURATION_MS);
}

declare global {
  interface Window {
    showEipetToast?: (message: string, type?: ToastType) => void;
  }
}

if (typeof window !== 'undefined') {
  window.showEipetToast = showToast;
}
