import type { ProductCheckResult } from '../domain/entities/product-check';
import type { ProductRepository } from '../domain/repositories/product-repository';

// Stub del backend (Decodo real fuera de scope). Simula latencia de red y
// decide disponibilidad por convención: URL terminada en `MLM-0` → no disponible.
const FAKE_DELAY_MS = 1200;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const fakeProductRepository: ProductRepository = {
  async check(url: string): Promise<ProductCheckResult> {
    await delay(FAKE_DELAY_MS);
    if (url.endsWith('MLM-0')) {
      return { status: 'unavailable' };
    }
    return { status: 'available' };
  },
};
