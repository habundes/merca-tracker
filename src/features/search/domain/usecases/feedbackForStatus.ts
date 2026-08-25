import type { SearchFeedbackType } from '../entities/feedback';
import type { SearchStatus } from '../entities/search-status';
import { MAX_TRACKED } from '../entities/tracklist';

export interface StatusFeedback {
  type: SearchFeedbackType;
  message: string;
}

// Puro. Único lugar que mapea estado de la UI → copy + tipo de feedback.
export function feedbackForStatus(status: SearchStatus): StatusFeedback {
  switch (status.kind) {
    case 'idle':
      return { type: 'hint', message: 'Las búsquedas se guardan en Rastrear' };
    case 'invalidFormat':
      return { type: 'warning', message: 'Solo URLs de Mercadolibre México.' };
    case 'duplicate':
      return { type: 'warning', message: 'Ya estás rastreando este producto.' };
    case 'full':
      return {
        type: 'warning',
        message: `Lista llena (${MAX_TRACKED}/${MAX_TRACKED}). Elimina un producto para agregar otro.`,
      };
    case 'checking':
      return { type: 'loading', message: 'Verificando producto...' };
    case 'unavailable':
      return {
        type: 'error',
        message: 'Este producto ya no está disponible en Mercadolibre.',
      };
  }
}
