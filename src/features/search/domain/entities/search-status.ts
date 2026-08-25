// Estado único de la UI de Buscar. Unión discriminada por `kind`.
export type SearchStatus =
  | { kind: 'idle' }
  | { kind: 'invalidFormat' }
  | { kind: 'duplicate' }
  | { kind: 'full' }
  | { kind: 'checking' }
  | { kind: 'unavailable' };
