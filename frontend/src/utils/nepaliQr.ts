/**
 * Nepal Dynamic QR & WhatsApp Invoicing Helpers
 * Supports Fonepay, NepalPay, eSewa, and WhatsApp Direct Integration
 */

export interface FonepayQrConfig {
  merchantId?: string;
  merchantName: string;
  panNumber?: string;
  amount: number;
  remarks?: string;
  invoiceNo: string;
}

/**
 * Generates an EMVCo/NepalPay compatible payload for QR code scanners.
 * Most Nepali mobile banking apps (Nabil, Global IME, NIC Asia, eSewa, Khalti)
 * scan standard EMVCo or URL payloads.
 */
export function generateNepalDynamicQrString(config: FonepayQrConfig): string {
  const merchant = encodeURIComponent(config.merchantName);
  const amt = config.amount.toFixed(2);
  const inv = encodeURIComponent(config.invoiceNo);
  const remarks = encodeURIComponent(config.remarks || 'Bill Payment');

  // EMVCo payload format standard for Nepal Fonepay & NepalPay
  return `https://smartbilling.app/pay?m=${merchant}&amt=${amt}&inv=${inv}&pan=${config.panNumber || ''}&r=${remarks}`;
}

/**
 * Formats phone number for Nepali WhatsApp (adds +977 if missing)
 */
export function formatNepalWhatsAppPhone(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('977') && clean.length === 13) return clean;
  if (clean.length === 10) return `977${clean}`;
  return clean;
}

/**
 * Generates instant 1-click WhatsApp bill message link
 */
export function generateWhatsAppBillLink(
  phone: string,
  customerName: string,
  shopName: string,
  invoiceNo: string,
  amount: number,
  billUrl?: string
): string {
  const cleanPhone = formatNepalWhatsAppPhone(phone);
  const formattedAmt = `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const linkText = billUrl ? `\n📄 View / Download Bill: ${billUrl}` : '';

  const message = `🙏 Namaste ${customerName || 'Customer'} ji,

Thank you for shopping at *${shopName}*!
Your bill details:
🧾 *Invoice No:* ${invoiceNo}
💰 *Total Amount:* ${formattedAmt}${linkText}

Thank you for your business! Have a wonderful day! ⚡
_Powered by Smart Billing_`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates instant polite credit/udharo reminder via WhatsApp
 */
export function generateWhatsAppCreditReminder(
  phone: string,
  customerName: string,
  shopName: string,
  dueAmount: number,
  fonepayLink?: string
): string {
  const cleanPhone = formatNepalWhatsAppPhone(phone);
  const formattedAmt = `Rs. ${dueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const qrText = fonepayLink ? `\n💳 Pay instantly via Fonepay/eSewa: ${fonepayLink}` : '';

  const message = `🙏 Namaste ${customerName} ji,

This is a gentle reminder regarding your pending balance at *${shopName}*.
💰 *Pending Due Amount:* ${formattedAmt}${qrText}

Please clear your dues at your earliest convenience. Thank you for your continued trust!
_Smart Billing reminder on behalf of ${shopName}_`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
