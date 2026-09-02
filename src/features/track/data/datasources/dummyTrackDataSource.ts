// Único origen de datos dummy de la feature `track` (absorbe el antiguo
// `dummyHistory.ts`). Solo testing visual — el detalle real vendrá del backend (Decodo).
//
// Reparte las 3 variantes visuales y los 4 estados del botón "Check Ahora" entre los
// 5 items para poder ver todas las caras del diseño sin selector de estado en runtime:
//   1 MLM-05 normal (baja)      · checkButton available
//   2 MLM-04 normal (sube)      · checkButton partial
//   3 MLM-03 normal (sin cambio)· checkButton reward
//   4 MLM-02 wish-price alcanzado· checkButton limit
//   5 MLM-01 no disponible
import type { TrackItemDetailDTO } from '@/features/track/data/models/TrackItemDetailDTO';

export const DUMMY_TRACK_DETAILS: TrackItemDetailDTO[] = [
  {
    url: 'https://articulo.mercadolibre.com.mx/MLM-05',
    title: 'Audífonos Inalámbricos Bluetooth 5.3 Cancelación de Ruido',
    seller: 'TechStore MX',
    image: 'https://placehold.co/400x400?text=MLM-05',
    price: '$749.00',
    change: { dir: 'down', amount: '-$150' },
    lastCheck: 'hace 2 hrs',
    nextCheck: '22 hrs',
    mode: 'Intervalo 24hrs',
    modeKind: 'interval',
    available: true,
    wishReached: false,
    checkButton: 'available',
    checks: [
      { date: 'May 30 2:00PM', price: '$749', dir: 'down' },
      { date: 'May 29 2:00PM', price: '$899', dir: 'none' },
      { date: 'May 28 2:00PM', price: '$899', dir: 'none' },
      { date: 'May 27 2:00PM', price: '$899', dir: 'up' },
      { date: 'May 26 2:00PM', price: '$799', dir: 'none' },
    ],
  },
  {
    url: 'https://articulo.mercadolibre.com.mx/MLM-04',
    title: 'Cafetera Eléctrica de Goteo 12 Tazas Programable',
    seller: 'HogarPlus',
    image: 'https://placehold.co/400x400?text=MLM-04',
    price: '$1,349.00',
    change: { dir: 'up', amount: '+$100' },
    lastCheck: 'hace 5 hrs',
    nextCheck: '19 hrs',
    mode: 'Intervalo 24hrs',
    modeKind: 'interval',
    available: true,
    wishReached: false,
    checkButton: 'partial',
    checks: [
      { date: 'Jun 01 8:00AM', price: '$1,349', dir: 'up' },
      { date: 'May 31 8:00AM', price: '$1,249', dir: 'none' },
      { date: 'May 30 8:00AM', price: '$1,249', dir: 'none' },
      { date: 'May 29 8:00AM', price: '$1,199', dir: 'down' },
    ],
  },
  {
    url: 'https://articulo.mercadolibre.com.mx/MLM-03',
    title: 'Mochila Antirrobo Impermeable con Puerto USB',
    seller: 'ViajeSeguro',
    image: 'https://placehold.co/400x400?text=MLM-03',
    price: '$549.00',
    change: { dir: 'none', amount: null },
    lastCheck: 'hace 1 hr',
    nextCheck: '23 hrs',
    mode: 'Intervalo 24hrs',
    modeKind: 'interval',
    available: true,
    wishReached: false,
    checkButton: 'reward',
    checks: [
      { date: 'May 30 3:00PM', price: '$549', dir: 'none' },
      { date: 'May 29 3:00PM', price: '$549', dir: 'none' },
      { date: 'May 28 3:00PM', price: '$549', dir: 'none' },
    ],
  },
  {
    url: 'https://articulo.mercadolibre.com.mx/MLM-02',
    title: 'Smartwatch Deportivo con Monitor de Ritmo Cardiaco',
    seller: 'FitGear',
    image: 'https://placehold.co/400x400?text=MLM-02',
    price: '$1,745.00',
    change: { dir: 'wish', amount: '¡Precio deseado alcanzado!' },
    lastCheck: 'hace 30 min',
    nextCheck: null,
    mode: 'Wish Price (alcanzado)',
    modeKind: 'wish',
    available: true,
    wishReached: true,
    checkButton: 'limit',
    checks: [
      { date: 'May 30 10:00AM', price: '$1,745', dir: 'wish' },
      { date: 'May 29 10:00AM', price: '$1,850', dir: 'none' },
      { date: 'May 28 10:00AM', price: '$1,899', dir: 'none' },
    ],
  },
  {
    url: 'https://articulo.mercadolibre.com.mx/MLM-01',
    title: 'Lámpara LED de Escritorio con Carga Inalámbrica',
    seller: 'IluminaHogar',
    image: 'https://placehold.co/400x400?text=MLM-01',
    price: '$---',
    change: { dir: 'unavailable', amount: null },
    lastCheck: 'hace 3 días',
    nextCheck: null,
    mode: 'Manual',
    modeKind: 'manual',
    available: false,
    wishReached: false,
    checkButton: 'available',
    checks: [],
  },
];

// Siembra la lista "Mis rastreos" (SearchContext): solo las URLs de los items dummy.
export const DUMMY_TRACK_HISTORY: string[] = DUMMY_TRACK_DETAILS.map((d) => d.url);
