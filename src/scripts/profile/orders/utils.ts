/** Utilidades compartidas para la sección de pedidos */

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
] as const;

export function formatDate(timestamp: unknown): string {
  if (!timestamp) return 'Fecha no disponible';

  let date: Date;
  const ts = timestamp as { toDate?: () => Date };
  if (typeof ts.toDate === 'function') {
    date = ts.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return 'Fecha no disponible';
  }

  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

export function escapeHtml(text: unknown): string {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

export function getUserId(maxAttempts = 30, delay = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tryGetUserId = (): void => {
      attempts++;
      let userId: string | null = null;

      userId = localStorage.getItem('userId');
      if (!userId && (window as Window & { currentUserId?: string }).currentUserId) {
        userId = (window as Window & { currentUserId: string }).currentUserId;
      }
      if (!userId) {
        const profilePanel = document.getElementById('profile-content-panel');
        if (profilePanel) userId = profilePanel.getAttribute('data-user-id');
      }

      if (userId?.trim()) {
        resolve(userId);
      } else if (attempts < maxAttempts) {
        setTimeout(tryGetUserId, delay);
      } else {
        reject(new Error('Usuario no autenticado. Por favor, inicia sesión.'));
      }
    };

    tryGetUserId();
  });
}

export function isOrdersSectionVisible(): boolean {
  const section = document.querySelector('[data-profile-section="orders"]');
  if (!section) return false;
  const style = getComputedStyle(section);
  const isHidden = section.classList.contains('hidden') ||
    (section as HTMLElement).style.display === 'none' ||
    style.display === 'none';
  return !isHidden;
}
