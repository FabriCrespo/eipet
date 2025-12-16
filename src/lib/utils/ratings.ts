/**
 * Utilidades para calcular y mostrar ratings
 */

import { getProductRatings } from '../db/ratings';
import type { Rating } from '../db/types';

/**
 * Calcular el promedio de ratings para un producto
 */
export async function getProductAverageRating(productId: string): Promise<{
  average: number;
  count: number;
}> {
  try {
    const ratingsResult = await getProductRatings(productId);
    
    if (ratingsResult.error || !ratingsResult.data || ratingsResult.data.length === 0) {
      return { average: 0, count: 0 };
    }
    
    const ratings = ratingsResult.data;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    const average = sum / ratings.length;
    const roundedAverage = Math.round(average * 10) / 10;
    
    return { average: roundedAverage, count: ratings.length };
  } catch (error) {
    console.error('Error calculating average rating:', error);
    return { average: 0, count: 0 };
  }
}

/**
 * Renderizar estrellas de rating
 */
export function renderStars(rating: number, size: 'sm' | 'md' | 'lg' = 'sm'): string {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';
  let stars = '';
  
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars += `<svg class="${sizeClass} text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>`;
    } else if (i - 0.5 <= rating) {
      stars += `<svg class="${sizeClass} text-yellow-400 fill-current" viewBox="0 0 20 20"><defs><linearGradient id="half-${i}"><stop offset="50%" stop-color="currentColor"/><stop offset="50%" stop-color="transparent" stop-opacity="1"/></linearGradient></defs><path fill="url(#half-${i})" d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>`;
    } else {
      stars += `<svg class="${sizeClass} text-gray-300 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/></svg>`;
    }
  }
  
  return stars;
}

