import FlowAsset from '../models/FlowAsset.js';

// Resolve an admin-managed flow asset (image/pdf/link) by key, with a fallback.
export async function getAsset(key, fallback = '') {
  const doc = await FlowAsset.findOne({ key });
  return doc?.url || fallback;
}

export async function getAssets(keys = []) {
  const docs = await FlowAsset.find({ key: { $in: keys } });
  const map = {};
  for (const d of docs) map[d.key] = d.url;
  return map;
}

// Canonical asset keys used across flows (surface these in the admin Flow Images page).
export const ASSET_KEYS = {
  // B2B
  WELCOME_BANNER_B2B: 'welcome_banner_b2b',
  DEALER_PDF: 'dealer_pdf',
  DEALER_HEADER: 'dealer_header',
  BULK_HEADER: 'bulk_header',
  GIFTING_HEADER: 'gifting_header',
  GIFTING_PDF: 'gifting_pdf',
  EXPORT_HEADER: 'export_header',
  LEAD_THANKS_HEADER: 'lead_thanks_header',
  // B2C
  WELCOME_BANNER_B2C: 'welcome_banner_b2c',
  ORDER_CONFIRMED: 'order_confirmed',
  PAYMENT_HEADER: 'payment_header',
  REVIEW_HEADER: 'review_header',
  REVIEW_5STAR_HEADER: 'review_5star_header',
  REVIEW_ISSUE_HEADER: 'review_issue_header',
  DELIVERED_PDF_HEADER: 'delivered_pdf_header',
  // Links
  GOOGLE_REVIEW_LINK: 'google_review_link'
};

export default { getAsset, getAssets, ASSET_KEYS };
