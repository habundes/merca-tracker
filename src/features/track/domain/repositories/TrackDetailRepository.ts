// Interfaz del repositorio de detalle. Domain no conoce la implementación (data).
import type { TrackItemDetail } from '@/features/track/domain';

export interface TrackDetailRepository {
  getDetailByUrl(url: string): TrackItemDetail | null;
}
