// Resultado de validar el formato de una URL de Mercado Libre México.
export type UrlValidationResult =
  | { ok: true }
  | { ok: false; reason: 'invalidFormat' };
