import type { ProductCheckResult } from '../entities/product-check';

// Contrato para consultar un producto por URL. La implementación real (Decodo)
// reemplazará al stub sin tocar la UI.
export interface ProductRepository {
  check(url: string): Promise<ProductCheckResult>;
}
