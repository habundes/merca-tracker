import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSearch } from '@/shared/context/SearchContext';
import {
  validateMercadoLibreUrl,
  type ProductRepository,
  type SearchStatus,
} from '@/features/search/domain';
import { fakeProductRepository } from '@/features/search/data/checkProductFake';

export interface UseProductSearch {
  value: string;
  status: SearchStatus;
  disabled: boolean;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onSubmit: () => void;
}

// Orquesta la UI de Buscar: valida formato, duplicado y tope de lista, dispara
// el chequeo de backend (simulado) y navega a Rastrear en el caso disponible.
// `repo` es inyectable para tests.
export function useProductSearch(
  repo: ProductRepository = fakeProductRepository,
): UseProductSearch {
  const { history, isFull, addSearch, setLastAdded } = useSearch();
  const router = useRouter();

  const [value, setValue] = useState('');
  const [status, setStatus] = useState<SearchStatus>({ kind: 'idle' });

  // `full` es reactivo a la lista y domina sobre el status event-driven.
  const effectiveStatus: SearchStatus = isFull ? { kind: 'full' } : status;
  const disabled =
    effectiveStatus.kind === 'checking' || effectiveStatus.kind === 'full';

  const onChangeText = useCallback((text: string) => {
    setValue(text);
    // Los mensajes de validación/error persisten hasta que cambia el texto.
    setStatus({ kind: 'idle' });
  }, []);

  const onClear = useCallback(() => {
    setValue('');
    setStatus({ kind: 'idle' });
  }, []);

  const onSubmit = useCallback(() => {
    // No re-entrar durante un chequeo en curso ni con la lista llena.
    if (status.kind === 'checking' || isFull) return;

    const trimmed = value.trim();
    if (!trimmed) {
      setStatus({ kind: 'idle' });
      return;
    }

    if (!validateMercadoLibreUrl(trimmed).ok) {
      setStatus({ kind: 'invalidFormat' });
      return;
    }

    if (history.includes(trimmed)) {
      setStatus({ kind: 'duplicate' });
      return;
    }

    setStatus({ kind: 'checking' });
    void repo.check(trimmed).then(result => {
      if (result.status === 'unavailable') {
        setStatus({ kind: 'unavailable' });
        return;
      }
      addSearch(trimmed);
      setLastAdded(trimmed);
      setValue('');
      setStatus({ kind: 'idle' });
      router.push('/track');
    });
  }, [status.kind, isFull, value, history, repo, addSearch, setLastAdded, router]);

  // Limpia el status al salir de la vista (perder foco de la pantalla).
  useFocusEffect(
    useCallback(() => {
      return () => setStatus({ kind: 'idle' });
    }, []),
  );

  return { value, status: effectiveStatus, disabled, onChangeText, onClear, onSubmit };
}
