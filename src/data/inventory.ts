export interface TrackedItem {
  id: string;
  sku: string;
  description: string;
  vehicles: string; // Compatibilidad de Vehículos (Marca, Modelo, Años y Motor)
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
    id: 'auto-001',
    sku: '04465-02220',
    description: 'Pastillas de Freno Delanteras Cerámicas',
    vehicles: 'Toyota Corolla 1.8L (2009-2019), Yaris (2012-2020), Matrix 1.8L',
    category: 'Frenos',
    categoryId: 1,
    qtyPdf: 16,
    qtyReceived: 16,
    unitPrice: 16.50,
    salePrice: 32.00,
    imageUrl: 'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
    inPdf: true,
    inExcel: true,
    inPhysical: true,
  },
  {
    id: 'auto-002',
    sku: 'GAS-55311',
    description: 'Amortiguadores Delanteros a Gas (Par)',
    vehicles: 'Chevrolet Aveo 1.6L (2005-2017), Optra 1.8L, Spark GT',
    category: 'Suspensión y Dirección',
    categoryId: 2,
    qtyPdf: 8,
    qtyReceived: 8,
    unitPrice: 46.00,
    salePrice: 85.00,
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
    inPdf: true,
    inExcel: true,
    inPhysical: true,
  },
  {
    id: 'auto-003',
    sku: 'WP-21010',
    description: 'Bomba de Agua para Motor con Empacadura',
    vehicles: 'Nissan Sentra B13 / B14 / B15 1.6L/1.8L, Tiida 1.8L (2007-2018)',
    category: 'Motor y Refrigeración',
    categoryId: 3,
    qtyPdf: 10,
    qtyReceived: 10,
    unitPrice: 21.00,
    salePrice: 42.00,
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
    inPdf: true,
    inExcel: true,
    inPhysical: true,
  },
  {
    id: 'auto-004',
    sku: 'IFR6T11-SET',
    description: 'Bujías de Iridio Laser (Pack x4 unidades)',
    vehicles: 'Honda Civic 1.8L / CR-V 2.4L / Accord 2.4L (2006-2016)',
    category: 'Encendido y Eléctrico',
    categoryId: 4,
    qtyPdf: 24,
    qtyReceived: 24,
    unitPrice: 18.00,
    salePrice: 35.00,
    imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
    inPdf: true,
    inExcel: true,
    inPhysical: true,
  },
  {
    id: 'auto-005',
    sku: 'PH-4967',
    description: 'Filtro de Aceite Sintético Blindado',
    vehicles: 'Toyota Hilux 2.7L, Fortuner, Corolla, Daihatsu Terios 1.3L/1.5L',
    category: 'Mantenimiento y Filtros',
    categoryId: 5,
    qtyPdf: 30,
    qtyReceived: 30,
    unitPrice: 4.20,
    salePrice: 9.50,
    imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
    inPdf: true,
    inExcel: true,
    inPhysical: true,
  },
  {
    id: 'auto-006',
    sku: 'TB-198K',
    description: 'Kit Correa de Distribución / Tiempo y Tensor',
    vehicles: 'Renault Logan 1.6L 16V, Sandero, Duster 1.6L/2.0L, Megane II',
    category: 'Motor y Refrigeración',
    categoryId: 3,
    qtyPdf: 12,
    qtyReceived: 12,
    unitPrice: 32.00,
    salePrice: 65.00,
    imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
    inPdf: true,
    inExcel: true,
    inPhysical: true,
  },
  {
    id: 'auto-007',
    sku: 'CLU-TY08',
    description: 'Kit de Embrague / Clutch Completo (Plato, Disco y Collarín)',
    vehicles: 'Toyota Yaris 1.3L / 1.5L (2000-2018), Etios 1.5L',
    category: 'Transmisión y Embrague',
    categoryId: 6,
    qtyPdf: 6,
    qtyReceived: 6,
    unitPrice: 72.00,
    salePrice: 135.00,
    imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
    inPdf: true,
    inExcel: true,
    inPhysical: true,
  },
  {
    id: 'auto-008',
    sku: 'DSK-8812',
    description: 'Discos de Freno Delanteros Ventilados (Par)',
    vehicles: 'Ford Fiesta 1.6L (2011-2019), Ford EcoSport 2.0L (2012-2020)',
    category: 'Frenos',
    categoryId: 1,
    qtyPdf: 10,
    qtyReceived: 10,
    unitPrice: 35.00,
    salePrice: 68.00,
    imageUrl: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80',
    status: 'ok',
    inPdf: true,
    inExcel: true,
    inPhysical: true,
  }
];

export const inventoryData: Category[] = [
  { id: 1, name: 'Frenos', items: [DEFAULT_MOCK_ITEMS[0], DEFAULT_MOCK_ITEMS[7]] },
  { id: 2, name: 'Suspensión y Dirección', items: [DEFAULT_MOCK_ITEMS[1]] },
  { id: 3, name: 'Motor y Refrigeración', items: [DEFAULT_MOCK_ITEMS[2], DEFAULT_MOCK_ITEMS[5]] },
  { id: 4, name: 'Encendido y Eléctrico', items: [DEFAULT_MOCK_ITEMS[3]] },
  { id: 5, name: 'Mantenimiento y Filtros', items: [DEFAULT_MOCK_ITEMS[4]] },
  { id: 6, name: 'Transmisión y Embrague', items: [DEFAULT_MOCK_ITEMS[6]] }
];
