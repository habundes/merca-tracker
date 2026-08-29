// Caso de uso: resuelve el detalle por URL a través de la interfaz del repositorio.
import type { TrackDetailRepository } from '../repositories/TrackDetailRepository';

export const getItemDetail = (repo: TrackDetailRepository, url: string) =>
  repo.getDetailByUrl(url);
