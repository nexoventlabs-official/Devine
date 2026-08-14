// Logical flow identifiers -> env var holding the published Meta flow id.
// After publishing, the publish script writes these ids back into backend/.env.
export const FLOW_ENV = {
  b2b_service: 'WA_FLOW_B2B_SERVICE_ID',
  b2c_service: 'WA_FLOW_B2C_SERVICE_ID',
  b2c_order_summary: 'WA_FLOW_B2C_ORDER_SUMMARY_ID',
  b2c_review: 'WA_FLOW_B2C_REVIEW_ID',
  b2c_gifting: 'WA_FLOW_B2C_GIFTING_ID'
};

export function flowId(key) {
  return process.env[FLOW_ENV[key]] || '';
}

export default { FLOW_ENV, flowId };
