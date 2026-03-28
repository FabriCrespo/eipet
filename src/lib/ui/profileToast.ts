/**
 * Toasts tipo Sonner para el perfil / tienda: parte superior, auto-dismiss, no bloquean.
 */

export type ProfileToastVariant = 'success' | 'error' | 'info';

const VARIANT: Record<
  ProfileToastVariant,
  { border: string; bg: string; color: string; shadow: string; icon: string }
> = {
  success: {
    border: '1px solid rgba(16, 185, 129, 0.35)',
    bg: '#ffffff',
    color: '#064e3b',
    shadow: '0 12px 40px -14px rgba(16, 185, 129, 0.35)',
    icon: '✓',
  },
  error: {
    border: '1px solid rgba(239, 68, 68, 0.4)',
    bg: '#ffffff',
    color: '#7f1d1d',
    shadow: '0 12px 40px -14px rgba(239, 68, 68, 0.35)',
    icon: '!',
  },
  info: {
    border: '1px solid rgba(93, 63, 187, 0.35)',
    bg: '#ffffff',
    color: '#111827',
    shadow: '0 12px 40px -14px rgba(93, 63, 187, 0.28)',
    icon: 'i',
  },
};

export function showProfileToast(
  message: string,
  variant: ProfileToastVariant = 'info',
  durationMs = 4200
): void {
  if (typeof document === 'undefined') return;

  let host = document.getElementById('profile-toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'profile-toast-host';
    host.setAttribute('aria-live', 'polite');
    host.style.cssText = [
      'position:fixed',
      'top:max(0.75rem, env(safe-area-inset-top, 0px))',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:99998',
      'display:flex',
      'flex-direction:column',
      'gap:0.5rem',
      'align-items:center',
      'width:min(100% - 1.5rem, 24rem)',
      'pointer-events:none',
    ].join(';');
    document.body.appendChild(host);
  }

  const t = VARIANT[variant];
  const row = document.createElement('div');
  row.setAttribute('role', 'status');
  row.style.cssText = [
    'pointer-events:auto',
    'display:flex',
    'align-items:flex-start',
    'gap:0.65rem',
    'padding:0.75rem 1rem',
    'border-radius:0.75rem',
    'font-size:0.875rem',
    'font-weight:500',
    'line-height:1.4',
    'font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
    `border:${t.border}`,
    `background:${t.bg}`,
    `color:${t.color}`,
    `box-shadow:${t.shadow}`,
  ].join(';');

  const badge = document.createElement('span');
  badge.setAttribute('aria-hidden', 'true');
  badge.textContent = t.icon;
  badge.style.cssText = [
    'flex-shrink:0',
    'width:1.5rem',
    'height:1.5rem',
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'border-radius:0.5rem',
    'font-size:0.75rem',
    'font-weight:700',
    variant === 'success' ? 'background:rgba(16,185,129,0.15)' : '',
    variant === 'error' ? 'background:rgba(239,68,68,0.12)' : '',
    variant === 'info' ? 'background:rgba(93,63,187,0.12)' : '',
  ]
    .filter(Boolean)
    .join(';');

  const text = document.createElement('span');
  text.textContent = message;

  row.appendChild(badge);
  row.appendChild(text);
  host.appendChild(row);

  if (!document.getElementById('profile-toast-keyframes')) {
    const s = document.createElement('style');
    s.id = 'profile-toast-keyframes';
    s.textContent = `
      @keyframes profileToastIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes profileToastOut { from { opacity: 1; } to { opacity: 0; transform: translateY(-6px); } }
    `;
    document.head.appendChild(s);
  }

  row.style.animation = 'profileToastIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards';

  const remove = () => {
    row.style.animation = 'profileToastOut 0.28s ease forwards';
    setTimeout(() => row.remove(), 280);
  };
  setTimeout(remove, durationMs);
}
