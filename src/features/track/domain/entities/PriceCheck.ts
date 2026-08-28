// Entrada del historial de checks de precio. Solo tipos (sin deps a RN).

export type PriceDirection = 'down' | 'up' | 'none' | 'wish' | 'unavailable';

export type PriceCheck = {
  dateLabel: string; // "May 30 2:00PM"
  priceLabel: string; // "$749"
  direction: PriceDirection;
};
