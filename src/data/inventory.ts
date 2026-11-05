export interface InventoryItem {
  id: string;
  sku: string;
  description: string;
  vehicles: string;
  qtyPdf: number;
  qtyPhysical: number | null;
  unitPrice: number;
  salePrice: number;
  imageUrl: string;
  status: 'ok' | 'missing' | 'partial' | 'pending' | 'extra';
  category: string;
}

export interface Category {
  id: number;
  name: string;
  items: InventoryItem[];
}

export const mockProducts: InventoryItem[] = [
  {
    id: 'prod-001',
    sku: 'TERMO-1L',
    description: 'Termo Deportivo 1L',
    vehicles: 'Acero inoxidable, aislamiento al vacío 24h, libre de BPA',
    category: 'Estilo de Vida',
    qtyPdf: 12,
    qtyPhysical: 12,
    unitPrice: 8.50,
    salePrice: 15.00,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
  },
  {
    id: 'prod-002',
    sku: 'AUD-WIRELESS',
    description: 'Audífonos Wireless Pro',
    vehicles: 'Cancelación activa de ruido, Bluetooth 5.3, batería 30h',
    category: 'Electrónica',
    qtyPdf: 8,
    qtyPhysical: 8,
    unitPrice: 26.00,
    salePrice: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
  },
  {
    id: 'prod-003',
    sku: 'MOCH-URBANA',
    description: 'Mochila Urbana Impermeable',
    vehicles: 'Compartimento para laptop 15.6", puerto USB, tejido Oxford',
    category: 'Accesorios',
    qtyPdf: 15,
    qtyPhysical: 15,
    unitPrice: 19.50,
    salePrice: 35.00,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
  },
  {
    id: 'prod-004',
    sku: 'GORRA-MIN-BLK',
    description: 'Gorra Minimalista Negra',
    vehicles: '100% algodón peinado, broche metálico ajustable, visera curva',
    category: 'Moda',
    qtyPdf: 10,
    qtyPhysical: 10,
    unitPrice: 9.00,
    salePrice: 20.00,
    imageUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
  },
  {
    id: 'prod-005',
    sku: 'SOP-CEL-AJUST',
    description: 'Soporte Ajustable para Celular',
    vehicles: 'Aluminio reforzado, rotación 270°, base antideslizante',
    category: 'Electrónica',
    qtyPdf: 20,
    qtyPhysical: 20,
    unitPrice: 5.50,
    salePrice: 12.00,
    imageUrl: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
  }
];

export const inventoryData: Category[] = [
  {
    id: 1,
    name: 'Estilo de Vida',
    items: [mockProducts[0]]
  },
  {
    id: 2,
    name: 'Electrónica',
    items: [mockProducts[1], mockProducts[4]]
  },
  {
    id: 3,
    name: 'Accesorios',
    items: [mockProducts[2]]
  },
  {
    id: 4,
    name: 'Moda',
    items: [mockProducts[3]]
  }
];
