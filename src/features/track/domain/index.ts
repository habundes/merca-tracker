// Barrel de la capa domain de `track`. Sin dependencias a RN ni librerías.
// Re-exporta entidades + tipos valor, la interfaz del repositorio y el caso de uso.
export * from './entities/PriceCheck';
export * from './entities/TrackItemDetail';
export * from './repositories/TrackDetailRepository';
export * from './usecases/getItemDetail';
