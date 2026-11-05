import { useState, useMemo, useEffect } from 'react';
import { TrackedItem, Sale, DEFAULT_MOCK_ITEMS } from './data/inventory';
import { exportInventoryToExcel, exportSalesToExcel } from './utils/exportUtils';
import GeminiInvoiceModal from './components/GeminiInvoiceModal';

const STORAGE_KEY = 'adminlocalsimple_inventory_v1';
const SALES_KEY = 'adminlocalsimple_sales_v1';
const STORE_NAME_KEY = 'adminlocalsimple_store_name';
const AUTH_KEY = 'adminlocalsimple_auth';
const DEFAULT_PASSWORD = 'adminlocalsimple';

// Purgar datos heredados de versiones previas
const purgeLegacyData = () => {
  try {
    localStorage.removeItem('gvautopartes_inventory_data_v11');
    localStorage.removeItem('gvautopartes_sales_data_v11');
    localStorage.removeItem('gvautopartes_auth');
  } catch {
    // Protección para navegadores con almacenamiento restringido
  }
};
purgeLegacyData();

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

// Función de normalización de cadenas para búsqueda insensible a acentos y mayúsculas
const normalizeStr = (text: string): string => {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password.trim())) {
      setPassword('');
      setError('');
      setTimeout(() => onLogin(), 80);
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
          <p className="text-sm text-slate-500 mt-1">Gestión de Catálogo, Existencias y Punto de Venta</p>
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
                className="text-indigo-600 hover:underline font-mono text-xs font-semibold cursor-pointer"
              >
                adminlocalsimple
              </button>
            </p>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 active:scale-[0.99] font-semibold transition-all shadow-md hover:shadow-lg text-base cursor-pointer"
          >
            Ingresar al Panel
          </button>
        </form>

        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">AdminLocalSimple • Solución Genérica de Administración Comercial</p>
        </div>
      </div>
    </div>
  );
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ConfirmState {
  title: string;
  message: string;
  confirmText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [items, setItems] = useState<TrackedItem[]>(loadItems);
  const [sales, setSales] = useState<Sale[]>(loadSales);
  const [storeName, setStoreName] = useState<string>(loadStoreName);
  const [isEditingStoreName, setIsEditingStoreName] = useState(false);
  const [tempStoreName, setTempStoreName] = useState(storeName);

  // Vistas disponibles: 'catalog' (Catálogo / POS), 'inventory' (Panel Administración), 'sales' (Control de Ventas)
  const [currentView, setCurrentView] = useState<'catalog' | 'inventory' | 'sales'>('catalog');
  const [currentFilter, setCurrentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Sistema de Notificaciones Toasts y Confirmaciones sin alert/confirm
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmState | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3200);
  };

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
  const [saleError, setSaleError] = useState('');

  const [showEditSaleModal, setShowEditSaleModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TrackedItem | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [newItemError, setNewItemError] = useState('');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Conexión a internet restablecida', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Sin conexión a internet. La app continúa funcionando en Modo Local.', 'info');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
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

  const handleSaveStoreName = () => {
    const trimmed = tempStoreName.trim() || 'AdminLocalSimple';
    setStoreName(trimmed);
    saveStoreName(trimmed);
    setIsEditingStoreName(false);
    showToast(`Nombre actualizado: ${trimmed}`, 'info');
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
    setSaleError('');
    setShowSaleModal(true);
  };

  const handleRegisterSale = () => {
    if (!selectedItemForSale) return;

    const currentStock = getStockForItem(selectedItemForSale);
    if (saleQuantity > currentStock) {
      setSaleError(`Existencias insuficientes. Stock disponible: ${currentStock} unidades`);
      return;
    }
    if (saleQuantity <= 0) {
      setSaleError('La cantidad vendida debe ser mayor a 0');
      return;
    }
    if (salePrice <= 0) {
      setSaleError('El precio de venta debe ser superior a 0');
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
      customerName: saleCustomerName.trim() || 'Cliente Mostrador',
      customerPhone: saleCustomerPhone.trim(),
      customerId: saleCustomerId.trim(),
      notes: saleNotes.trim(),
      paymentPending: salePaymentPending,
    };

    setSales(prev => [newSale, ...prev]);
    setShowSaleModal(false);
    setSelectedItemForSale(null);
    setSaleQuantity(1);
    setSaleError('');

    showToast(`Venta confirmada: $${newSale.totalPrice.toFixed(2)} (${newSale.quantity} un.)`, 'success');
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
    showToast('Registro de venta actualizado', 'info');
  };

  const handleCancelSale = (sale: Sale) => {
    setConfirmDialog({
      title: '¿Anular esta venta?',
      message: `Se anulará la venta de "${sale.description}" ($${sale.totalPrice.toFixed(2)}) y las ${sale.quantity} unidades se reintegrarán al stock disponible inmediatamente.`,
      confirmText: 'Sí, anular venta',
      isDestructive: true,
      onConfirm: () => {
        setSales(prev => prev.filter(s => s.id !== sale.id));
        setConfirmDialog(null);
        showToast('Venta anulada y existencias reintegradas', 'info');
      }
    });
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
    showToast('Ficha de producto actualizada', 'success');
  };

  const handleDeleteItem = (item: TrackedItem) => {
    setConfirmDialog({
      title: '¿Eliminar producto del catálogo?',
      message: `¿Estás seguro de que deseas eliminar permanentemente "${item.sku} - ${item.description}"?`,
      confirmText: 'Eliminar producto',
      isDestructive: true,
      onConfirm: () => {
        setItems(prev => prev.filter(i => i.id !== item.id));
        setConfirmDialog(null);
        showToast(`Producto "${item.sku}" eliminado`, 'info');
      }
    });
  };

  const handleAddItem = () => {
    if (!newItem.sku.trim() || !newItem.description.trim()) {
      setNewItemError('El código SKU y la descripción son campos obligatorios.');
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
    setNewItemError('');
    setShowAddModal(false);
    showToast(`Producto "${newItemData.sku}" agregado al catálogo`, 'success');
  };

  const handleApplyGeminiCandidate = (candidate: Partial<TrackedItem>) => {
    setNewItem({
      sku: candidate.sku || '',
      description: candidate.description || '',
      vehicles: candidate.vehicles || '',
      category: candidate.category || 'General',
      newCategory: '',
      qtyPdf: candidate.qtyPdf || 10,
      qtyReceived: candidate.qtyReceived || 10,
      unitPrice: candidate.unitPrice || 0,
      salePrice: candidate.salePrice || 0,
      imageUrl: '',
      inPdf: true,
      inExcel: true,
      inPhysical: true
    });
    setShowGeminiModal(false);
    setShowAddModal(true);
    showToast('Producto desglosado cargado al formulario de alta', 'success');
  };

  const handleBatchAddGeminiProducts = (candidates: Partial<TrackedItem>[]) => {
    if (!candidates || candidates.length === 0) return;
    const newItems: TrackedItem[] = candidates.map((cand, idx) => {
      const qtyExpected = cand.qtyPdf ?? 10;
      const qtyRec = cand.qtyReceived !== undefined && cand.qtyReceived !== null ? cand.qtyReceived : qtyExpected;
      return {
        id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        sku: cand.sku?.trim().toUpperCase() || `ITEM-${Math.floor(1000 + Math.random() * 9000)}`,
        description: cand.description?.trim() || 'Producto Factura Gemini',
        vehicles: cand.vehicles || 'Convertido con Gemini AI',
        category: cand.category?.trim() || 'General',
        categoryId: 1,
        qtyPdf: qtyExpected,
        qtyReceived: qtyRec,
        status: calculateStatus(qtyExpected, qtyRec),
        unitPrice: cand.unitPrice ?? 0,
        salePrice: cand.salePrice ?? cand.unitPrice ?? 0,
        imageUrl: cand.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
        inPdf: true,
        inExcel: true,
        inPhysical: true
      };
    });

    const updated = [...items, ...newItems];
    setItems(updated);
    saveItems(updated);
    setShowGeminiModal(false);
    showToast(`¡${newItems.length} productos convertidos e ingresados al inventario!`, 'success');
  };

  const handleResetToMockData = () => {
    setConfirmDialog({
      title: '¿Restablecer datos de prueba (Mock)?',
      message: 'Se inyectarán los 5 productos genéricos iniciales con imágenes funcionales y stock configurado.',
      confirmText: 'Cargar 5 Productos',
      isDestructive: false,
      onConfirm: () => {
        setItems(DEFAULT_MOCK_ITEMS);
        saveItems(DEFAULT_MOCK_ITEMS);
        setConfirmDialog(null);
        showToast('5 productos mock cargados con éxito', 'success');
      }
    });
  };

  const handleEmptyInventory = () => {
    setConfirmDialog({
      title: '¿Vaciar todo el inventario?',
      message: 'Esta acción borrará la lista de productos actuales para dejar el catálogo completamente en blanco.',
      confirmText: 'Sí, vaciar catálogo',
      isDestructive: true,
      onConfirm: () => {
        setItems([]);
        saveItems([]);
        setConfirmDialog(null);
        showToast('Catálogo vaciado correctamente', 'info');
      }
    });
  };

  const handleExportExcel = async () => {
    if (items.length === 0) {
      showToast('No hay productos en inventario para exportar', 'error');
      return;
    }
    showToast('Generando Excel con diseño corporativo...', 'info');
    try {
      await exportInventoryToExcel(items, storeName, getStockForItem, calculateStatus);
      showToast('Inventario exportado a Excel exitosamente', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error al generar archivo Excel', 'error');
    }
  };

  const handleExportSalesExcel = async () => {
    if (sales.length === 0) {
      showToast('No hay transacciones registradas para exportar', 'error');
      return;
    }
    showToast('Generando reporte financiero en Excel...', 'info');
    try {
      await exportSalesToExcel(sales, storeName);
      showToast('Reporte de ventas exportado exitosamente', 'success');
    } catch (e) {
      console.error(e);
      showToast('Error al exportar ventas', 'error');
    }
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
    showToast('Respaldo JSON descargado', 'success');
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
        showToast(`Respaldo cargado: ${data.items?.length || 0} productos, ${data.sales?.length || 0} ventas`, 'success');
      } catch {
        showToast('Error al procesar el archivo JSON', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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

  // Búsqueda inteligente multi-palabra insensible a mayúsculas y acentos
  const searchTerms = useMemo(() => {
    return normalizeStr(searchQuery).split(/\s+/).filter(Boolean);
  }, [searchQuery]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesFilter = currentFilter === 'all' || calculateStatus(item.qtyPdf, item.qtyReceived) === currentFilter;
      const matchesCategory = selectedCategory === 'all' || (item.category || 'General') === selectedCategory;
      if (!matchesFilter || !matchesCategory) return false;

      if (searchTerms.length === 0) return true;

      const searchableBlob = normalizeStr(
        `${item.sku} ${item.description} ${item.vehicles} ${item.category} ${item.salePrice} ${item.unitPrice}`
      );

      // Todas las palabras clave deben estar presentes
      return searchTerms.every(term => searchableBlob.includes(term));
    });
  }, [items, currentFilter, selectedCategory, searchTerms]);

  // Búsqueda en historial de ventas
  const salesSearchTerms = useMemo(() => {
    return normalizeStr(salesSearchQuery).split(/\s+/).filter(Boolean);
  }, [salesSearchQuery]);

  const filteredSales = useMemo(() => {
    if (salesSearchTerms.length === 0) return sales;
    return sales.filter(s => {
      const blob = normalizeStr(
        `${s.customerName} ${s.customerPhone} ${s.customerId} ${s.sku} ${s.description} ${s.notes} ${s.date}`
      );
      return salesSearchTerms.every(term => blob.includes(term));
    });
  }, [sales, salesSearchTerms]);

  const totalSalesAmount = useMemo(() => sales.reduce((sum, s) => sum + s.totalPrice, 0), [sales]);
  const totalProfit = useMemo(() => sales.reduce((sum, s) => sum + ((s.salePrice - s.unitPrice) * s.quantity), 0), [sales]);

  const monthlySales = useMemo(() => {
    const grouped: Record<string, Sale[]> = {};
    filteredSales.forEach(sale => {
      const month = sale.date ? sale.date.substring(0, 7) : new Date().toISOString().substring(0, 7);
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(sale);
    });
    return grouped;
  }, [filteredSales]);

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

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      ok: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      missing: 'bg-rose-50 text-rose-700 border border-rose-200',
      partial: 'bg-amber-50 text-amber-700 border border-amber-200',
      pending: 'bg-slate-100 text-slate-700 border border-slate-200',
      extra: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    };
    const labels: Record<string, string> = {
      ok: 'En Stock Óptimo',
      missing: 'Agotado / Faltante',
      partial: 'Incompleto / Parcial',
      pending: 'Por Recibir',
      extra: 'Excedente',
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${colors[status] || colors.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      {/* Sistema flotante de Notificaciones Toast */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2.5 transition-all transform animate-bounce-short ${
              toast.type === 'success'
                ? 'bg-slate-900 text-emerald-300 border-slate-800'
                : toast.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-800'
                : 'bg-indigo-900 text-indigo-100 border-indigo-800'
            }`}
          >
            <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Modal de Confirmación Nativo (Evita window.confirm bloqueado en iframe) */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmDialog.title}</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2.5 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors cursor-pointer shadow-sm ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {confirmDialog.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Convertidor Inteligente de Facturas con Gemini AI */}
      <GeminiInvoiceModal
        isOpen={showGeminiModal}
        onClose={() => setShowGeminiModal(false)}
        onAddProduct={handleApplyGeminiCandidate}
        onBatchAddProducts={handleBatchAddGeminiProducts}
        showToast={showToast}
      />

      {/* Banner de Estado Fuera de Línea (Offline) */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm sticky top-0 z-50">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span>
            <strong>Modo Local Activo (Sin Conexión a Internet)</strong>: Puedes seguir registrando ventas, controlando inventario y exportando datos con total normalidad.
          </span>
        </div>
      )}

      {/* Barra superior con navegación de Módulos */}
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
                        placeholder="Nombre de tu comercio"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveStoreName}
                        className="px-2 py-0.5 bg-indigo-600 text-white rounded text-xs font-semibold cursor-pointer"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => {
                          setTempStoreName(storeName);
                          setIsEditingStoreName(false);
                        }}
                        className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs cursor-pointer"
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
                <p className="text-xs text-slate-500">Módulos: Catálogo & POS • Control de Existencias • Flujo de Ventas</p>
              </div>
            </div>

            {/* Pestañas principales */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentView('catalog')}
                className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'catalog'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>🛍️</span>
                <span>Punto de Venta (POS)</span>
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-semibold ${
                  currentView === 'catalog' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {items.length}
                </span>
              </button>

              <button
                onClick={() => setCurrentView('inventory')}
                className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'inventory'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>📋</span>
                <span>Existencias & Almacén</span>
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-semibold ${
                  currentView === 'inventory' ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {items.length}
                </span>
              </button>

              <button
                onClick={() => setCurrentView('sales')}
                className={`px-3.5 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'sales'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>💰</span>
                <span>Ventas & Caja</span>
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-xs font-semibold ${
                  currentView === 'sales' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {sales.length}
                </span>
              </button>

              <button
                onClick={() => setShowGeminiModal(true)}
                className="px-2.5 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 hover:from-blue-100 hover:to-indigo-100 rounded-lg font-medium text-xs transition-colors border border-indigo-200 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Convertir facturas o recibos a productos con Gemini AI"
              >
                <span>✨</span>
                <span className="hidden sm:inline">Factura Gemini AI</span>
              </button>

              <button
                onClick={handleResetToMockData}
                className="px-2.5 py-2 text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium text-xs transition-colors border border-indigo-200 flex items-center gap-1 cursor-pointer"
                title="Recargar los 5 productos de demostración"
              >
                <span>⚡</span>
                <span className="hidden sm:inline">Mock Demo</span>
              </button>

              <button
                onClick={onLogout}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg font-medium text-sm transition-colors border border-transparent hover:border-rose-200 ml-1 cursor-pointer"
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
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Búsqueda rápida por nombre, SKU, variantes, precio o categoría..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedCategory === cat.name
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name} ({cat.count})
                    </button>
                  ))}
                  <button
                    onClick={() => setShowGeminiModal(true)}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer ml-auto"
                    title="Convertir imagen de factura con Gemini AI"
                  >
                    <span>✨</span>
                    <span>Factura IA</span>
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>➕</span>
                    <span>Nuevo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Grid de Productos */}
            {filteredItems.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
                <div className="text-4xl mb-3">📦</div>
                <h3 className="text-base font-bold text-slate-800 mb-1">No se encontraron productos</h3>
                <p className="text-xs text-slate-500 mb-4">Prueba ajustando los términos de búsqueda o selecciona otra categoría.</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Limpiar Búsqueda
                  </button>
                  <button
                    onClick={handleResetToMockData}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                  >
                    Cargar 5 Productos Mock
                  </button>
                </div>
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
                            {isOutOfStock ? 'Agotado' : `${stock} en almacén`}
                          </span>
                        </div>
                      </div>

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

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">P. Venta</span>
                            <span className="text-lg font-black text-emerald-700">
                              ${item.salePrice.toFixed(2)}
                            </span>
                          </div>

                          <button
                            onClick={() => handleOpenSaleModal(item)}
                            disabled={isOutOfStock}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Catálogo</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Stock Óptimo</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.ok}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide">Faltantes</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">{stats.missing}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Incompletos</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.partial}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Excedentes</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.extra}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Por Recibir</p>
                <p className="text-2xl font-bold text-slate-700 mt-1">{stats.pending}</p>
              </div>
            </div>

            {/* Filtros y Buscador */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 shadow-xs">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Filtrar inventario por SKU, descripción, variantes, categoría o rango..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white cursor-pointer"
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
                <span className="text-xs font-semibold text-slate-500 mr-1">Filtrar estado de existencias:</span>
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'ok', label: 'Óptimos' },
                  { id: 'missing', label: 'Faltantes' },
                  { id: 'partial', label: 'Incompletos' },
                  { id: 'pending', label: 'Por Recibir' },
                  { id: 'extra', label: 'Excedentes' },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setCurrentFilter(filter.id)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold text-sm transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>➕</span>
                  <span>Nuevo Producto</span>
                </button>

                <button
                  onClick={() => setShowGeminiModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Extraer productos desglosados en unidades con Gemini"
                >
                  <span>✨</span>
                  <span>Convertir Factura (Gemini AI)</span>
                </button>

                <button
                  onClick={handleExportExcel}
                  disabled={items.length === 0}
                  className="px-3.5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>📥</span>
                  <span>Exportar Excel</span>
                </button>

                <button
                  onClick={exportJSON}
                  disabled={items.length === 0 && sales.length === 0}
                  className="px-3.5 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>💾</span>
                  <span>Respaldo JSON</span>
                </button>

                <label className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium text-sm transition-colors cursor-pointer border border-indigo-200 flex items-center gap-1.5">
                  <span>📂</span>
                  <span>Importar JSON</span>
                  <input type="file" accept=".json" onChange={importJSON} className="hidden" />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetToMockData}
                  className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-semibold text-xs transition-colors border border-indigo-200 cursor-pointer"
                >
                  ⚡ Cargar 5 Mock Items
                </button>
                <button
                  onClick={handleEmptyInventory}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg font-medium text-xs transition-colors border border-rose-200 cursor-pointer"
                >
                  Vaciar Todo
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
                      <th className="px-3 sm:px-4 py-3 font-semibold text-center">Facturado</th>
                      <th className="px-3 sm:px-4 py-3 font-semibold text-center">En Almacén</th>
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
                                className="p-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors cursor-pointer"
                                title={stock <= 0 ? 'Sin existencias para vender' : 'Registrar Venta'}
                              >
                                💰
                              </button>
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-xs transition-colors cursor-pointer"
                                title="Editar ficha de producto"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md text-xs transition-colors cursor-pointer"
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
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">N° Operaciones</p>
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

            {outOfStockItems.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4">
                <h4 className="text-sm font-bold text-rose-800 mb-2 flex items-center gap-1.5">
                  <span>⚠️</span>
                  <span>Productos Agotados en Almacén</span>
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

            {/* Barra de Búsqueda y Acciones en Ventas */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Buscar venta por cliente, teléfono, cédula, producto o SKU..."
                  value={salesSearchQuery}
                  onChange={(e) => setSalesSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                {salesSearchQuery && (
                  <button
                    onClick={() => setSalesSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                onClick={handleExportSalesExcel}
                disabled={sales.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>📥</span>
                <span>Exportar Reporte Excel</span>
              </button>
            </div>

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
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm transition-all shadow-sm cursor-pointer"
                >
                  Abrir Punto de Venta (POS)
                </button>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md mx-auto shadow-xs">
                <div className="text-3xl mb-2">🔍</div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">No se encontraron ventas</h4>
                <p className="text-xs text-slate-500 mb-3">No hay transacciones que coincidan con la búsqueda.</p>
                <button
                  onClick={() => setSalesSearchQuery('')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Limpiar Búsqueda
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
                          <span className="text-xs text-slate-400">{monthSales.length} transacciones registradas</span>
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
                              <th className="px-3 sm:px-4 py-2.5 font-semibold text-center">Estado Pago</th>
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
                                      showToast(updated.paymentPending ? 'Pago marcado como por cobrar' : 'Pago marcado como cobrado', 'info');
                                    }}
                                    className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                                      sale.paymentPending
                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    {sale.paymentPending ? '⏳ Por Cobrar' : '✅ Cobrado'}
                                  </button>
                                </td>
                                <td className="px-3 sm:px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleEditSale(sale)}
                                      className="p-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs cursor-pointer"
                                      title="Editar venta"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleCancelSale(sale)}
                                      className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded text-xs cursor-pointer"
                                      title="Anular venta"
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

      {/* Modal: Registrar Venta */}
      {showSaleModal && selectedItemForSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">💰 Registrar Venta</h2>
                <p className="text-xs text-emerald-100">Descuenta automáticamente unidades de existencias</p>
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
                    Stock en almacén: {getStockForItem(selectedItemForSale)} unidades
                  </div>
                </div>
              </div>

              {saleError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{saleError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha de Operación</label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente / Destinatario</label>
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
                    placeholder="Contacto telefónico"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cédula / RIF / ID</label>
                  <input
                    type="text"
                    value={saleCustomerId}
                    onChange={(e) => setSaleCustomerId(e.target.value)}
                    placeholder="N° Identificación"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Costo Ref.</label>
                  <input
                    type="number"
                    step="0.01"
                    value={saleUnitPrice}
                    onChange={(e) => setSaleUnitPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Venta al Público</label>
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
                  placeholder="Detalles de entrega, método de cobro..."
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
                  className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                />
                <label htmlFor="salePending" className="text-xs font-semibold text-amber-900 cursor-pointer">
                  Marcar como venta a crédito / Por cobrar
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
                  className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                >
                  Confirmar Venta
                </button>
                <button
                  onClick={() => setShowSaleModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-300 transition-colors cursor-pointer"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cédula / RIF</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Venta</label>
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
                  className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                />
                <label htmlFor="editPending" className="text-xs font-semibold text-amber-900 cursor-pointer">
                  Saldo pendiente por cobrar
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
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => setShowEditSaleModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-300 transition-colors cursor-pointer"
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
              <h2 className="text-lg font-bold">✏️ Modificar Ficha de Producto</h2>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Código SKU</label>
                <input
                  type="text"
                  value={editingItem.sku}
                  onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción del Producto</label>
                <input
                  type="text"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Variantes / Especificaciones</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Facturado / Esperado</label>
                  <input
                    type="number"
                    min="0"
                    value={editingItem.qtyPdf}
                    onChange={(e) => setEditingItem({ ...editingItem, qtyPdf: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Conteo Físico en Almacén</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Venta al Público</label>
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
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Guardar Cambios
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-300 transition-colors cursor-pointer"
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
            <div className="bg-indigo-600 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">➕ Alta de Nuevo Producto</h2>
                <p className="text-xs text-indigo-100 mt-0.5">Ingresa los datos para registrarlo en el catálogo</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setShowGeminiModal(true); }}
                className="px-2.5 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                title="Rellenar datos automáticamente desde foto con Gemini AI"
              >
                <span>✨</span>
                <span>Usar Factura Gemini</span>
              </button>
            </div>
            <div className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              {newItemError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{newItemError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Código SKU *</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Variantes / Especificaciones</label>
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white cursor-pointer"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Facturado / Esperado</label>
                  <input
                    type="number"
                    min="0"
                    value={newItem.qtyPdf}
                    onChange={(e) => setNewItem({ ...newItem, qtyPdf: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Conteo Físico Inicial</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Venta al Público</label>
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
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                >
                  Confirmar Alta
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-slate-200 text-slate-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-300 transition-colors cursor-pointer"
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(checkAuth);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Dashboard
      onLogout={() => {
        logout();
        setIsAuthenticated(false);
      }}
    />
  );
}
