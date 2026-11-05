export interface TrackedItem {
  id: string;
  sku: string;
  description: string;
  vehicles: string; // Detalles / Variantes / Especificaciones
  category: string;
  categoryId: number;
  qtyPdf: number; // Cantidad Esperada / Documentada
  qtyReceived: number | null; // Cantidad Física / Recibida (Stock inicial)
  unitPrice: number; // Costo unitario
  salePrice: number; // Precio de venta
  imageUrl?: string;
  status: 'ok' | 'missing' | 'partial' | 'pending' | 'extra';
  inPdf: boolean;
  inExcel: boolean;
  inPhysical: boolean;
}

export interface Sale {
  id: string;
  itemId: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  salePrice: number;
  totalPrice: number;
  date: string;
  customerName: string;
  customerPhone: string;
  customerId: string;
  notes: string;
  paymentPending: boolean;
}

export interface Category {
  id: number;
  name: string;
  items: TrackedItem[];
}

export const DEFAULT_MOCK_ITEMS: TrackedItem[] = [
  {
    id: 'prod-001',
    sku: 'TERMO-1L',
    description: 'Termo Deportivo 1L',
    vehicles: 'Acero inoxidable, aislamiento al vacío 24h, libre de BPA',
    category: 'Estilo de Vida',
    categoryId: 1,
    qtyPdf: 12,
    qtyReceived: 12,
    unitPrice: 8.50,
    salePrice: 15.00,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
    inPdf: true,
    inExcel: true,
    inPhysical: true,
  },
  {
    id: 'prod-002',
    sku: 'AUD-WIRELESS',
    description: 'Audífonos Wireless Pro',
    vehicles: 'Cancelación activa de ruido, Bluetooth 5.3, batería 30h',
    category: 'Electrónica',
    categoryId: 2,
    qtyPdf: 8,
    qtyReceived: 8,
    unitPrice: 26.00,
    salePrice: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
    inPdf: true,
    inExcel: true,
    inPhysical: true,
  },
  {
    id: 'prod-003',
    sku: 'MOCH-URBANA',
    description: 'Mochila Urbana Impermeable',
    vehicles: 'Compartimento para laptop 15.6", puerto USB, tejido Oxford repelente',
    category: 'Accesorios',
    categoryId: 3,
    qtyPdf: 15,
    qtyReceived: 15,
    unitPrice: 19.50,
    salePrice: 35.00,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
    inPdf: true,
    inExcel: true,
    inPhysical: true,
  },
  {
    id: 'prod-004',
    sku: 'GORRA-MIN-BLK',
    description: 'Gorra Minimalista Negra',
    vehicles: '100% algodón peinado, broche metálico ajustable, visera curva',
    category: 'Moda',
    categoryId: 4,
    qtyPdf: 10,
    qtyReceived: 10,
    unitPrice: 9.00,
    salePrice: 20.00,
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
    inPdf: true,
    inExcel: true,
    inPhysical: true,
  },
  {
    id: 'prod-005',
    sku: 'SOP-CEL-AJUST',
    description: 'Soporte Ajustable para Celular',
    vehicles: 'Aluminio reforzado, rotación 270°, base antideslizante multi-ángulo',
    category: 'Electrónica',
    categoryId: 2,
    qtyPdf: 20,
    qtyReceived: 20,
    unitPrice: 5.50,
    salePrice: 12.00,
    imageUrl: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
    inPdf: true,
    inExcel: true,
    inPhysical: true,
  }
];

export const inventoryData: Category[] = [
  { id: 1, name: 'Estilo de Vida', items: [DEFAULT_MOCK_ITEMS[0]] },
  { id: 2, name: 'Electrónica', items: [DEFAULT_MOCK_ITEMS[1], DEFAULT_MOCK_ITEMS[4]] },
  { id: 3, name: 'Accesorios', items: [DEFAULT_MOCK_ITEMS[2]] },
  { id: 4, name: 'Moda', items: [DEFAULT_MOCK_ITEMS[3]] }
];
