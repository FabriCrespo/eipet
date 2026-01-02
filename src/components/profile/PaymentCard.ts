/**
 * Función helper para renderizar una tarjeta de método de pago
 * Esta función replica exactamente la estructura del componente PaymentCard.astro
 * para poder usarla en renderizado dinámico client-side
 * 
 * NOTA: Este archivo debe ser compilado a JavaScript para ser usado en el navegador
 * o importado como módulo ES6
 */

export interface PaymentCardData {
  id: string;
  type: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  brand: string;
  bank: string;
  isDefault: boolean;
}

export function renderPaymentCard(method: PaymentCardData): string {
  // Colores profesionales y elegantes según la marca
  const brandConfig = method.brand === 'Visa' 
    ? {
        gradient: 'from-slate-800 via-slate-900 to-slate-950',
        accent: 'from-blue-600 to-blue-700',
        chip: 'bg-gradient-to-br from-amber-400 to-amber-500',
        logoBg: 'bg-blue-600'
      }
    : {
        gradient: 'from-gray-900 via-gray-950 to-black',
        accent: 'from-red-600 to-orange-600',
        chip: 'bg-gradient-to-br from-red-400 to-orange-500',
        logoBg: 'bg-red-600'
      };

  // Función helper para escapar HTML y prevenir XSS
  const escapeHtml = (text: any) => {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  };

  return `
    <div class="group relative bg-linear-to-br ${brandConfig.gradient} rounded-2xl overflow-hidden shadow-2xl border border-gray-800/50 hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:border-gray-700/70" data-method-id="${escapeHtml(method.id)}">
      <!-- Patrón de fondo sutil -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"></div>
      </div>
      
      <!-- Efecto de brillo sutil -->
      <div class="absolute top-0 left-0 w-full h-1/2 bg-linear-to-b from-white/5 to-transparent"></div>
      
      <!-- Contenido principal -->
      <div class="relative z-10 p-5">
        <!-- Header con chip, logo y badge -->
        <div class="flex items-start justify-between mb-5">
          <!-- Chip de tarjeta -->
          <div class="relative">
            <div class="${brandConfig.chip} w-11 h-9 rounded-md shadow-lg flex items-center justify-center border border-white/20">
              <div class="w-7 h-5 bg-linear-to-br from-white/30 to-transparent rounded-sm"></div>
            </div>
          </div>
          
          <!-- Logo de la marca y Badge Predeterminada (lado derecho) -->
          <div class="flex flex-col items-end gap-2">
            <!-- Badge Predeterminada (arriba del logo) -->
            ${method.isDefault ? `
              <span class="inline-flex items-center gap-1 bg-linear-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md border border-amber-400/40 uppercase tracking-wider">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                Predeterminada
              </span>
            ` : ''}
            
            <!-- Logo de la marca -->
            <div class="flex flex-col items-end gap-0.5">
              <div class="${brandConfig.logoBg} px-3 py-1.5 rounded-lg shadow-md">
                <p class="text-white font-bold text-sm tracking-wide">${escapeHtml(method.brand)}</p>
              </div>
              ${method.bank ? `<p class="text-gray-400 text-[10px] font-medium leading-tight">${escapeHtml(method.bank)}</p>` : ''}
            </div>
          </div>
        </div>
        
        <!-- Número de tarjeta -->
        <div class="mb-5">
          <p class="text-gray-400 text-[10px] font-medium mb-1.5 tracking-wider uppercase">Número de Tarjeta</p>
          <p class="text-white text-xl font-mono tracking-[0.15em] font-semibold">${escapeHtml(method.cardNumber)}</p>
        </div>
        
        <!-- Información inferior -->
        <div class="flex items-end justify-between mb-4">
          <div class="flex-1">
            <p class="text-gray-400 text-[10px] font-medium mb-1 tracking-wider uppercase">Titular</p>
            <p class="text-white text-sm font-semibold tracking-wide truncate">${escapeHtml(method.cardHolder)}</p>
          </div>
          <div class="text-right ml-3">
            <p class="text-gray-400 text-[10px] font-medium mb-1 tracking-wider uppercase">Válida Hasta</p>
            <p class="text-white text-sm font-semibold tracking-wide">${escapeHtml(method.expiryDate)}</p>
          </div>
        </div>
        
        <!-- Botones de acción -->
        <div class="flex items-center gap-2 pt-3.5 border-t border-gray-700/50">
          ${!method.isDefault ? `
            <button type="button" class="set-default-btn flex-1 px-3 py-2 bg-linear-to-r ${brandConfig.accent} text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 text-xs font-semibold border border-white/20" data-id="${escapeHtml(method.id)}">
              Establecer Predeterminada
            </button>
          ` : ''}
          <button type="button" class="edit-btn px-3 py-2 bg-gray-800/80 hover:bg-gray-700 text-white rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-gray-700/50 shadow-md" data-id="${escapeHtml(method.id)}" title="Editar">
            <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button type="button" class="delete-btn px-3 py-2 bg-red-900/80 hover:bg-red-800 text-white rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 border border-red-800/50 shadow-md" data-id="${escapeHtml(method.id)}" title="Eliminar">
            <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Borde decorativo inferior -->
      <div class="absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r ${brandConfig.accent}"></div>
    </div>
  `;
}
