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
  WELCOME_HEADER_B2B: 'welcome_header_b2b',
  WELCOME_BANNER_B2B: 'welcome_banner_b2b',
  B2B_ICON_DEALER: 'b2b_icon_dealer',
  B2B_ICON_BULK: 'b2b_icon_bulk',
  B2B_ICON_GIFTING: 'b2b_icon_gifting',
  B2B_ICON_EXPORT: 'b2b_icon_export',
  DEALER_PDF: 'dealer_pdf',
  DEALER_HEADER: 'dealer_header',
  DEALER_AGREEMENT_PDF: 'dealer_agreement_pdf',
  DEALER_PRICE_LIST_PDF: 'dealer_price_list_pdf',
  DEALER_BRAND_GUIDE_PDF: 'dealer_brand_guide_pdf',
  BULK_HEADER: 'bulk_header',
  GIFTING_HEADER: 'gifting_header',
  GIFTING_PDF: 'gifting_pdf',
  EXPORT_HEADER: 'export_header',
  LEAD_THANKS_HEADER: 'lead_thanks_header',
  // B2C
  WELCOME_HEADER_B2C: 'welcome_header_b2c',
  WELCOME_BANNER_B2C: 'welcome_banner_b2c',
  ORDER_SUMMARY_HEADER: 'order_summary_header',
  TALK_HEADER: 'talk_header',
  TRACK_HEADER: 'track_header',
  PAYMENT_LOGO_ONLINE: 'payment_logo_online',
  PAYMENT_LOGO_COD: 'payment_logo_cod',
  B2C_ICON_BROWSE: 'b2c_icon_browse',
  B2C_ICON_GIFTING: 'b2c_icon_gifting',
  B2C_ICON_TRACK: 'b2c_icon_track',
  B2C_ICON_TALK: 'b2c_icon_talk',
  B2C_ICON_LANG: 'b2c_icon_lang',
  ORDER_CONFIRMED: 'order_confirmed',
  // 1:1 status logos for the in-flow order list + tracking messages
  ORDER_STATUS_PENDING: 'order_status_pending',
  ORDER_STATUS_CONFIRMED: 'order_status_confirmed',
  ORDER_STATUS_PACKED: 'order_status_packed',
  ORDER_STATUS_DISPATCHED: 'order_status_dispatched',
  ORDER_STATUS_OUT_FOR_DELIVERY: 'order_status_out_for_delivery',
  ORDER_STATUS_DELIVERED: 'order_status_delivered',
  ORDER_STATUS_CANCELLED: 'order_status_cancelled',
  PAYMENT_HEADER: 'payment_header',
  REVIEW_HEADER: 'review_header',
  REVIEW_5STAR_HEADER: 'review_5star_header',
  REVIEW_ISSUE_HEADER: 'review_issue_header',
  DELIVERED_PDF_HEADER: 'delivered_pdf_header',
  // Links / config
  GOOGLE_REVIEW_LINK: 'google_review_link',
  OFFICE_LOCATION: 'office_location'
};

export default { getAsset, getAssets, ASSET_KEYS };
