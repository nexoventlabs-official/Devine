import PDFDocument from 'pdfkit';
import cloudinaryService from './cloudinary.js';

// Render a PDFKit doc to a Buffer.
function toBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

const rupee = (n) => `Rs.${Number(n || 0).toFixed(2)}`;

// Generate a B2C invoice PDF and return a public Cloudinary URL.
export async function generateInvoicePdf(order) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  doc.fillColor('#1a7f37').fontSize(22).text('Devine Natural Foods', { align: 'left' });
  doc.fillColor('#555').fontSize(10).text('Natural, preservative-free products from Tamil Nadu');
  doc.moveDown();

  doc.fillColor('#000').fontSize(16).text('Tax Invoice', { align: 'right' });
  doc.fontSize(10).fillColor('#333')
    .text(`Order ID: ${order.orderId}`, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleString('en-IN')}`, { align: 'right' });
  doc.moveDown();

  doc.fillColor('#000').fontSize(12).text('Bill To:');
  doc.fontSize(10).fillColor('#333')
    .text(order.customer?.name || 'Customer')
    .text(order.customer?.phone || '')
    .text(order.deliveryLocation?.address || '');
  doc.moveDown();

  // Items table
  const startY = doc.y;
  doc.fontSize(10).fillColor('#000');
  doc.text('Item', 50, startY);
  doc.text('Qty', 320, startY);
  doc.text('Price', 380, startY);
  doc.text('Amount', 470, startY);
  doc.moveTo(50, startY + 15).lineTo(545, startY + 15).strokeColor('#ccc').stroke();

  let y = startY + 25;
  (order.items || []).forEach((it) => {
    doc.fillColor('#333')
      .text(it.name, 50, y, { width: 260 })
      .text(String(it.quantity), 320, y)
      .text(rupee(it.price), 380, y)
      .text(rupee(it.price * it.quantity), 470, y);
    y += 22;
  });

  doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor('#ccc').stroke();
  y += 15;
  doc.fillColor('#000')
    .text('Items Total', 380, y).text(rupee(order.itemsTotal), 470, y);
  y += 18;
  doc.text('Delivery', 380, y).text(rupee(order.deliveryCharge), 470, y);
  y += 18;
  doc.fontSize(12).text('Grand Total', 380, y).text(rupee(order.totalAmount), 470, y);

  doc.moveDown(4);
  doc.fontSize(9).fillColor('#888')
    .text('Thank you for choosing Devine. This is a system-generated invoice.', 50, 760, { align: 'center' });

  const buffer = await toBuffer(doc);
  return cloudinaryService.uploadBuffer(buffer, {
    folder: 'devine/invoices',
    publicId: `invoice_${order.orderId}`,
    resourceType: 'raw'
  });
}

// Generate a dealer info PDF (used if no static PDF uploaded in admin).
export async function generateDealerInfoPdf(lead) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.fillColor('#1a7f37').fontSize(22).text('Devine Dealer Information');
  doc.moveDown();
  doc.fillColor('#000').fontSize(12).text('Dealer Margin: 20-35% depending on product and volume.');
  doc.moveDown();
  doc.fontSize(11).fillColor('#333').text(`Business: ${lead.businessName || ''}`);
  doc.text(`Location: ${[lead.city, lead.district, lead.state].filter(Boolean).join(', ')}`);
  doc.text(`Type: ${lead.businessType || ''}`);
  doc.text(`Capacity: ${lead.capacity || ''}`);
  const buffer = await toBuffer(doc);
  return cloudinaryService.uploadBuffer(buffer, {
    folder: 'devine/dealer-info',
    publicId: `dealer_${lead._id}`,
    resourceType: 'raw'
  });
}

export default { generateInvoicePdf, generateDealerInfoPdf };
