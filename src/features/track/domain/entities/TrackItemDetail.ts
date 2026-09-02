// Entidad del detalle de un rastreo. Solo tipos (sin deps a RN).
import type { PriceCheck, PriceDirection } from './PriceCheck';

export type TrackMode = { kind: 'interval' | 'wish' | 'manual'; label: string };
// label: "Intervalo 24hrs" | "Wish Price (alcanzado)" | "Manual"

export type CheckButtonState = 'available' | 'partial' | 'reward' | 'limit';
// [Check Ahora] | [Check Ahora (1/2)] | [Ver ad → +1 check] | [Límite alcanzado ⏰]

export type Availability = 'available' | 'unavailable';

export type PriceChange = {
  direction: PriceDirection;
  amountLabel: string | null; // "-$150" | "+$200" | null (sin cambio / no disp.)
};

export type TrackItemDetail = {
  url: string;
  title: string;
  seller: string;
  imageUrl: string;
  priceLabel: string; // "$749"  ("$---" si no disponible)
  priceChange: PriceChange;
  lastCheckLabel: string; // "hace 2 hrs"
  nextCheckLabel: string | null; // "22 hrs" (null si manual / no disponible)
  mode: TrackMode;
  availability: Availability;
  wishReached: boolean;
  checkButton: CheckButtonState;
  checks: PriceCheck[]; // máx 5 (free)
};
