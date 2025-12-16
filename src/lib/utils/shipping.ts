/**
 * Utilidades para calcular costos de envío
 */

/**
 * Calcular el costo de envío basado en el subtotal y la dirección
 * @param subtotal - Subtotal de la orden
 * @param address - Dirección de envío (opcional)
 * @returns Costo de envío en Bs.
 */
export function calculateShipping(subtotal: number, address?: any): number {
  // Envío gratis para órdenes sobre Bs. 100
  if (subtotal >= 100) {
    return 0;
  }

  // Costo base de envío
  let shipping = 15;

  // Costo adicional basado en ciudad/distrito
  if (address) {
    const city = (address.city || '').toLowerCase();
    if (city.includes('la paz') || city.includes('el alto')) {
      shipping = 10; // Costo menor para ciudades principales
    } else if (city.includes('cochabamba') || city.includes('santa cruz')) {
      shipping = 12;
    } else {
      shipping = 20; // Costo mayor para otras ciudades
    }
  }

  return shipping;
}

