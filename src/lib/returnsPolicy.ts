/**
 * Política de devoluciones EIPET — reglas de negocio centralizadas.
 */

import type { Timestamp as FirestoreTimestamp } from 'firebase/firestore';

export const RETURN_WINDOW_MS = 48 * 60 * 60 * 1000;

/** Motivos que aplican devolución según política oficial */
export const ELIGIBLE_RETURN_REASONS = [
  'wrong_item',
  'damaged',
  'expired',
  'company_error',
] as const;

export type EligibleReturnReason = (typeof ELIGIBLE_RETURN_REASONS)[number];

/** Mensajes exactos (toast) */
export const RETURN_TOAST = {
  submitted:
    'Tu solicitud fue enviada correctamente ✅ Estamos revisando tu caso',
  notEligible:
    'Este producto no aplica para devolución según nuestras políticas 😌',
  timeExpired:
    'El plazo de 48 horas para solicitar devolución ha finalizado ⏳',
  companyCovers:
    'Nos hacemos cargo de todo 💚 No tendrás ningún costo adicional',
  underReview:
    'Estamos evaluando tu solicitud, te responderemos pronto 🙌',
  duplicateActive:
    'Ya tienes una solicitud en curso para este producto. Te avisaremos pronto 🙌',
} as const;

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as FirestoreTimestamp).toDate === 'function') {
    return (value as FirestoreTimestamp).toDate();
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Referencia de “entrega” para el plazo de 48 h */
export function getDeliveryReferenceDate(order: {
  status?: string;
  deliveredAt?: unknown;
  updatedAt?: unknown;
  createdAt?: unknown;
}): Date | null {
  if (order.status !== 'delivered') return null;
  const fromDelivered = toDate(order.deliveredAt);
  if (fromDelivered) return fromDelivered;
  const fromUpdated = toDate(order.updatedAt);
  if (fromUpdated) return fromUpdated;
  return toDate(order.createdAt);
}

export function isReturnWindowOpen(order: {
  status?: string;
  deliveredAt?: unknown;
  updatedAt?: unknown;
  createdAt?: unknown;
}): boolean {
  const ref = getDeliveryReferenceDate(order);
  if (!ref) return false;
  return Date.now() - ref.getTime() <= RETURN_WINDOW_MS;
}

export function isEligibleReturnReason(reason: string): reason is EligibleReturnReason {
  return (ELIGIBLE_RETURN_REASONS as readonly string[]).includes(reason);
}
