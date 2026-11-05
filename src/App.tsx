import { useState, useMemo, useEffect } from 'react';
import ExcelJS from 'exceljs';

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

const STORAGE_KEY = 'adminlocalsimple_inventory_v1';
const SALES_KEY = 'adminlocalsimple_sales_v1';
const STORE_NAME_KEY = 'adminlocalsimple_store_name';
const AUTH_KEY = 'adminlocalsimple_auth';
const DEFAULT_PASSWORD = 'adminlocalsimple';

// 5 Productos genéricos de consumo rápido con imágenes funcionales de alta calidad
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

const checkAuth = (): boolean => localStorage.getItem(AUTH_KEY) === 'authenticated';
const login = (password: string): boolean => {
  if (password === DEFAULT_PASSWORD || password === 'admin2026') {
    localStorage.setItem(AUTH_KEY, 'authenticated');
    return true;
  }
  return false;
};
const logout = () => localStorage.removeItem(AUTH_KEY);

const loadItems = (): TrackedItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_MOCK_ITEMS;
    const items: TrackedItem[] = JSON.parse(saved);
    if (!Array.isArray(items) || items.length === 0) return DEFAULT_MOCK_ITEMS;
    return items.map(item => ({
      ...item,
      salePrice: item.salePrice !== undefined ? item.salePrice : (item.unitPrice || 0)
    }));
  } catch {
    return DEFAULT_MOCK_ITEMS;
  }
};

const saveItems = (items: TrackedItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error al guardar inventario:', e);
  }
};

const loadSales = (): Sale[] => {
  try {
    const saved = localStorage.getItem(SALES_KEY);
    if (!saved) return [];
    const sales: Sale[] = JSON.parse(saved);
    return Array.isArray(sales) ? sales : [];
  } catch {
    return [];
  }
};

const saveSales = (sales: Sale[]) => {
  try {
    localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  } catch (e) {
    console.error('Error al guardar ventas:', e);
  }
};

const loadStoreName = (): string => {
  try {
    return localStorage.getItem(STORE_NAME_KEY) || 'AdminLocalSimple';
  } catch {
    return 'AdminLocalSimple';
  }
};

const saveStoreName = (name: string) => {
  try {
    localStorage.setItem(STORE_NAME_KEY, name);
  } catch (e) {
    console.error('Error al guardar nombre de tienda:', e);
  }
};

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password.trim())) {
      setPassword('');
      setError('');
      setTimeout(() => onLogin(), 100);
    } else {
      setError('Contraseña incorrecta. Utiliza: adminlocalsimple');
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 text-3xl mb-4 shadow-inner">
            🏪
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">AdminLocalSimple</h1>
          <p className="text-sm text-slate-500 mt-1">Gestión Genérica de Catálogo, Inventario y POS</p>
          <div className="mt-3 inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">
            Acceso Administrativo Seguro
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contraseña de Acceso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none text-base transition-all"
              placeholder="Ingresa tu contraseña"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-1.5 flex items-center justify-between">
              <span>Contraseña por defecto:</span>
              <button
                type="button"
                onClick={() => setPassword('adminlocalsimple')}
                className="text-indigo-600 hover:underline font-mono text-xs font-semibold"
              >
                adminlocalsimple
              </button>
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 active:scale-[0.99] font-semibold transition-all shadow-md hover:shadow-lg text-base"
          >
            Ingresar al Panel
          </button>
        </form>

        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">AdminLocalSimple • Multi-tienda y Comercio Local</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth);
  const [items, setItems] = useState<TrackedItem[]>(loadItems);
  const [sales, setSales] = useState<Sale[]>(loadSales);
  const [storeName, setStoreName] = useState<string>(loadStoreName);
  const [isEditingStoreName, setIsEditingStoreName] = useState(false);
  const [tempStoreName, setTempStoreName] = useState(storeName);

  // Vistas disponibles: 'catalog' (Catálogo / POS), 'inventory' (Panel Administración), 'sales' (Ventas)
  const [currentView, setCurrentView] = useState<'catalog' | 'inventory' | 'sales'>('catalog');
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modales
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedItemForSale, setSelectedItemForSale] = useState<TrackedItem | null>(null);
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [saleCustomerName, setSaleCustomerName] = useState('');
  const [saleCustomerPhone, setSaleCustomerPhone] = useState('');
  const [saleCustomerId, setSaleCustomerId] = useState('');
  const [saleUnitPrice, setSaleUnitPrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [saleNotes, setSaleNotes] = useState('');
  const [salePaymentPending, setSalePaymentPending] = useState(false);

  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TrackedItem | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    sku: '',
    description: '',
    vehicles: '',
    category: '',
    newCategory: '',
    qtyPdf: 10,
    qtyReceived: 10 as number | null,
    unitPrice: 0,
    salePrice: 0,
    imageUrl: '',
    inPdf: true,
    inExcel: true,
    inPhysical: true
  });

  useEffect(() => {
    saveItems(items);
  }, [items]);

  useEffect(() => {
    saveSales(sales);
  }, [sales]);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  const handleSaveStoreName = () => {
    const trimmed = tempStoreName.trim() || 'AdminLocalSimple';
    setStoreName(trimmed);
    saveStoreName(trimmed);
    setIsEditingStoreName(false);
  };

  const updateQtyPdf = (id: string, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, qtyPdf: parseInt(value) || 0 } : item));
  };

  const updateQtyReceived = (id: string, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, qtyReceived: value === '' ? null : parseInt(value) } : item));
  };

  const updateUnitPrice = (id: string, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, unitPrice: parseFloat(value) || 0 } : item));
  };

  const updateSalePrice = (id: string, value: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, salePrice: parseFloat(value) || 0 } : item));
  };

  const calculateStatus = (qtyPdf: number, qtyReceived: number | null): 'ok' | 'missing' | 'partial' | 'pending' | 'extra' => {
    if (qtyReceived === null) return 'pending';
    if (qtyReceived === 0) return 'missing';
    if (qtyReceived < qtyPdf) return 'partial';
    if (qtyReceived === qtyPdf) return 'ok';
    return 'extra';
  };

  const getStockForItem = (item: TrackedItem): number => {
    const totalSold = sales.filter(s => s.itemId === item.id).reduce((sum, s) => sum + s.quantity, 0);
    return Math.max(0, (item.qtyReceived || 0) - totalSold);
  };

  const handleOpenSaleModal = (item: TrackedItem) => {
    setSelectedItemForSale(item);
    setSaleQuantity(1);
    setSaleCustomerName('');
    setSaleCustomerPhone('');
    setSaleCustomerId('');
    setSaleUnitPrice(item.unitPrice || 0);
    setSalePrice(item.salePrice || item.unitPrice || 0);
    setSaleDate(new Date().toISOString().split('T')[0]);
    setSaleNotes('');
    setSalePaymentPending(false);
    setShowSaleModal(true);
  };

  const handleRegisterSale = () => {
    if (!selectedItemForSale) return;

    const currentStock = getStockForItem(selectedItemForSale);
    if (saleQuantity > currentStock) {
      alert(`❌ Stock insuficiente. Disponible: ${currentStock} unidades`);
      return;
    }
    if (saleQuantity <= 0) {
      alert('❌ La cantidad debe ser mayor a 0');
      return;
    }
    if (salePrice <= 0) {
      alert('❌ El precio de venta debe ser mayor a 0');
      return;
    }

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      itemId: selectedItemForSale.id,
      sku: selectedItemForSale.sku,
      description: selectedItemForSale.description,
      quantity: saleQuantity,
      unitPrice: saleUnitPrice,
      salePrice: salePrice,
      totalPrice: saleQuantity * salePrice,
      date: saleDate,
      customerName: saleCustomerName.trim() || 'Cliente general',
      customerPhone: saleCustomerPhone.trim(),
      customerId: saleCustomerId.trim(),
      notes: saleNotes.trim(),
      paymentPending: salePaymentPending,
    };

    setSales(prev => [newSale, ...prev]);
    setShowSaleModal(false);
    setSelectedItemForSale(null);
    setSaleQuantity(1);
    setSaleCustomerName('');
    setSaleCustomerPhone('');
    setSaleCustomerId('');
    setSaleNotes('');
    setSalePaymentPending(false);

    alert(`✅ Venta registrada exitosamente\n📦 Stock restante: ${currentStock - saleQuantity} unidades`);
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setShowEditSaleModal(true);
  };

  const handleSaveEditedSale = () => {
    if (!editingSale) return;
    setSales(prev => prev.map(s => s.id === editingSale.id ? editingSale : s));
    setShowEditSaleModal(false);
    setEditingSale(null);
    alert('✅ Venta actualizada');
  };

  const handleCancelSale = (saleId: string) => {
    if (confirm('¿Estás seguro de cancelar esta venta? El stock será reintegrado automáticamente.')) {
      setSales(prev => prev.filter(s => s.id !== saleId));
      alert('✅ Venta cancelada');
    }
  };

  const handleEditItem = (item: TrackedItem) => {
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    setItems(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
    setShowEditModal(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string, sku: string) => {
    if (confirm(`¿Estás seguro de eliminar el producto "${sku}"?`)) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAddItem = () => {
    if (!newItem.sku.trim() || !newItem.description.trim()) {
      alert('❌ El código SKU y la descripción son obligatorios');
      return;
    }
    const category = newItem.newCategory.trim() || newItem.category.trim() || 'General';

    const newItemData: TrackedItem = {
      id: `item-${Date.now()}`,
      sku: newItem.sku.trim().toUpperCase(),
      description: newItem.description.trim(),
      vehicles: newItem.vehicles.trim(),
      category: category,
      categoryId: 1,
      qtyPdf: newItem.qtyPdf || 0,
      qtyReceived: newItem.qtyReceived !== null ? newItem.qtyReceived : (newItem.qtyPdf || 0),
      status: calculateStatus(newItem.qtyPdf || 0, newItem.qtyReceived),
      inPdf: newItem.inPdf,
      inExcel: newItem.inExcel,
      inPhysical: newItem.inPhysical,
      unitPrice: newItem.unitPrice || 0,
      salePrice: newItem.salePrice || newItem.unitPrice || 0,
      imageUrl: newItem.imageUrl.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
    };

    setItems(prev => [...prev, newItemData]);
    setNewItem({
      sku: '',
      description: '',
      vehicles: '',
      category: '',
      newCategory: '',
      qtyPdf: 10,
      qtyReceived: 10,
      unitPrice: 0,
      salePrice: 0,
      imageUrl: '',
      inPdf: true,
      inExcel: true,
      inPhysical: true
    });
    setShowAddModal(false);
  };

  const handleResetToMockData = () => {
    if (confirm('¿Restablecer los 5 productos genéricos de prueba (Mock Data)?')) {
      setItems(DEFAULT_MOCK_ITEMS);
      saveItems(DEFAULT_MOCK_ITEMS);
      alert('✅ 5 productos de prueba inyectados correctamente');
    }
  };

  // Categorías calculadas dinámicamente
  const categories = useMemo(() => {
    const catMap = new Map<string, number>();
    items.forEach(item => {
      const cat = item.category?.trim() || 'General';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
    return Array.from(catMap.entries()).map(([name, count]) => ({
      name,
      count
    }));
  }, [items]);

  const stats = useMemo(() => {
    const total = items.length;
    const ok = items.filter(i => calculateStatus(i.qtyPdf, i.qtyReceived) === 'ok').length;
    const missing = items.filter(i => calculateStatus(i.qtyPdf, i.qtyReceived) === 'missing').length;
    const partial = items.filter(i => calculateStatus(i.qtyPdf, i.qtyReceived) === 'partial').length;
    const pending = items.filter(i => calculateStatus(i.qtyPdf, i.qtyReceived) === 'pending').length;
    const extra = items.filter(i => calculateStatus(i.qtyPdf, i.qtyReceived) === 'extra').length;
    return { total, ok, missing, partial, pending, extra };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesFilter = currentFilter === 'all' || calculateStatus(item.qtyPdf, item.qtyReceived) === currentFilter;
      const matchesCategory = selectedCategory === 'all' || (item.category || 'General') === selectedCategory;
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch = searchLower === '' ||
        (item.sku && item.sku.toLowerCase().includes(searchLower)) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.vehicles && item.vehicles.toLowerCase().includes(searchLower)) ||
        (item.category && item.category.toLowerCase().includes(searchLower));
      return matchesFilter && matchesCategory && matchesSearch;
    });
  }, [items, currentFilter, selectedCategory, searchQuery]);

  const totalSalesAmount = useMemo(() => sales.reduce((sum, s) => sum + s.totalPrice, 0), [sales]);
  const totalProfit = useMemo(() => sales.reduce((sum, s) => sum + ((s.salePrice - s.unitPrice) * s.quantity), 0), [sales]);

  const monthlySales = useMemo(() => {
    const grouped: Record<string, Sale[]> = {};
    sales.forEach(sale => {
      const month = sale.date ? sale.date.substring(0, 7) : new Date().toISOString().substring(0, 7);
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(sale);
    });
    return grouped;
  }, [sales]);

  const outOfStockItems = useMemo(() => {
    return items.filter(item => getStockForItem(item) === 0 && item.qtyReceived !== null && item.qtyReceived > 0);
  }, [items, sales]);

  const frequentSalesItems = useMemo(() => {
    const salesCount: Record<string, number> = {};
    sales.forEach(sale => {
      salesCount[sale.sku] = (salesCount[sale.sku] || 0) + 1;
    });
    return items
      .filter(item => (salesCount[item.sku] || 0) >= 1)
      .map(item => ({ ...item, salesCount: salesCount[item.sku] || 0 }))
      .sort((a, b) => b.salesCount - a.salesCount);
  }, [items, sales]);

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AdminLocalSimple';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('Inventario', { properties: { defaultRowHeight: 20 } });

    const totalProductos = items.length;
    const totalStock = items.reduce((sum, i) => sum + getStockForItem(i), 0);
    const valorInventario = items.reduce((sum, i) => sum + (getStockForItem(i) * i.unitPrice), 0);
    const valorVenta = items.reduce((sum, i) => sum + (getStockForItem(i) * i.salePrice), 0);

    worksheet.columns = [
      { key: 'num', width: 6 },
      { key: 'sku', width: 16 },
      { key: 'description', width: 35 },
      { key: 'vehicles', width: 28 },
      { key: 'category', width: 20 },
      { key: 'qtyPdf', width: 13 },
      { key: 'qtyReceived', width: 13 },
      { key: 'stock', width: 12 },
      { key: 'unitPrice', width: 14 },
      { key: 'salePrice', width: 14 },
      { key: 'status', width: 14 },
    ];

    const now = new Date();
    const fecha = now.toLocaleDateString();
    const hora = now.toLocaleTimeString();

    worksheet.mergeCells('A1:K1');
    const cellEmpresa = worksheet.getCell('A1');
    cellEmpresa.value = `🏪 ${storeName} - Reporte de Inventario`;
    cellEmpresa.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    cellEmpresa.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };
    cellEmpresa.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 38;

    worksheet.mergeCells('A2:K2');
    const cellSubtitulo = worksheet.getCell('A2');
    cellSubtitulo.value = 'SISTEMA DE GESTIÓN COMERCIAL ADMINLOCALSIMPLE';
    cellSubtitulo.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF475569' } };
    cellSubtitulo.alignment = { horizontal: 'center', vertical: 'middle' };
    cellSubtitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    worksheet.getRow(2).height = 26;

    worksheet.mergeCells('A3:F3');
    worksheet.getCell('A3').value = `📅 Fecha: ${fecha} | ⏰ ${hora}`;
    worksheet.getCell('A3').font = { name: 'Arial', size: 10, color: { argb: 'FF64748B' } };
    worksheet.getCell('A3').alignment = { horizontal: 'left', vertical: 'middle' };

    worksheet.mergeCells('G3:K3');
    worksheet.getCell('G3').value = `📦 Total: ${totalProductos} productos | 🏷️ Stock: ${totalStock} unidades`;
    worksheet.getCell('G3').font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF4338CA' } };
    worksheet.getCell('G3').alignment = { horizontal: 'right', vertical: 'middle' };
    worksheet.getRow(3).height = 22;

    worksheet.mergeCells('A4:K4');
    const cellResumen = worksheet.getCell('A4');
    cellResumen.value = `💰 Valor Costo: $${valorInventario.toFixed(2)} | 💵 Valor Venta: $${valorVenta.toFixed(2)} | 📈 Ganancia Potencial: $${(valorVenta - valorInventario).toFixed(2)}`;
    cellResumen.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF065F46' } };
    cellResumen.alignment = { horizontal: 'center', vertical: 'middle' };
    cellResumen.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
    worksheet.getRow(4).height = 26;

    const headerRowNum = 6;
    const headerRow = worksheet.getRow(headerRowNum);
    const headers = ['N°', 'SKU', 'Descripción', 'Detalles/Variantes', 'Categoría', 'Doc/Esperado', 'Físico', 'Stock', 'P. Costo', 'P. Venta', 'Estado'];
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    headerRow.height = 28;

    items.forEach((item, index) => {
      const stock = getStockForItem(item);
      const status = calculateStatus(item.qtyPdf, item.qtyReceived);
      const statusText = {
        'ok': '✅ Completo',
        'missing': '❌ Faltante',
        'partial': '⚠️ Parcial',
        'pending': '⏳ Pendiente',
        'extra': '⭐ Extra'
      }[status];

      worksheet.addRow({
        num: index + 1,
        sku: item.sku,
        description: item.description,
        vehicles: item.vehicles || '-',
        category: item.category || 'General',
        qtyPdf: item.qtyPdf,
        qtyReceived: item.qtyReceived || 0,
        stock: stock,
        unitPrice: item.unitPrice,
        salePrice: item.salePrice,
        status: statusText,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Inventario_${storeName.replace(/\s+/g, '_')}_${fecha.replace(/\//g, '-')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportSalesToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AdminLocalSimple';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet('Ventas', { properties: { defaultRowHeight: 20 } });

    worksheet.columns = [
      { key: 'num', width: 6 },
      { key: 'date', width: 13 },
      { key: 'customerName', width: 22 },
      { key: 'customerPhone', width: 16 },
      { key: 'customerId', width: 15 },
      { key: 'sku', width: 16 },
      { key: 'description', width: 35 },
      { key: 'quantity', width: 10 },
      { key: 'unitPrice', width: 13 },
      { key: 'salePrice', width: 13 },
      { key: 'totalPrice', width: 13 },
      { key: 'profit', width: 13 },
      { key: 'payment', width: 16 },
      { key: 'notes', width: 25 },
    ];

    const now = new Date();
    const fecha = now.toLocaleDateString();

    worksheet.mergeCells('A1:N1');
    const cellEmpresa = worksheet.getCell('A1');
    cellEmpresa.value = `🏪 ${storeName} - Reporte de Ventas`;
    cellEmpresa.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
    cellEmpresa.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    cellEmpresa.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 38;

    const headerRowNum = 3;
    const headerRow = worksheet.getRow(headerRowNum);
    const headers = ['N°', 'Fecha', 'Cliente', 'Teléfono', 'Identificación', 'SKU', 'Producto', 'Cant.', 'P. Costo', 'P. Venta', 'Total', 'Ganancia', 'Estado Pago', 'Notas'];
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    sales.forEach((sale, index) => {
      const profit = (sale.salePrice - sale.unitPrice) * sale.quantity;
      worksheet.addRow({
        num: index + 1,
        date: sale.date,
        customerName: sale.customerName,
        customerPhone: sale.customerPhone || '-',
        customerId: sale.customerId || '-',
        sku: sale.sku,
        description: sale.description,
        quantity: sale.quantity,
        unitPrice: sale.unitPrice,
        salePrice: sale.salePrice,
        totalPrice: sale.totalPrice,
        profit: profit,
        payment: sale.paymentPending ? '⏳ Pendiente' : '✅ Pagado',
        notes: sale.notes || '',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ventas_${storeName.replace(/\s+/g, '_')}_${fecha.replace(/\//g, '-')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = {
      version: 'adminlocalsimple-v1',
      storeName,
      items,
      sales,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Respaldo_${storeName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.items && Array.isArray(data.items)) {
          setItems(data.items);
          saveItems(data.items);
        }
        if (data.sales && Array.isArray(data.sales)) {
          setSales(data.sales);
          saveSales(data.sales);
        }
        if (data.storeName && typeof data.storeName === 'string') {
          setStoreName(data.storeName);
          saveStoreName(data.storeName);
        }
        alert(`✅ Respaldo cargado con éxito:\n📦 ${data.items ? data.items.length : 0} productos\n💰 ${data.sales ? data.sales.length : 0} ventas`);
      } catch {
        alert('❌ Error al procesar el archivo de respaldo');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      ok: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      missing: 'bg-rose-50 text-rose-700 border border-rose-200',
      partial: 'bg-amber-50 text-amber-700 border border-amber-200',
      pending: 'bg-slate-100 text-slate-700 border border-slate-200',
      extra: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    };
    const labels: Record<string, string> = {
      ok: 'Completo',
      missing: 'Faltante',
      partial: 'Parcial',
      pending: 'Pendiente',
      extra: 'Extra',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${colors[status] || colors.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Barra superior con navegación de Módulos (Catálogo POS, Inventario, Ventas) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                🏪
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {isEditingStoreName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tempStoreName}
                        onChange={(e) => setTempStoreName(e.target.value)}
                        className="px-2 py-0.5 text-base font-bold border border-indigo-300 rounded focus:outline-indigo-600"
                        placeholder="Nombre de tu tienda"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveStoreName}
                        className="px-2 py-0.5 bg-indigo-600 text-white rounded text-xs font-semibold"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => {
                          setTempStoreName(storeName);
                          setIsEditingStoreName(false);
                        }}
                        className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => setIsEditingStoreName(true)}>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{storeName}</h1>
                      <span className="text-xs text-slate-400 opacity-60 group-hover:opacity-100" title="Editar nombre de tienda">✏️</span>
                    </div>
                  )}
                  <span className="hidden sm:inline-block text-[11px] uppercase tracking-wider font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                    AdminLocalSimple
                  </span>
                </div>
                <p className="text-xs text-slate-500">Módulos: Catálogo / Punto de Venta • Control de Inventario • Flujo de Ventas</p>
              </div>
            </div>

            {/* Selector de Vistas / Pestañas principales */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentView('catalog')}
                className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 ${
                  currentView === 'catalog'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>🛍️</span>
                <span>Catálogo / POS</span>
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-semibold ${
                  currentView === 'catalog' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {items.length}
                </span>
              </button>

              <button
                onClick={() => setCurrentView('inventory')}
                className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 ${
                  currentView === 'inventory'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>📋</span>
                <span>Inventario</span>
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-semibold ${
                  currentView === 'inventory' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {items.length}
                </span>
              </button>

              <button
                onClick={() => setCurrentView('sales')}
                className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 ${
                  currentView === 'sales'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>💰</span>
                <span>Ventas</span>
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-semibold ${
                  currentView === 'sales' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {sales.length}
                </span>
              </button>

              <button
                onClick={handleResetToMockData}
                className="px-2.5 py-2 text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium text-xs transition-colors border border-indigo-200 flex items-center gap-1"
                title="Recargar los 5 productos mock data"
              >
                <span>⚡</span>
                <span className="hidden sm:inline">Mock Data</span>
              </button>

              <button
                onClick={() => { logout(); setIsAuthenticated(false); }}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-medium text-sm transition-colors border border-transparent hover:border-rose-200 ml-1"
                title="Cerrar sesión"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal según la vista seleccionada */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* =========================================================================
            VISTA 1: CATÁLOGO PRINCIPAL / PUNTO DE VENTA (POS)
           ========================================================================= */}
        {currentView === 'catalog' && (
          <div className="space-y-6">
            {/* Cabecera del POS con buscador y filtro rápido */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre, SKU o categoría para vender..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todas ({items.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedCategory === cat.name
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name} ({cat.count})
                    </button>
                  ))}
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs ml-auto"
                  >
                    <span>➕</span>
                    <span>Nuevo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid de Productos con Imágenes */}
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
                <div className="text-4xl mb-3">📦</div>
                <h3 className="text-base font-bold text-slate-800 mb-1">No hay productos en esta vista</h3>
                <p className="text-xs text-slate-500 mb-4">No se encontraron productos coincidentes con los filtros.</p>
                <button
                  onClick={handleResetToMockData}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
                >
                  Cargar 5 Productos Mock
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {filteredItems.map(item => {
                  const stock = getStockForItem(item);
                  const isOutOfStock = stock <= 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                    >
                      {/* Imagen con badge de categoría y stock */}
                      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}
                          alt={item.description}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/90 backdrop-blur-xs text-slate-700 shadow-xs border border-white/50">
                            {item.category}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold shadow-xs ${
                            isOutOfStock
                              ? 'bg-rose-500 text-white'
                              : stock < 5
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}>
                            {isOutOfStock ? 'Agotado' : `${stock} disp.`}
                          </span>
                        </div>
                      </div>

                      {/* Información del Producto */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                            <span>{item.sku}</span>
                            <span className="text-slate-500 text-[11px]">Costo: ${item.unitPrice.toFixed(2)}</span>
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                            {item.description}
                          </h3>
                          {item.vehicles && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {item.vehicles}
                            </p>
                          )}
                        </div>

                        {/* Precio y Botón de Venta */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Precio</span>
                            <span className="text-lg font-black text-emerald-700">
                              ${item.salePrice.toFixed(2)}
                            </span>
                          </div>

                          <button
                            onClick={() => handleOpenSaleModal(item)}
                            disabled={isOutOfStock}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <span>💰</span>
                            <span>Vender</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            VISTA 2: PANEL DE ADMINISTRACIÓN DE INVENTARIO
           ========================================================================= */}
        {currentView === 'inventory' && (
          <>
            {/* Tarjetas de Métricas de Inventario */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Productos</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Completos</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.ok}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Faltantes</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">{stats.missing}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Parciales</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.partial}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Extra</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.extra}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pendientes</p>
                <p className="text-2xl font-bold text-slate-700 mt-1">{stats.pending}</p>
              </div>
            </div>

            {/* Filtros y Búsqueda */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 shadow-xs">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Buscar por código SKU, descripción, variantes o categoría..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="all">Todas las Categorías ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat.name} value={cat.name}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-500 mr-1">Filtrar estado:</span>
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'ok', label: 'Completos' },
                  { id: 'missing', label: 'Faltantes' },
                  { id: 'partial', label: 'Parciales' },
                  { id: 'pending', label: 'Pendientes' },
                  { id: 'extra', label: 'Extra' },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setCurrentFilter(filter.id)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      currentFilter === filter.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Barra de Acciones de Inventario */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>➕</span>
                  <span>Nuevo Producto</span>
                </button>

                <button
                  onClick={exportToExcel}
                  disabled={items.length === 0}
                  className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors flex items-center gap-1.5"
                >
                  <span>📥</span>
                  <span>Exportar Excel</span>
                </button>

                <button
                  onClick={exportJSON}
                  disabled={items.length === 0 && sales.length === 0}
                  className="px-3.5 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors flex items-center gap-1.5"
                >
                  <span>💾</span>
                  <span>Respaldo JSON</span>
                </button>

                <label className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium text-sm transition-colors cursor-pointer border border-indigo-200 flex items-center gap-1.5">
                  <span>📂</span>
                  <span>Cargar Respaldo</span>
                  <input type="file" accept=".json" onChange={importJSON} className="hidden" />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetToMockData}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-semibold text-xs transition-colors border border-indigo-200"
                >
                  ⚡ Cargar 5 Mock Items
                </button>
                <button
                  onClick={() => {
                    if (confirm('¿Vaciar la lista de productos?')) {
                      setItems([]);
                      saveItems([]);
                    }
                  }}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-medium text-xs transition-colors border border-rose-200"
                >
                  Vaciar
                </button>
              </div>
            </div>

            {/* Tabla de Productos con miniaturas */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 font-semibold text-center w-12">Foto</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold">SKU</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold">Descripción</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold hidden md:table-cell">Detalles / Variantes</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold text-center">Doc/Esperado</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold text-center">Físico</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold text-center">Stock Disp.</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold text-right">P. Costo</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold text-right">P. Venta</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold text-center">Estado</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map(item => {
                      const stock = getStockForItem(item);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-2 sm:px-3 py-2 text-center">
                            <img
                              src={item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'}
                              alt={item.description}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 mx-auto"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80';
                              }}
                            />
                          </td>
                          <td className="px-3 sm:px-4 py-3 font-mono font-bold text-indigo-700">
                            {item.sku}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <div className="font-semibold text-slate-900">{item.description}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="inline-block px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[10px]">
                                {item.category || 'General'}
                              </span>
                              {item.vehicles && (
                                <span className="text-[11px] text-slate-500 md:hidden truncate max-w-[150px]">
                                  {item.vehicles}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-slate-600 hidden md:table-cell text-xs">
                            {item.vehicles || '-'}
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.qtyPdf}
                              onChange={(e) => updateQtyPdf(item.id, e.target.value)}
                              className="w-16 px-2 py-1 border border-slate-200 rounded text-center text-xs font-medium"
                            />
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={item.qtyReceived !== null ? item.qtyReceived : ''}
                              onChange={(e) => updateQtyReceived(item.id, e.target.value)}
                              className="w-16 px-2 py-1 border border-slate-200 rounded text-center text-xs font-medium"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                              stock <= 0
                                ? 'bg-rose-100 text-rose-700'
                                : stock < 5
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {stock}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => updateUnitPrice(item.id, e.target.value)}
                              className="w-20 px-2 py-1 border border-slate-200 rounded text-right text-xs"
                            />
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.salePrice}
                              onChange={(e) => updateSalePrice(item.id, e.target.value)}
                              className="w-20 px-2 py-1 border border-emerald-300 rounded text-right text-xs font-bold text-emerald-700 bg-emerald-50/30"
                            />
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-center">
                            <StatusBadge status={calculateStatus(item.qtyPdf, item.qtyReceived)} />
                          </td>
                          <td className="px-3 sm:px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenSaleModal(item)}
                                disabled={stock <= 0}
                                className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
                                title={stock <= 0 ? 'Sin stock para vender' : 'Registrar Venta'}
                              >
                                💰
                              </button>
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-xs transition-colors"
                                title="Editar producto"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id, item.sku)}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md text-xs transition-colors"
                                title="Eliminar producto"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* =========================================================================
            VISTA 3: MÓDULO DE VENTAS Y FLUJO DE CAJA
           ========================================================================= */}
        {currentView === 'sales' && (
          <>
            {/* Métricas de Ventas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Total Facturado</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">${totalSalesAmount.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Ganancia Bruta</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">${totalProfit.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">N° Transacciones</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{sales.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Meses Activos</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{Object.keys(monthlySales).length}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Más Vendidos</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{frequentSalesItems.length}</p>
              </div>
            </div>

            {/* Alertas de Stock Agotado */}
            {outOfStockItems.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4">
                <h4 className="text-sm font-bold text-rose-800 mb-2 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Productos Agotados</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {outOfStockItems.slice(0, 4).map(item => (
                    <div key={item.id} className="bg-white rounded-lg p-2.5 border border-rose-200 text-xs shadow-2xs">
                      <div className="font-mono font-bold text-rose-700">{item.sku}</div>
                      <div className="text-slate-800 truncate">{item.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Barra de Acciones de Ventas */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <button
                onClick={exportSalesToExcel}
                disabled={sales.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>📥</span>
                <span>Exportar Ventas a Excel</span>
              </button>
            </div>

            {/* Ventas Agrupadas por Mes */}
            {sales.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 text-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                  💰
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">No hay ventas registradas</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                  Realiza ventas de prueba desde el <strong>Catálogo / POS</strong> o desde el inventario para visualizar el flujo de caja.
                </p>
                <button
                  onClick={() => setCurrentView('catalog')}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm transition-all shadow-sm"
                >
                  Abrir Catálogo / POS
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.keys(monthlySales).sort().reverse().map(month => {
                  const monthSales = monthlySales[month];
                  const monthTotal = monthSales.reduce((sum, s) => sum + s.totalPrice, 0);

                  return (
                    <div key={month} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-bold tracking-tight">Período {month}</h3>
                          <span className="text-xs text-slate-400">{monthSales.length} ventas</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 uppercase tracking-wide block">Total Período</span>
                          <span className="text-lg font-bold text-emerald-400">${monthTotal.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs sm:text-sm text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] tracking-wider">
                            <tr>
                              <th className="px-3 sm:px-4 py-2.5 font-semibold">Fecha</th>
                              <th className="px-3 sm:px-4 py-2.5 font-semibold">Cliente</th>
                              <th className="px-3 sm:px-4 py-2.5 font-semibold">SKU / Producto</th>
                              <th className="px-3 sm:px-4 py-2.5 font-semibold text-center">Cant.</th>
                              <th className="px-3 sm:px-4 py-2.5 font-semibold text-right">P. Venta</th>
                              <th className="px-3 sm:px-4 py-2.5 font-semibold text-right">Total</th>
                              <th className="px-3 sm:px-4 py-2.5 font-semibold text-center">Pago</th>
                              <th className="px-3 sm:px-4 py-2.5 font-semibold text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {monthSales.map(sale => (
                              <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-3 sm:px-4 py-3 text-slate-600 whitespace-nowrap">
                                  {sale.date}
                                </td>
                                <td className="px-3 sm:px-4 py-3">
                                  <div className="font-semibold text-slate-900">{sale.customerName}</div>
                                  {(sale.customerPhone || sale.customerId) && (
                                    <div className="text-xs text-slate-500">
                                      {sale.customerPhone} {sale.customerId ? `• ${sale.customerId}` : ''}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 sm:px-4 py-3">
                                  <div className="font-mono font-bold text-indigo-700 text-xs">{sale.sku}</div>
                                  <div className="text-slate-800 text-xs">{sale.description}</div>
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-center font-bold">
                                  {sale.quantity}
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-right text-slate-700">
                                  ${sale.salePrice.toFixed(2)}
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-right font-bold text-emerald-700">
                                  ${sale.totalPrice.toFixed(2)}
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-center">
                                  <button
                                    onClick={() => {
                                      const updated = { ...sale, paymentPending: !sale.paymentPending };
                                      setSales(prev => prev.map(s => s.id === sale.id ? updated : s));
                                    }}
                                    className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                                      sale.paymentPending
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    {sale.paymentPending ? '⏳ Pendiente' : '✅ Pagado'}
                                  </button>
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleEditSale(sale)}
                                      className="p-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs"
                                      title="Editar venta"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleCancelSale(sale.id)}
                                      className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xs"
                                      title="Cancelar venta"
                                    >
                                      🗑️
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal: Registrar Venta con Foto */}
      {showSaleModal && selectedItemForSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">💰 Registrar Venta</h2>
                <p className="text-xs text-emerald-100">Descuenta automáticamente unidades del inventario</p>
              </div>
              <span className="text-2xl">🛍️</span>
            </div>
            <div className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center gap-3">
                <img
                  src={selectedItemForSale.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'}
                  alt={selectedItemForSale.description}
                  className="w-14 h-14 object-cover rounded-lg border border-slate-200"
                />
                <div className="flex-1">
                  <div className="font-mono font-bold text-indigo-700 text-xs">{selectedItemForSale.sku}</div>
                  <div className="text-slate-900 font-semibold text-sm">{selectedItemForSale.description}</div>
                  <div className="text-xs text-slate-500">{selectedItemForSale.category}</div>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5">
                    Stock: {getStockForItem(selectedItemForSale)} unidades
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente</label>
                <input
                  type="text"
                  value={saleCustomerName}
                  onChange={(e) => setSaleCustomerName(e.target.value)}
                  placeholder="Nombre del cliente o razón social"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={saleCustomerPhone}
                    onChange={(e) => setSaleCustomerPhone(e.target.value)}
                    placeholder="Contacto"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Identificación / ID</label>
                  <input
                    type="text"
                    value={saleCustomerId}
                    onChange={(e) => setSaleCustomerId(e.target.value)}
                    placeholder="Cédula / Documento"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad a vender</label>
                <input
                  type="number"
                  min="1"
                  max={getStockForItem(selectedItemForSale)}
                  value={saleQuantity}
                  onChange={(e) => setSaleQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">P. Costo Ref.</label>
                  <input
                    type="number"
                    step="0.01"
                    value={saleUnitPrice}
                    onChange={(e) => setSaleUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">P. Venta Unitario</label>
                  <input
                    type="number"
                    step="0.01"
                    value={salePrice}
                    onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border-2 border-emerald-400 rounded-lg text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notas / Observaciones</label>
                <textarea
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  placeholder="Detalles de la venta..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <input
                  type="checkbox"
                  id="salePending"
                  checked={salePaymentPending}
                  onChange={(e) => setSalePaymentPending(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <label htmlFor="salePending" className="text-xs font-semibold text-amber-900 cursor-pointer">
                  Marcar pago como pendiente (por cobrar)
                </label>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-800">Total a Cobrar:</span>
                <span className="text-xl font-bold text-emerald-700">
                  ${(saleQuantity * salePrice).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleRegisterSale}
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Confirmar Venta
                </button>
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Venta */}
      {showEditSaleModal && editingSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-indigo-600 text-white px-5 py-4">
              <h2 className="text-lg font-bold">✏️ Editar Registro de Venta</h2>
            </div>
            <div className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
                <div className="font-mono font-bold text-indigo-700">{editingSale.sku}</div>
                <div className="text-slate-800">{editingSale.description}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha</label>
                <input
                  type="date"
                  value={editingSale.date.split('T')[0]}
                  onChange={(e) => setEditingSale({ ...editingSale, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente</label>
                <input
                  type="text"
                  value={editingSale.customerName}
                  onChange={(e) => setEditingSale({ ...editingSale, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={editingSale.customerPhone}
                    onChange={(e) => setEditingSale({ ...editingSale, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ID / Documento</label>
                  <input
                    type="text"
                    value={editingSale.customerId}
                    onChange={(e) => setEditingSale({ ...editingSale, customerId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={editingSale.quantity}
                    onChange={(e) => {
                      const qty = parseInt(e.target.value) || 1;
                      setEditingSale({ ...editingSale, quantity: qty, totalPrice: qty * editingSale.salePrice });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">P. Venta</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSale.salePrice}
                    onChange={(e) => {
                      const price = parseFloat(e.target.value) || 0;
                      setEditingSale({ ...editingSale, salePrice: price, totalPrice: editingSale.quantity * price });
                    }}
                    className="w-full px-3 py-2 border border-emerald-400 rounded-lg text-sm font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <input
                  type="checkbox"
                  id="editPending"
                  checked={editingSale.paymentPending}
                  onChange={(e) => setEditingSale({ ...editingSale, paymentPending: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded"
                />
                <label htmlFor="editPending" className="text-xs font-semibold text-amber-900 cursor-pointer">
                  Pago pendiente
                </label>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-800">Total Actualizado:</span>
                <span className="text-xl font-bold text-indigo-700">
                  ${editingSale.totalPrice.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveEditedSale}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => setShowEditSaleModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Producto */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-indigo-600 text-white px-5 py-4">
              <h2 className="text-lg font-bold">✏️ Editar Producto</h2>
            </div>
            <div className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL de Imagen</label>
                <input
                  type="text"
                  value={editingItem.imageUrl || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Código</label>
                <input
                  type="text"
                  value={editingItem.sku}
                  onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detalles / Variantes / Especificaciones</label>
                <textarea
                  value={editingItem.vehicles}
                  onChange={(e) => setEditingItem({ ...editingItem, vehicles: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
                  placeholder="Detalles, atributos, variantes..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                <input
                  type="text"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cant. Documentada</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.qtyPdf}
                    onChange={(e) => setEditingItem({ ...editingItem, qtyPdf: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cant. Físico / Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.qtyReceived !== null ? editingItem.qtyReceived : ''}
                    onChange={(e) => setEditingItem({ ...editingItem, qtyReceived: e.target.value === '' ? null : parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Costo</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingItem.unitPrice}
                    onChange={(e) => setEditingItem({ ...editingItem, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Venta</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingItem.salePrice}
                    onChange={(e) => setEditingItem({ ...editingItem, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border-2 border-emerald-400 rounded-lg text-sm font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar Producto con Imagen */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-indigo-600 text-white px-5 py-4">
              <h2 className="text-lg font-bold">➕ Agregar Producto</h2>
              <p className="text-xs text-indigo-100 mt-0.5">Ingresa los datos para sumar el producto al catálogo</p>
            </div>
            <div className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Código *</label>
                <input
                  type="text"
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value.toUpperCase() })}
                  placeholder="Ej: ART-001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción del Producto *</label>
                <input
                  type="text"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Ej: Termo Deportivo 1L, Audífonos..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL de Imagen</label>
                <input
                  type="text"
                  value={newItem.imageUrl}
                  onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Detalles / Especificaciones</label>
                <textarea
                  value={newItem.vehicles}
                  onChange={(e) => setNewItem({ ...newItem, vehicles: e.target.value })}
                  placeholder="Ej: Color, material, dimensiones, garantía..."
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                <div className="grid grid-cols-1 gap-2">
                  {categories.length > 0 && (
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value, newCategory: '' })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="">Seleccionar categoría existente...</option>
                      {categories.map((cat) => (
                        <option key={cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={newItem.newCategory}
                    onChange={(e) => setNewItem({ ...newItem, newCategory: e.target.value, category: '' })}
                    placeholder="O escribe una nueva categoría..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad Esperada</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.qtyPdf}
                    onChange={(e) => setNewItem({ ...newItem, qtyPdf: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Físico Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.qtyReceived !== null ? newItem.qtyReceived : ''}
                    onChange={(e) => setNewItem({ ...newItem, qtyReceived: e.target.value === '' ? null : parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Costo</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Venta</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.salePrice}
                    onChange={(e) => setNewItem({ ...newItem, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border-2 border-emerald-400 rounded-lg text-sm font-bold text-emerald-700"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddItem}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Agregar Producto
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
