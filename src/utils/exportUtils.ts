import ExcelJS from 'exceljs';
import { TrackedItem, Sale } from '../data/inventory';

export const exportInventoryToExcel = async (
  items: TrackedItem[],
  storeName: string,
  getStockForItem: (item: TrackedItem) => number,
  calculateStatus: (qtyPdf: number, qtyReceived: number | null) => string
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AdminLocalSimple';
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet('Inventario General', {
    views: [{ state: 'frozen', ySplit: 8, xSplit: 0 }],
    properties: { defaultRowHeight: 22 }
  });

  const totalProductos = items.length;
  const totalStock = items.reduce((sum, i) => sum + getStockForItem(i), 0);
  const totalEsperado = items.reduce((sum, i) => sum + i.qtyPdf, 0);
  const totalFisico = items.reduce((sum, i) => sum + (i.qtyReceived || 0), 0);
  const valorInventario = items.reduce((sum, i) => sum + (getStockForItem(i) * i.unitPrice), 0);
  const valorVenta = items.reduce((sum, i) => sum + (getStockForItem(i) * i.salePrice), 0);
  const gananciaPotencial = valorVenta - valorInventario;

  worksheet.columns = [
    { key: 'num', width: 6 },
    { key: 'sku', width: 18 },
    { key: 'description', width: 36 },
    { key: 'category', width: 22 },
    { key: 'vehicles', width: 30 },
    { key: 'qtyPdf', width: 15 },
    { key: 'qtyReceived', width: 15 },
    { key: 'stock', width: 14 },
    { key: 'unitPrice', width: 15 },
    { key: 'salePrice', width: 15 },
    { key: 'valorTotal', width: 16 },
    { key: 'status', width: 15 },
  ];

  const now = new Date();
  const fecha = now.toLocaleDateString();
  const hora = now.toLocaleTimeString();

  // Fila 1: Banner Principal Corporativo
  worksheet.mergeCells('A1:L1');
  const banner = worksheet.getCell('A1');
  banner.value = `🏪 ${storeName.toUpperCase()} — CONTROL DE INVENTARIO Y EXISTENCIAS`;
  banner.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  banner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
  banner.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 40;

  // Fila 2: Subtítulo
  worksheet.mergeCells('A2:L2');
  const subBanner = worksheet.getCell('A2');
  subBanner.value = 'PLATAFORMA COMERCIAL ADMINLOCALSIMPLE • REPORTE DETALLADO DE STOCK Y VALORACIÓN';
  subBanner.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF64748B' } };
  subBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subBanner.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Fila 3: Información de emisión
  worksheet.mergeCells('A3:F3');
  const metaLeft = worksheet.getCell('A3');
  metaLeft.value = `📅 Fecha de emisión: ${fecha}  |  ⏰ Hora: ${hora}`;
  metaLeft.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF475569' } };
  metaLeft.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  worksheet.mergeCells('G3:L3');
  const metaRight = worksheet.getCell('G3');
  metaRight.value = `📊 Total productos únicos: ${totalProductos} | Unidades en Almacén: ${totalStock}`;
  metaRight.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF312E81' } };
  metaRight.alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getRow(3).height = 20;

  // Fila 5: Tarjetas de Resumen KPI Financiero
  worksheet.mergeCells('A5:C5');
  const kpi1 = worksheet.getCell('A5');
  kpi1.value = `📦 INVENTARIO (COSTO)\n$${valorInventario.toFixed(2)}`;
  kpi1.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
  kpi1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  kpi1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  kpi1.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells('D5:F5');
  const kpi2 = worksheet.getCell('D5');
  kpi2.value = `💵 VALORACIÓN EN VENTA\n$${valorVenta.toFixed(2)}`;
  kpi2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF065F46' } };
  kpi2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
  kpi2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  kpi2.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells('G5:I5');
  const kpi3 = worksheet.getCell('G5');
  kpi3.value = `📈 GANANCIA POTENCIAL\n$${gananciaPotencial.toFixed(2)}`;
  kpi3.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
  kpi3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
  kpi3.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  kpi3.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells('J5:L5');
  const kpi4 = worksheet.getCell('J5');
  kpi4.value = `🏷️ STOCK TOTAL DISPONIBLE\n${totalStock} Unidades`;
  kpi4.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF701A75' } };
  kpi4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5D0FE' } };
  kpi4.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  kpi4.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getRow(5).height = 36;

  worksheet.getRow(6).height = 10;
  worksheet.getRow(7).height = 10;

  // Fila 8: Encabezados de la Tabla
  const headerRowNum = 8;
  const headerRow = worksheet.getRow(headerRowNum);
  const headers = [
    'N°',
    'CÓDIGO SKU',
    'DESCRIPCIÓN DEL PRODUCTO',
    'CATEGORÍA',
    'DETALLES / VARIANTES',
    'STOCK ESPERADO',
    'STOCK FÍSICO',
    'DISPONIBLE',
    'PRECIO COSTO',
    'PRECIO VENTA',
    'TOTAL VENTA',
    'ESTADO STOCK'
  ];

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      right: { style: 'thin', color: { argb: 'FF334155' } }
    };
  });
  headerRow.height = 30;

  // Llenar Datos con Estilos y Efecto Cebra
  items.forEach((item, index) => {
    const rowNum = headerRowNum + index + 1;
    const stock = getStockForItem(item);
    const status = calculateStatus(item.qtyPdf, item.qtyReceived);
    const statusText = {
      ok: '✅ Completo',
      missing: '❌ Faltante',
      partial: '⚠️ Parcial',
      pending: '⏳ Pendiente',
      extra: '⭐ Extra'
    }[status] || status;

    const row = worksheet.addRow({
      num: index + 1,
      sku: item.sku,
      description: item.description,
      category: item.category || 'General',
      vehicles: item.vehicles || '-',
      qtyPdf: item.qtyPdf,
      qtyReceived: item.qtyReceived || 0,
      stock: stock,
      unitPrice: item.unitPrice,
      salePrice: item.salePrice,
      valorTotal: stock * item.salePrice,
      status: statusText,
    });

    const isEven = index % 2 === 0;
    const bgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      if (colNumber === 1) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF64748B' } };
      } else if (colNumber === 2) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Consolas', size: 9, bold: true, color: { argb: 'FF4338CA' } };
      } else if (colNumber === 3) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF0F172A' } };
      } else if (colNumber === 4 || colNumber === 5) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (colNumber === 6 || colNumber === 7) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 8) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (stock <= 0) {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF991B1B' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        } else if (stock < 5) {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF92400E' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        } else {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF065F46' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        }
      } else if (colNumber === 9 || colNumber === 10 || colNumber === 11) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '$#,##0.00';
        if (colNumber === 10) {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF047857' } };
        } else if (colNumber === 11) {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF1D4ED8' } };
        }
      } else if (colNumber === 12) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 9, bold: true };
      }
    });

    row.height = 24;
  });

  // Fila de Totales Generales
  if (items.length > 0) {
    const totalRowNum = headerRowNum + items.length + 1;
    worksheet.mergeCells(`A${totalRowNum}:E${totalRowNum}`);
    const labelTotal = worksheet.getCell(`A${totalRowNum}`);
    labelTotal.value = 'TOTALES GENERALES:';
    labelTotal.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    labelTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
    labelTotal.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };

    const c6 = worksheet.getCell(`F${totalRowNum}`);
    c6.value = totalEsperado;
    c6.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c6.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
    c6.alignment = { horizontal: 'center', vertical: 'middle' };

    const c7 = worksheet.getCell(`G${totalRowNum}`);
    c7.value = totalFisico;
    c7.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c7.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
    c7.alignment = { horizontal: 'center', vertical: 'middle' };

    const c8 = worksheet.getCell(`H${totalRowNum}`);
    c8.value = totalStock;
    c8.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c8.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
    c8.alignment = { horizontal: 'center', vertical: 'middle' };

    const c9 = worksheet.getCell(`I${totalRowNum}`);
    c9.value = valorInventario;
    c9.numFmt = '$#,##0.00';
    c9.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c9.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
    c9.alignment = { horizontal: 'right', vertical: 'middle' };

    const c10 = worksheet.getCell(`J${totalRowNum}`);
    c10.value = '';
    c10.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };

    const c11 = worksheet.getCell(`K${totalRowNum}`);
    c11.value = valorVenta;
    c11.numFmt = '$#,##0.00';
    c11.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    c11.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };
    c11.alignment = { horizontal: 'right', vertical: 'middle' };

    const c12 = worksheet.getCell(`L${totalRowNum}`);
    c12.value = '';
    c12.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF312E81' } };

    worksheet.getRow(totalRowNum).height = 28;
    worksheet.autoFilter = {
      from: { row: headerRowNum, column: 1 },
      to: { row: headerRowNum + items.length, column: 12 }
    };
  }

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

export const exportSalesToExcel = async (sales: Sale[], storeName: string) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AdminLocalSimple';
  workbook.created = new Date();
  const worksheet = workbook.addWorksheet('Reporte de Ventas', {
    views: [{ state: 'frozen', ySplit: 8, xSplit: 0 }],
    properties: { defaultRowHeight: 22 }
  });

  const totalVentas = sales.length;
  const montoTotal = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const gananciaTotal = sales.reduce((sum, s) => sum + ((s.salePrice - s.unitPrice) * s.quantity), 0);
  const ventasPagadas = sales.filter(s => !s.paymentPending);
  const ventasPendientes = sales.filter(s => s.paymentPending);
  const montoCobrado = ventasPagadas.reduce((sum, s) => sum + s.totalPrice, 0);
  const montoPendiente = ventasPendientes.reduce((sum, s) => sum + s.totalPrice, 0);

  worksheet.columns = [
    { key: 'num', width: 6 },
    { key: 'date', width: 14 },
    { key: 'customerName', width: 24 },
    { key: 'customerPhone', width: 16 },
    { key: 'customerId', width: 15 },
    { key: 'sku', width: 16 },
    { key: 'description', width: 34 },
    { key: 'quantity', width: 10 },
    { key: 'unitPrice', width: 14 },
    { key: 'salePrice', width: 14 },
    { key: 'totalPrice', width: 15 },
    { key: 'profit', width: 14 },
    { key: 'payment', width: 16 },
    { key: 'notes', width: 26 },
  ];

  const now = new Date();
  const fecha = now.toLocaleDateString();
  const hora = now.toLocaleTimeString();

  // Fila 1: Banner Principal
  worksheet.mergeCells('A1:N1');
  const banner = worksheet.getCell('A1');
  banner.value = `🏪 ${storeName.toUpperCase()} — REPORTE DE VENTAS Y FLUJO DE CAJA`;
  banner.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  banner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
  banner.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 40;

  // Fila 2: Subtítulo
  worksheet.mergeCells('A2:N2');
  const subBanner = worksheet.getCell('A2');
  subBanner.value = 'PLATAFORMA COMERCIAL ADMINLOCALSIMPLE • HISTORIAL DE OPERACIONES Y COBRANZAS';
  subBanner.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF475569' } };
  subBanner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  subBanner.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Fila 3: Metadatos
  worksheet.mergeCells('A3:G3');
  const metaLeft = worksheet.getCell('A3');
  metaLeft.value = `📅 Exportado el: ${fecha}  |  ⏰ Hora: ${hora}`;
  metaLeft.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF475569' } };
  metaLeft.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  worksheet.mergeCells('H3:N3');
  const metaRight = worksheet.getCell('H3');
  metaRight.value = `🛍️ Total operaciones: ${totalVentas} | Pagadas: ${ventasPagadas.length} | Por Cobrar: ${ventasPendientes.length}`;
  metaRight.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF065F46' } };
  metaRight.alignment = { horizontal: 'right', vertical: 'middle' };
  worksheet.getRow(3).height = 20;

  // Fila 5: Tarjetas KPI Financiero de Ventas
  worksheet.mergeCells('A5:C5');
  const kpi1 = worksheet.getCell('A5');
  kpi1.value = `💰 TOTAL FACTURADO\n$${montoTotal.toFixed(2)}`;
  kpi1.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E293B' } };
  kpi1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  kpi1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  kpi1.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells('D5:F5');
  const kpi2 = worksheet.getCell('D5');
  kpi2.value = `✅ COBRADO EN CAJA\n$${montoCobrado.toFixed(2)}`;
  kpi2.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF065F46' } };
  kpi2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
  kpi2.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  kpi2.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells('G5:I5');
  const kpi3 = worksheet.getCell('G5');
  kpi3.value = `⏳ SALDO POR COBRAR\n$${montoPendiente.toFixed(2)}`;
  kpi3.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF9A3412' } };
  kpi3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEDD5' } };
  kpi3.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  kpi3.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells('J5:N5');
  const kpi4 = worksheet.getCell('J5');
  kpi4.value = `📈 GANANCIA NETA TOTAL\n$${gananciaTotal.toFixed(2)}`;
  kpi4.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
  kpi4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
  kpi4.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  kpi4.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getRow(5).height = 36;

  worksheet.getRow(6).height = 10;
  worksheet.getRow(7).height = 10;

  // Fila 8: Encabezados de la Tabla
  const headerRowNum = 8;
  const headerRow = worksheet.getRow(headerRowNum);
  const headers = [
    'N°',
    'FECHA',
    'CLIENTE',
    'TELÉFONO',
    'ID / CÉDULA',
    'SKU',
    'PRODUCTO',
    'CANT.',
    'P. COSTO',
    'P. VENTA',
    'TOTAL VENTA',
    'GANANCIA',
    'ESTADO PAGO',
    'NOTAS'
  ];

  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF044E39' } },
      bottom: { style: 'medium', color: { argb: 'FF044E39' } },
      left: { style: 'thin', color: { argb: 'FF0D9488' } },
      right: { style: 'thin', color: { argb: 'FF0D9488' } }
    };
  });
  headerRow.height = 30;

  sales.forEach((sale, index) => {
    const profit = (sale.salePrice - sale.unitPrice) * sale.quantity;
    const isEven = index % 2 === 0;
    const bgColor = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    const row = worksheet.addRow({
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
      payment: sale.paymentPending ? '⏳ Por Cobrar' : '✅ Cobrado',
      notes: sale.notes || '-',
    });

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 9, color: { argb: 'FF1E293B' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      if (colNumber === 1 || colNumber === 2) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 3) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF0F172A' } };
      } else if (colNumber === 6) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Consolas', size: 9, bold: true, color: { argb: 'FF4338CA' } };
      } else if (colNumber === 8) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 9, bold: true };
      } else if (colNumber >= 9 && colNumber <= 12) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '$#,##0.00';
        if (colNumber === 11) {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF047857' } };
        } else if (colNumber === 12) {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: profit >= 0 ? { argb: 'FF047857' } : { argb: 'FFDC2626' } };
        }
      } else if (colNumber === 13) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (sale.paymentPending) {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF92400E' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        } else {
          cell.font = { name: 'Segoe UI', size: 9, bold: true, color: { argb: 'FF065F46' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        }
      }
    });

    row.height = 24;
  });

  // Totales de Ventas
  if (sales.length > 0) {
    const totalRowNum = headerRowNum + sales.length + 1;
    worksheet.mergeCells(`A${totalRowNum}:G${totalRowNum}`);
    const labelTotal = worksheet.getCell(`A${totalRowNum}`);
    labelTotal.value = 'TOTALES DE OPERACIONES:';
    labelTotal.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    labelTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
    labelTotal.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };

    const cQty = worksheet.getCell(`H${totalRowNum}`);
    cQty.value = sales.reduce((sum, s) => sum + s.quantity, 0);
    cQty.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cQty.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
    cQty.alignment = { horizontal: 'center', vertical: 'middle' };

    const cCosto = worksheet.getCell(`I${totalRowNum}`);
    cCosto.value = '';
    cCosto.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };

    const cVenta = worksheet.getCell(`J${totalRowNum}`);
    cVenta.value = '';
    cVenta.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };

    const cTotal = worksheet.getCell(`K${totalRowNum}`);
    cTotal.value = montoTotal;
    cTotal.numFmt = '$#,##0.00';
    cTotal.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
    cTotal.alignment = { horizontal: 'right', vertical: 'middle' };

    const cProfit = worksheet.getCell(`L${totalRowNum}`);
    cProfit.value = gananciaTotal;
    cProfit.numFmt = '$#,##0.00';
    cProfit.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cProfit.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
    cProfit.alignment = { horizontal: 'right', vertical: 'middle' };

    const cPay = worksheet.getCell(`M${totalRowNum}`);
    cPay.value = `✅$${montoCobrado.toFixed(0)} | ⏳$${montoPendiente.toFixed(0)}`;
    cPay.font = { name: 'Segoe UI', size: 8, bold: true, color: { argb: 'FFFFFFFF' } };
    cPay.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
    cPay.alignment = { horizontal: 'center', vertical: 'middle' };

    const cNotes = worksheet.getCell(`N${totalRowNum}`);
    cNotes.value = '';
    cNotes.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };

    worksheet.getRow(totalRowNum).height = 28;
    worksheet.autoFilter = {
      from: { row: headerRowNum, column: 1 },
      to: { row: headerRowNum + sales.length, column: 14 }
    };
  }

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
