// Implementación dummy del repositorio: lee el datasource y mapea DTO→entidad.
import type {
  TrackDetailRepository,
  TrackItemDetail,
} from '@/features/track/domain';
import { DUMMY_TRACK_DETAILS } from '@/features/track/data/datasources/dummyTrackDataSource';
import { toDomain } from '@/features/track/data/models/TrackItemDetailDTO';

export class DummyTrackDetailRepository implements TrackDetailRepository {
  getDetailByUrl(url: string): TrackItemDetail | null {
    const dto = DUMMY_TRACK_DETAILS.find((d) => d.url === url);
    return dto ? toDomain(dto) : null;
  }
}
