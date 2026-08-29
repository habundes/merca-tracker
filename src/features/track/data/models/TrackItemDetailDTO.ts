// Forma cruda del dato dummy (DTO) + mapper DTO→entidad. Frontera de la capa data:
// cuando llegue Decodo, solo cambian datasource + este mapper, no domain/presentation.
import type {
  TrackItemDetail,
  CheckButtonState,
  PriceDirection,
} from '@/features/track/domain';

export type PriceCheckDTO = {
  date: string;
  price: string;
  dir: PriceDirection;
};

export type TrackItemDetailDTO = {
  url: string;
  title: string;
  seller: string;
  image: string;
  price: string;
  change: { dir: PriceDirection; amount: string | null };
  lastCheck: string;
  nextCheck: string | null;
  mode: string;
  modeKind: 'interval' | 'wish' | 'manual';
  available: boolean;
  wishReached: boolean;
  checkButton: CheckButtonState;
  checks: PriceCheckDTO[];
};

export function toDomain(dto: TrackItemDetailDTO): TrackItemDetail {
  return {
    url: dto.url,
    title: dto.title,
    seller: dto.seller,
    imageUrl: dto.image,
    priceLabel: dto.price,
    priceChange: { direction: dto.change.dir, amountLabel: dto.change.amount },
    lastCheckLabel: dto.lastCheck,
    nextCheckLabel: dto.nextCheck,
    mode: { kind: dto.modeKind, label: dto.mode },
    availability: dto.available ? 'available' : 'unavailable',
    wishReached: dto.wishReached,
    checkButton: dto.checkButton,
    checks: dto.checks.map((c) => ({
      dateLabel: c.date,
      priceLabel: c.price,
      direction: c.dir,
    })),
  };
}
