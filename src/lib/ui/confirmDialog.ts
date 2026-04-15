/**
 * Modal de confirmación (sustituye confirm() nativo).
 * Devuelve true si el usuario confirma, false si cancela o cierra con Escape.
 */

const DIALOG_Z = 10050;
const BACKDROP_CLASS =
  'fixed inset-0 z-[10049] flex items-end justify-center bg-black/40 p-4 sm:items-center sm:p-6';
const PANEL_CLASS =
  'w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5 animate-[confirmDialogIn_0.2s_ease-out]';

function injectKeyframesOnce() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('eipet-confirm-dialog-styles')) return;
  const style = document.createElement('style');
  style.id = 'eipet-confirm-dialog-styles';
  style.textContent = `
    @keyframes confirmDialogIn {
      from { opacity: 0; transform: translateY(8px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(style);
}

export type ConfirmDialogOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger = rojo (eliminar), primary = morado marca */
  confirmVariant?: 'danger' | 'primary';
};

export function showConfirmDialog(options: ConfirmDialogOptions): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false);

  injectKeyframesOnce();

  const {
    title = 'Confirmar',
    message,
    confirmLabel = 'Aceptar',
    cancelLabel = 'Cancelar',
    confirmVariant = 'primary',
  } = options;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(value);
    };

    const backdrop = document.createElement('div');
    backdrop.className = BACKDROP_CLASS;
    backdrop.style.zIndex = String(DIALOG_Z);
    backdrop.setAttribute('role', 'presentation');

    const panel = document.createElement('div');
    panel.className = PANEL_CLASS;
    panel.style.zIndex = String(DIALOG_Z + 1);
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'eipet-confirm-title');

    const titleEl = document.createElement('h2');
    titleEl.id = 'eipet-confirm-title';
    titleEl.className = 'text-lg font-bold text-gray-900';
    titleEl.textContent = title;

    const msgEl = document.createElement('p');
    msgEl.className = 'mt-2 text-sm leading-relaxed text-gray-600';
    msgEl.textContent = message;

    const row = document.createElement('div');
    row.className = 'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3';

    const btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.className =
      'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto';
    btnCancel.textContent = cancelLabel;

    const btnConfirm = document.createElement('button');
    btnConfirm.type = 'button';
    btnConfirm.className =
      confirmVariant === 'danger'
        ? 'w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-red-700 sm:w-auto'
        : 'w-full rounded-xl bg-linear-to-r from-[#5d3fbb] to-[#6d4fcc] px-4 py-3 text-sm font-semibold text-white shadow-md hover:from-[#6d4fcc] hover:to-[#7d5fdd] sm:w-auto';

    btnConfirm.textContent = confirmLabel;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(false);
    };

    const cleanup = () => {
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
    };

    btnCancel.addEventListener('click', () => finish(false));
    btnConfirm.addEventListener('click', () => finish(true));
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) finish(false);
    });
    panel.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('keydown', onKey);

    row.appendChild(btnCancel);
    row.appendChild(btnConfirm);
    panel.appendChild(titleEl);
    panel.appendChild(msgEl);
    panel.appendChild(row);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    btnConfirm.focus();
  });
}

declare global {
  interface Window {
    /** Modal de confirmación (scripts inline / `define:vars`). */
    showEipetConfirm?: typeof showConfirmDialog;
  }
}

if (typeof window !== 'undefined') {
  window.showEipetConfirm = showConfirmDialog;
}
