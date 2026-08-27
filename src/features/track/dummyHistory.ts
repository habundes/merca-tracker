// Datos dummy solo para testing visual — poblar "Mis rastreos" y su detalle sin backend real.
export type DummyTrackItem = {
  url: string;
  title: string;
  image: string;
  seller: string;
  price: string;
};

export const DUMMY_TRACK_ITEMS: DummyTrackItem[] = [
  {
    url: 'https://articulo.mercadolibre.com.mx/MLM-05',
    title: 'Audífonos Inalámbricos Bluetooth 5.3 Cancelación de Ruido',
    image: 'https://placehold.co/400x400?text=MLM-05',
    seller: 'TechStore MX',
    price: '$899.00',
  },
  {
    url: 'https://articulo.mercadolibre.com.mx/MLM-04',
    title: 'Cafetera Eléctrica de Goteo 12 Tazas Programable',
    image: 'https://placehold.co/400x400?text=MLM-04',
    seller: 'HogarPlus',
    price: '$1,249.00',
  },
  {
    url: 'https://articulo.mercadolibre.com.mx/MLM-03',
    title: 'Mochila Antirrobo Impermeable con Puerto USB',
    image: 'https://placehold.co/400x400?text=MLM-03',
    seller: 'ViajeSeguro',
    price: '$549.00',
  },
  {
    url: 'https://articulo.mercadolibre.com.mx/MLM-02',
    title: 'Smartwatch Deportivo con Monitor de Ritmo Cardiaco',
    image: 'https://placehold.co/400x400?text=MLM-02',
    seller: 'FitGear',
    price: '$1,899.00',
  },
  {
    url: 'https://articulo.mercadolibre.com.mx/MLM-01',
    title: 'Lámpara LED de Escritorio con Carga Inalámbrica',
    image: 'https://placehold.co/400x400?text=MLM-01',
    seller: 'IluminaHogar',
    price: '$399.00',
  },
];

export const DUMMY_TRACK_HISTORY: string[] = DUMMY_TRACK_ITEMS.map(item => item.url);
