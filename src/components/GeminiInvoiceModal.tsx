import React, { useState } from 'react';
import { TrackedItem } from '../data/inventory';

interface GeminiInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (item: Partial<TrackedItem>) => void;
  onBatchAddProducts?: (items: Partial<TrackedItem>[]) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export interface ConvertedProduct {
  id: string;
  selected: boolean;
  sku: string;
  name: string;
  specifications: string;
  units: number;
  invoicePrice?: number;
  unitPrice: number;
  suggestedSalePrice: number;
  category: string;
}

export default function GeminiInvoiceModal({
  isOpen,
  onClose,
  onAddProduct,
  onBatchAddProducts,
  showToast
}: GeminiInvoiceModalProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [rotation, setRotation] = useState<number>(0);
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.1-flash-lite');
  const [extractedProducts, setExtractedProducts] = useState<ConvertedProduct[]>([]);
  const [activeView, setActiveView] = useState<'upload' | 'table' | 'json'>('upload');
  const [rawJson, setRawJson] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setExtractedProducts([]);
      setRawJson('');
      setActiveView('upload');
      showToast('Imagen cargada. Haz clic en "Convertir Factura con Gemini"', 'info');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConvertInvoiceWithGemini = async () => {
    if (!imagePreview) {
      showToast('Por favor selecciona una foto de tu factura o recibo', 'error');
      return;
    }

    if (!navigator.onLine) {
      showToast('No hay conexión a internet para conectar con Gemini AI. Tu inventario local sigue operativo.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/convert-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: imageMimeType,
          profitMargin: profitMargin
        })
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Error al procesar la factura con Gemini');
      }

      const products: any[] = data.products || [];

      if (!Array.isArray(products) || products.length === 0) {
        showToast('Gemini analizó la imagen pero no encontró filas de productos claras. Intenta con una toma más cercana.', 'info');
        setIsLoading(false);
        return;
      }

      const formatted: ConvertedProduct[] = products.map((p, idx) => ({
        id: `gemini-prod-${Date.now()}-${idx}`,
        selected: true,
        sku: (p.sku || `ITEM-${idx + 101}`).toString().trim().toUpperCase(),
        name: (p.name || 'Producto sin nombre').toString().trim(),
        specifications: (p.specifications || 'Especificaciones no detalladas').toString().trim(),
        units: Math.max(1, parseInt(p.units, 10) || 1),
        invoicePrice: p.invoicePrice ? parseFloat(p.invoicePrice) : undefined,
        unitPrice: Math.max(0, parseFloat(p.unitPrice) || 0),
        suggestedSalePrice: Math.max(0, parseFloat(p.suggestedSalePrice) || Number(((p.unitPrice || 0) * (1 + profitMargin / 100)).toFixed(2))),
        category: (p.category || 'General').toString().trim()
      }));

      if (data.modelUsed) {
        setModelUsed(data.modelUsed);
      }
      setExtractedProducts(formatted);
      setRawJson(JSON.stringify(products, null, 2));
      setActiveView('table');
      setIsLoading(false);
      showToast(`¡Gemini extrajo ${formatted.length} productos desglosados en unidades! (${data.modelUsed || 'Gemini Flash Lite'})`, 'success');
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      showToast(err.message || 'Error de comunicación con Gemini AI', 'error');
    }
  };

  const handleUpdateProduct = (id: string, field: keyof ConvertedProduct, value: any) => {
    setExtractedProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        if (field === 'unitPrice') {
          const cost = parseFloat(value) || 0;
          updated.suggestedSalePrice = Number((cost * (1 + profitMargin / 100)).toFixed(2));
        }
        return updated;
      })
    );
  };

  const handleToggleSelect = (id: string) => {
    setExtractedProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleToggleSelectAll = (select: boolean) => {
    setExtractedProducts(prev => prev.map(p => ({ ...p, selected: select })));
  };

  const handleDeleteProduct = (id: string) => {
    setExtractedProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleAddManualRow = () => {
    const newProd: ConvertedProduct = {
      id: `manual-p-${Date.now()}`,
      selected: true,
      sku: `PROD-${extractedProducts.length + 101}`,
      name: 'Nuevo Producto Factura',
      specifications: 'Detalles del artículo',
      units: 1,
      unitPrice: 10.0,
      suggestedSalePrice: Number((10 * (1 + profitMargin / 100)).toFixed(2)),
      category: 'General'
    };
    setExtractedProducts([...extractedProducts, newProd]);
  };

  const handleApplySingle = (prod: ConvertedProduct) => {
    onAddProduct({
      sku: prod.sku,
      description: prod.name,
      vehicles: prod.specifications,
      qtyPdf: prod.units,
      qtyReceived: prod.units,
      unitPrice: prod.unitPrice,
      salePrice: prod.suggestedSalePrice,
      category: prod.category || 'General'
    });
    onClose();
  };

  const handleBatchImport = () => {
    const selected = extractedProducts.filter(p => p.selected);
    if (selected.length === 0) {
      showToast('Selecciona al menos un producto para importar', 'error');
      return;
    }

    if (onBatchAddProducts) {
      onBatchAddProducts(
        selected.map(p => ({
          sku: p.sku,
          description: p.name,
          vehicles: p.specifications,
          qtyPdf: p.units,
          qtyReceived: p.units,
          unitPrice: p.unitPrice,
          salePrice: p.suggestedSalePrice,
          category: p.category || 'General'
        }))
      );
      onClose();
    } else {
      handleApplySingle(selected[0]);
    }
  };

  const selectedCount = extractedProducts.filter(p => p.selected).length;
  const totalUnits = extractedProducts.filter(p => p.selected).reduce((sum, p) => sum + p.units, 0);
  const totalCost = extractedProducts.filter(p => p.selected).reduce((sum, p) => sum + p.units * p.unitPrice, 0);
  const totalExpectedSale = extractedProducts.filter(p => p.selected).reduce((sum, p) => sum + p.units * p.suggestedSalePrice, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-white/10 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-xl shadow-inner border border-white/20">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Convertidor de Facturas con Gemini AI
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-200 border border-blue-400/30">
                  Desglose JSON Inteligente
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Extrae SKU, Nombre, Especificaciones, Unidades (desglosando cajas en piezas) y Precios unitarios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Pestañas y Opciones */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveView('upload')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeView === 'upload'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📷 1. Foto de Factura
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer relative ${
                activeView === 'table'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📋 2. Productos Desglosados
              {extractedProducts.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] rounded-full">
                  {extractedProducts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveView('json')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeView === 'json'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {`{ }`} 3. Código JSON
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Margen Ganancia:</span>
              <input
                type="number"
                min="0"
                max="300"
                value={profitMargin}
                onChange={e => setProfitMargin(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-14 px-1.5 py-0.5 text-xs font-bold text-center border border-slate-300 rounded bg-white"
                title="Margen sugerido para calcular precio de venta"
              />
              <span className="text-slate-500">%</span>
            </div>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {/* VISTA 1: CARGA DE FACTURA Y CONVERSIÓN CON GEMINI */}
          {activeView === 'upload' && (
            <div className="space-y-4">
              {!imagePreview ? (
                <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-10 sm:p-14 text-center hover:border-indigo-500 transition-colors bg-indigo-50/20 flex flex-col items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    id="gemini-invoice-file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="gemini-invoice-file"
                    className="cursor-pointer flex flex-col items-center justify-center gap-3"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center text-3xl shadow-lg">
                      ✨
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-800">
                        Sube o toma una foto de la factura, recibo o albarán
                      </div>
                      <div className="text-xs text-slate-500 mt-1 max-w-md">
                        Gemini AI identificará automáticamente cada producto, su SKU, descripción/uso, y convertirá cajas en unidades individuales con su costo unitario exacto.
                      </div>
                    </div>
                    <span className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors">
                      Seleccionar Factura
                    </span>
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Panel de Control y Ejecución */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <span>✨</span>
                          <span>Análisis con Gemini AI</span>
                        </h3>
                        <label
                          htmlFor="gemini-invoice-file"
                          className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          Cambiar imagen
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          id="gemini-invoice-file"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>

                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-2 text-blue-900">
                        <div className="font-bold flex items-center gap-1.5 text-blue-950">
                          <span>🧠</span> Reglas de Extracción Inteligente:
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-blue-800">
                          <li>Extrae SKU, Nombre y Especificaciones/uso.</li>
                          <li><strong>Desglose de cajas:</strong> Si viene en cajas (ej. caja de 12), colocará 12 unidades y calculará el costo unitario de cada una.</li>
                          <li>Ignora membretes, RUC, cliente, IVA y subtotales.</li>
                        </ul>
                      </div>

                      {/* Orientación */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setRotation(r => (r - 90 + 360) % 360)}
                          className="flex-1 py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          ↺ Rotar -90°
                        </button>
                        <button
                          type="button"
                          onClick={() => setRotation(r => (r + 90) % 360)}
                          className="flex-1 py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          ↻ Rotar +90°
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleConvertInvoiceWithGemini}
                      disabled={isLoading}
                      className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isLoading
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:opacity-95 active:scale-98'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <span className="animate-spin text-base">✨</span>
                          <span>Gemini está convirtiendo la factura...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-base">🚀</span>
                          <span>Convertir Factura con Gemini AI</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Vista Previa de la Factura */}
                  <div className="lg:col-span-2 bg-slate-900 rounded-xl p-3 flex items-center justify-center overflow-hidden border border-slate-800 min-h-[380px]">
                    <div className="max-h-[460px] overflow-auto flex items-center justify-center p-2">
                      <img
                        src={imagePreview}
                        alt="Factura a convertir"
                        style={{
                          transform: `rotate(${rotation}deg)`,
                          transition: 'transform 0.2s ease-out'
                        }}
                        className="max-w-full max-h-[440px] object-contain rounded shadow-2xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISTA 2: TABLA DE PRODUCTOS DESGLOSADOS */}
          {activeView === 'table' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>📦</span>
                    <span>Productos Desglosados por Gemini ({extractedProducts.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cajas desglosadas en unidades individuales. Revisa o edita cualquier valor antes de guardar.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(true)}
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 cursor-pointer"
                  >
                    Seleccionar Todos
                  </button>
                  <button
                    type="button"
                    onClick={handleAddManualRow}
                    className="px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>+</span> Añadir Fila
                  </button>
                </div>
              </div>

              {extractedProducts.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <div className="text-3xl mb-2">📄</div>
                  <div className="text-sm font-bold text-slate-700">Aún no hay productos convertidos</div>
                  <div className="text-xs text-slate-500 mt-1 mb-4">
                    Sube una foto de factura en la Pestaña 1 y haz clic en "Convertir Factura con Gemini"
                  </div>
                  <button
                    onClick={() => setActiveView('upload')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                  >
                    Cargar Factura
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="p-2.5 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={extractedProducts.length > 0 && extractedProducts.every(p => p.selected)}
                              onChange={e => handleToggleSelectAll(e.target.checked)}
                              className="accent-indigo-600 cursor-pointer"
                            />
                          </th>
                          <th className="p-2.5 w-28">Código SKU</th>
                          <th className="p-2.5 min-w-[160px]">Nombre del Producto</th>
                          <th className="p-2.5 min-w-[180px]">Especificaciones / Uso</th>
                          <th className="p-2.5 w-20 text-center">Unidades</th>
                          <th className="p-2.5 w-28 text-right">P. Costo Unit.</th>
                          <th className="p-2.5 w-28 text-right">P. Venta Sugerido</th>
                          <th className="p-2.5 w-20 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {extractedProducts.map((prod) => (
                          <tr
                            key={prod.id}
                            className={`transition-colors ${
                              prod.selected ? 'bg-indigo-50/20 hover:bg-indigo-50/40' : 'bg-slate-50/40 opacity-60'
                            }`}
                          >
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={prod.selected}
                                onChange={() => handleToggleSelect(prod.id)}
                                className="accent-indigo-600 cursor-pointer"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={prod.sku}
                                onChange={e => handleUpdateProduct(prod.id, 'sku', e.target.value)}
                                className="w-full px-2 py-1 text-xs font-mono font-bold text-indigo-700 bg-white border border-slate-200 rounded focus:border-indigo-500 focus:outline-hidden"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={prod.name}
                                onChange={e => handleUpdateProduct(prod.id, 'name', e.target.value)}
                                className="w-full px-2 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded focus:border-indigo-500 focus:outline-hidden"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={prod.specifications}
                                onChange={e => handleUpdateProduct(prod.id, 'specifications', e.target.value)}
                                className="w-full px-2 py-1 text-xs text-slate-600 bg-white border border-slate-200 rounded focus:border-indigo-500 focus:outline-hidden"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                min="1"
                                max="99999"
                                value={prod.units}
                                onChange={e =>
                                  handleUpdateProduct(
                                    prod.id,
                                    'units',
                                    Math.max(1, parseInt(e.target.value, 10) || 1)
                                  )
                                }
                                className="w-16 px-1.5 py-1 text-xs font-bold text-center text-slate-800 bg-white border border-slate-200 rounded focus:border-indigo-500 focus:outline-hidden"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <div className="relative">
                                <span className="absolute left-2 top-1 text-slate-400 font-bold">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={prod.unitPrice}
                                  onChange={e =>
                                    handleUpdateProduct(
                                      prod.id,
                                      'unitPrice',
                                      Math.max(0, parseFloat(e.target.value) || 0)
                                    )
                                  }
                                  className="w-24 pl-5 pr-2 py-1 text-xs font-bold text-right text-slate-800 bg-white border border-slate-200 rounded focus:border-indigo-500 focus:outline-hidden"
                                />
                              </div>
                            </td>
                            <td className="p-2 text-right">
                              <div className="relative">
                                <span className="absolute left-2 top-1 text-emerald-600 font-bold">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={prod.suggestedSalePrice}
                                  onChange={e =>
                                    handleUpdateProduct(
                                      prod.id,
                                      'suggestedSalePrice',
                                      Math.max(0, parseFloat(e.target.value) || 0)
                                    )
                                  }
                                  className="w-24 pl-5 pr-2 py-1 text-xs font-bold text-right text-emerald-700 bg-white border border-emerald-300 rounded focus:border-emerald-500 focus:outline-hidden"
                                />
                              </div>
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleApplySingle(prod)}
                                  className="p-1 px-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 cursor-pointer"
                                  title="Cargar al formulario individual"
                                >
                                  Cargar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="p-1 text-red-500 hover:text-red-700 rounded cursor-pointer"
                                  title="Eliminar fila"
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

                  {/* Resumen y Botón de Importación */}
                  <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-slate-600">
                      <span>
                        Seleccionados: <strong className="text-slate-900">{selectedCount}</strong> productos
                      </span>
                      <span>
                        Unidades Totales: <strong className="text-slate-900">{totalUnits}</strong>
                      </span>
                      <span>
                        Costo Total: <strong className="text-slate-900 font-mono">${totalCost.toFixed(2)}</strong>
                      </span>
                      <span>
                        Venta Esperada: <strong className="text-emerald-700 font-mono">${totalExpectedSale.toFixed(2)}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleBatchImport}
                      disabled={selectedCount === 0}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-white shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        selectedCount === 0
                          ? 'bg-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98'
                      }`}
                    >
                      <span>📥</span>
                      <span>Importar al Inventario ({selectedCount} productos)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISTA 3: CÓDIGO JSON GENERADO */}
          {activeView === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Código JSON Extraído por Gemini
                  </h3>
                  <p className="text-xs text-slate-500">
                    Estructura normalizada en JSON según el prompt requerido
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(rawJson);
                    showToast('Código JSON copiado al portapapeles', 'success');
                  }}
                  disabled={!rawJson}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:bg-slate-300"
                >
                  📋 Copiar JSON
                </button>
              </div>

              <textarea
                value={rawJson}
                readOnly
                placeholder="Aquí aparecerá el código JSON estructurado generado por Gemini..."
                className="w-full h-72 p-3 font-mono text-xs text-slate-800 bg-slate-900 text-emerald-400 rounded-xl focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Alimentado por Gemini 3.1 Flash Lite (Baja demanda) • Desglose automático de cajas a unidades</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
