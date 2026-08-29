// Cablea usecase + repo dummy y expone la entidad de domain a la pantalla.
// La presentación solo conoce `TrackItemDetail`; nunca el datasource ni el DTO.
import { useMemo } from 'react';
import { getItemDetail, type TrackItemDetail } from '@/features/track/domain';
import { DummyTrackDetailRepository } from '@/features/track/data/repositories/DummyTrackDetailRepository';

export function useItemDetail(url: string | null): TrackItemDetail | null {
  return useMemo(() => {
    if (!url) return null;
    const repo = new DummyTrackDetailRepository();
    return getItemDetail(repo, url);
  }, [url]);
}
