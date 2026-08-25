// Capa domain de `search`: entities (constantes + tipos), usecases (puros) y
// repositories (interfaces). Sin dependencias a react-native.
export { MAX_TRACKED } from './entities/tracklist';
export type { UrlValidationResult } from './entities/url-validation';
export type { ProductCheckResult } from './entities/product-check';
export type { SearchStatus } from './entities/search-status';
export type { SearchFeedbackType } from './entities/feedback';
export type { ProductRepository } from './repositories/product-repository';
export { validateMercadoLibreUrl } from './usecases/validateMercadoLibreUrl';
export { feedbackForStatus, type StatusFeedback } from './usecases/feedbackForStatus';
