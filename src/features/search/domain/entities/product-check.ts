// Resultado del chequeo de disponibilidad de un producto (backend simulado por ahora).
export type ProductCheckResult =
  | { status: 'available' }
  | { status: 'unavailable' };
