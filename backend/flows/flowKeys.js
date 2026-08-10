// Logical flow identifiers -> env var holding the published Meta flow id.
// After publishing, the publish script writes these ids back into backend/.env.
export const FLOW_ENV = {
  b2b_service: 'WA_FLOW_B2B_SERVICE_ID',
  b2b_dealer: 'WA_FLOW_B2B_DEALER_ID',
  b2b_bulk: 'WA_FLOW_B2B_BULK_ID',
  b2b_gifting: 'WA_FLOW_B2B_GIFTING_ID',
  b2b_export: 'WA_FLOW_B2B_EXPORT_ID',
  b2c_service: 'WA_FLOW_B2C_SERVICE_ID',
  b2c_order_summary: 'WA_FLOW_B2C_ORDER_SUMMARY_ID',
  b2c_review: 'WA_FLOW_B2C_REVIEW_ID',
  b2c_gifting: 'WA_FLOW_B2C_GIFTING_ID'
};

export function flowId(key) {
  return process.env[FLOW_ENV[key]] || '';
}

export default { FLOW_ENV, flowId };
