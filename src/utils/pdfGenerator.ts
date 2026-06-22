import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { FacturaRow } from '../database/repositories/facturasRepository';
import { ClienteRow } from '../database/repositories/clientesRepository';
import { EmpresaRow } from '../database/repositories/empresaRepository';
import { MonedaRow } from '../database/repositories/monedasRepository';
import { formatDate, formatCurrency } from './helpers';
import { DEFAULT_LOGO_BASE64, DEFAULT_FIRMA_BASE64 } from '../constants/defaultImages';

export interface PdfData {
  factura: FacturaRow;
  cliente: ClienteRow | null;
  clienteId: number | null;
  empresa: EmpresaRow | null;
  moneda: MonedaRow | null;
  articulos: { nombre: string; cantidad: number; precio_unitario: number }[];
}

const imageToBase64 = async (uri: string | null | undefined): Promise<string | null> => {
  if (!uri) return null;
  if (uri.startsWith('data:')) return uri;
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpeg';
    const mime = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
};

interface HtmlImages {
  logoSrc: string | null;
  firmaSrc: string | null;
}

const generateHtml = (data: PdfData, images?: HtmlImages): string => {
  const { factura, cliente, empresa, moneda, articulos } = data;
  const simbolo = moneda?.simbolo || '$';
  const nombreCliente = cliente
    ? `${cliente.nombre} ${cliente.primerApellido} ${cliente.segundoApellido || ''}`.trim()
    : 'Cliente no encontrado';
  const logoSrc = images?.logoSrc || empresa?.logo;
  const firmaSrc = images?.firmaSrc || empresa?.firma;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Factura ${factura.codigoFactura}</title>
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      margin: 30px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #0A84FF;
      font-size: 24px;
      margin: 0;
    }
    .header .codigo {
      color: #666;
      font-size: 14px;
      margin-top: 5px;
    }
    .empresa-info {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #0A84FF;
    }
    .empresa-info .empresa-text {
      flex: 1;
    }
    .empresa-info h2 {
      color: #001529;
      font-size: 18px;
      margin: 0 0 5px 0;
    }
    .empresa-info p {
      color: #666;
      font-size: 12px;
      margin: 2px 0;
    }
    .section {
      margin: 20px 0;
    }
    .section h3 {
      color: #0A84FF;
      font-size: 14px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .section p {
      color: #333;
      font-size: 12px;
      margin: 4px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    table th {
      background-color: #0A84FF;
      color: white;
      font-size: 12px;
      padding: 8px;
      text-align: left;
    }
    table td {
      font-size: 12px;
      padding: 8px;
      border-bottom: 1px solid #eee;
    }
    table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .totals {
      margin-top: 20px;
      text-align: right;
    }
    .totals p {
      font-size: 14px;
      margin: 4px 0;
    }
    .totals .total {
      font-size: 18px;
      font-weight: bold;
      color: #0A84FF;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #999;
      font-size: 10px;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    .firma-img {
      max-width: 200px;
      max-height: 80px;
      margin-top: 10px;
    }
    .logo-img {
      max-width: 150px;
      max-height: 80px;
    }
  </style>
</head>
<body>
  ${empresa ? `
  <div class="empresa-info">
    ${logoSrc ? `<div><img src="${logoSrc}" class="logo-img" alt="Logo" /></div>` : ''}
    <div class="empresa-text">
      <h2>${empresa.nombre}</h2>
      ${empresa.direccion ? `<p>${empresa.direccion}</p>` : ''}
      ${empresa.telefono ? `<p>Tel: ${empresa.telefono}</p>` : ''}
      ${empresa.email ? `<p>${empresa.email}</p>` : ''}
    </div>
  </div>
  ` : ''}

  <div class="header">
    <h1>FACTURA</h1>
    <p class="codigo">${factura.codigoFactura}</p>
  </div>

  <div class="section">
    <h3>Datos del Cliente</h3>
    <p><strong>Nombre:</strong> ${nombreCliente}</p>
    ${cliente?.carnetIdentidad ? `<p><strong>CI:</strong> ${cliente.carnetIdentidad}</p>` : ''}
    ${cliente?.direccion ? `<p><strong>Dirección:</strong> ${cliente.direccion}</p>` : ''}
    ${cliente?.telefono ? `<p><strong>Teléfono:</strong> ${cliente.telefono}</p>` : ''}
    ${cliente?.gmail ? `<p><strong>Email:</strong> ${cliente.gmail}</p>` : ''}
  </div>

  <div class="section">
    <h3>Detalle de Factura</h3>
    <p><strong>Fecha:</strong> ${formatDate(factura.fecha)}</p>
    <p><strong>Forma de Pago:</strong> ${factura.formaPago}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Artículo</th>
        <th>Cant.</th>
        <th>Precio Unit.</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${(articulos || []).map(art => `
      <tr>
        <td>${art.nombre}</td>
        <td>${art.cantidad}</td>
        <td>${formatCurrency(art.precio_unitario, simbolo)}</td>
        <td>${formatCurrency(art.cantidad * art.precio_unitario, simbolo)}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <p><strong>Subtotal:</strong> ${formatCurrency(factura.subTotal, simbolo)}</p>
    <p><strong>Impuesto:</strong> ${formatCurrency(factura.impuesto, simbolo)}</p>
    <p class="total">TOTAL: ${formatCurrency(factura.total, simbolo)}</p>
  </div>

  ${firmaSrc ? `<div style="text-align:right"><img src="${firmaSrc}" class="firma-img" alt="Firma" /></div>` : ''}

  <div class="footer">
    Documento generado por Events Planner
  </div>
</body>
</html>`;
};

export const generarFacturaPdf = async (data: PdfData): Promise<string> => {
  const [logoSrc, firmaSrc] = await Promise.all([
    imageToBase64(data.empresa?.logo).then(r => r || DEFAULT_LOGO_BASE64),
    imageToBase64(data.empresa?.firma).then(r => r || DEFAULT_FIRMA_BASE64),
  ]);
  const html = generateHtml(data, { logoSrc, firmaSrc });
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
};

export const generarFacturaPdfBase64 = async (data: PdfData): Promise<string> => {
  const uri = await generarFacturaPdf(data);
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
};