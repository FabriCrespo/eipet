/** Modal de calificación de pedidos */

let currentRating = 0;
let currentOrderId = '';
let hoveredRating = 0;

function updateStars(rating: number): void {
  document.querySelectorAll('.star-btn').forEach((star, index) => {
    const starNum = index + 1;
    const svg = star.querySelector('svg');
    if (starNum <= rating) {
      if (svg) {
        svg.setAttribute('fill', 'currentColor');
        svg.removeAttribute('stroke');
        svg.removeAttribute('stroke-width');
      }
      star.classList.remove('text-gray-300');
      star.classList.add('text-yellow-400');
    } else {
      if (svg) {
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
      }
      star.classList.remove('text-yellow-400');
      star.classList.add('text-gray-300');
    }
  });
}

export function closeRatingModal(): void {
  const modal = document.getElementById('rating-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    currentRating = 0;
    hoveredRating = 0;
    currentOrderId = '';
  }
}

export function openRatingModal(orderId: string): void {
  currentOrderId = orderId;
  currentRating = 0;
  hoveredRating = 0;

  const modal = document.getElementById('rating-modal');
  const commentTextarea = document.getElementById('rating-comment') as HTMLTextAreaElement | null;

  if (!modal) return;

  document.querySelectorAll('.star-btn').forEach((star) => {
    const svg = star.querySelector('svg');
    if (svg) {
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
    }
    star.classList.remove('text-yellow-400');
    star.classList.add('text-gray-300');
  });

  if (commentTextarea) commentTextarea.value = '';

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

export function initRatingModal(): void {
  const modal = document.getElementById('rating-modal');
  const stars = document.querySelectorAll('.star-btn');
  const cancelBtn = document.getElementById('rating-cancel-btn');
  const submitBtn = document.getElementById('rating-submit-btn');
  const commentTextarea = document.getElementById('rating-comment') as HTMLTextAreaElement | null;
  const starsContainer = document.getElementById('rating-stars');

  if (!modal || !starsContainer) return;

  stars.forEach((star) => {
    star.addEventListener('click', () => {
      const rating = parseInt((star as HTMLElement).getAttribute('data-rating') ?? '0', 10);
      currentRating = rating;
      updateStars(rating);
    });
    star.addEventListener('mouseenter', () => {
      const rating = parseInt((star as HTMLElement).getAttribute('data-rating') ?? '0', 10);
      hoveredRating = rating;
      updateStars(rating);
    });
  });

  starsContainer.addEventListener('mouseleave', () => {
    hoveredRating = 0;
    updateStars(currentRating);
  });

  cancelBtn?.addEventListener('click', closeRatingModal);

  submitBtn?.addEventListener('click', () => {
    if (currentRating === 0) {
      alert('Por favor, selecciona una calificación');
      return;
    }
    const comment = commentTextarea?.value ?? '';
    console.log('Calificación enviada:', { orderId: currentOrderId, rating: currentRating, comment });
    alert('¡Gracias por tu calificación!');
    closeRatingModal();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeRatingModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeRatingModal();
    }
  });
}
