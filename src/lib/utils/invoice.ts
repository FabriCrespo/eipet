/**
 * Utilidades para generar facturas
 */

import type { Order } from '../db/types';

/**
 * Generar número de factura único
 * Formato: FACT-YYYYMMDD-XXXX
 */
export function generateInvoiceNumber(orderId: string, createdAt: Date): string {
  const date = createdAt;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Si el orderId es 'TEMP', generar un número aleatorio
  // Si no, usar los primeros caracteres del ID
  let identifier: string;
  if (orderId === 'TEMP' || orderId.length < 4) {
    // Generar un identificador aleatorio de 4 caracteres alfanuméricos
    identifier = Math.random().toString(36).substring(2, 6).toUpperCase();
  } else {
    identifier = orderId.substring(0, 4).toUpperCase();
  }
  
  return `FACT-${year}${month}${day}-${identifier}`;
}

/**
 * Generar HTML de factura para imprimir
 */
export function generateInvoiceHTML(order: Order, userData: any): string {
  const invoiceNumber = order.invoiceNumber || generateInvoiceNumber(order.id, order.createdAt ? (order.createdAt instanceof Date ? order.createdAt : order.createdAt.toDate()) : new Date());
  const orderDate = order.createdAt ? (order.createdAt instanceof Date ? order.createdAt : order.createdAt.toDate()) : new Date();
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(orderDate);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
      background: #fff;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #5d3fbb;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #5d3fbb;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: bold;
      color: #5d3fbb;
      margin-bottom: 10px;
    }
    .invoice-number {
      font-size: 18px;
      color: #666;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #5d3fbb;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid #e0e0e0;
    }
    .two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .info-item {
      margin-bottom: 8px;
    }
    .info-label {
      font-weight: bold;
      color: #666;
      font-size: 14px;
    }
    .info-value {
      color: #333;
      font-size: 16px;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead {
      background: #5d3fbb;
      color: #fff;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    th {
      font-weight: bold;
    }
    tbody tr:hover {
      background: #f5f5f5;
    }
    .text-right {
      text-align: right;
    }
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .total-row:last-child {
      border-bottom: 2px solid #5d3fbb;
      font-weight: bold;
      font-size: 18px;
      color: #5d3fbb;
      margin-top: 10px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="logo">eipet</div>
      <div class="invoice-info">
        <div class="invoice-title">FACTURA</div>
        <div class="invoice-number">${invoiceNumber}</div>
      </div>
    </div>

    <div class="two-columns">
      <div class="section">
        <div class="section-title">Información del Cliente</div>
        <div class="info-item">
          <div class="info-label">Nombre:</div>
          <div class="info-value">${userData?.firstName || ''} ${userData?.lastName || ''}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email:</div>
          <div class="info-value">${userData?.email || ''}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Teléfono:</div>
          <div class="info-value">${userData?.phone || ''}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Información del Pedido</div>
        <div class="info-item">
          <div class="info-label">Fecha:</div>
          <div class="info-value">${formattedDate}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Pedido #:</div>
          <div class="info-value">${order.id}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Estado:</div>
          <div class="info-value">${order.status}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Dirección de Envío</div>
      <div class="info-value">
        ${order.shippingAddress.fullName || ''}<br>
        ${order.shippingAddress.address || ''}<br>
        ${order.shippingAddress.city || ''}, ${order.shippingAddress.district || ''}<br>
        ${order.shippingAddress.zipCode || ''}<br>
        ${order.shippingAddress.phone || ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Productos</div>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th class="text-right">Cantidad</th>
            <th class="text-right">Precio Unit.</th>
            <th class="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr>
              <td>${item.productName}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">Bs. ${item.price.toFixed(2)}</td>
              <td class="text-right">Bs. ${item.subtotal.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>Bs. ${order.subtotal.toFixed(2)}</span>
      </div>
      ${order.discount > 0 ? `
      <div class="total-row">
        <span>Descuento:</span>
        <span>-Bs. ${order.discount.toFixed(2)}</span>
      </div>
      ` : ''}
      <div class="total-row">
        <span>Total:</span>
        <span>Bs. ${order.total.toFixed(2)}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Método de Pago</div>
      <div class="info-value">
        ${order.paymentMethod.type === 'card' ? 'Tarjeta de Crédito/Débito' : 'Efectivo'}<br>
        ${order.paymentMethod.type === 'card' && order.paymentMethod.cardNumber ? 
          `Terminada en: ${order.paymentMethod.cardNumber.slice(-4)}` : ''}
      </div>
    </div>

    <div class="footer">
      <p>Gracias por tu compra en eipet</p>
      <p>Para consultas, contacta a nuestro servicio al cliente</p>
    </div>
  </div>

  <script>
    // Auto-imprimir al cargar (opcional, comentado por defecto)
    // window.onload = function() {
    //   window.print();
    // }
  </script>
</body>
</html>
  `;

  return html;
}

/**
 * Abrir factura en nueva ventana para imprimir
 */
export function openInvoice(order: Order, userData: any): void {
  const html = generateInvoiceHTML(order, userData);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    // Opcional: auto-imprimir
    // printWindow.onload = function() {
    //   printWindow.print();
    // }
  }
}

/**
 * Descargar factura como HTML
 */
export function downloadInvoice(order: Order, userData: any): void {
  const html = generateInvoiceHTML(order, userData);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `factura-${order.invoiceNumber || order.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

