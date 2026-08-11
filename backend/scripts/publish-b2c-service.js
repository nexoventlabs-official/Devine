// Targeted republish of ONLY the "Devine B2C - Choose Service" flow so the
// new TRACK_ORDERS screen is added. Safe: doesn't touch other flows.
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { getClient } = await import('../services/metaCloud.js');
const b2c = await import('../flows/b2cFlows.js');

const ENDPOINT_URI = `${(process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '')}/api/whatsapp/flow-endpoint`;
const wa = getClient('b2c');

const flows = await wa.getFlows();
const flow = flows.find((f) => f.name === 'Devine B2C - Choose Service');
if (!flow) {
  console.error('Flow not found');
  process.exit(1);
}
console.log('Flow:', flow.id, flow.status);

try {
  await wa.updateFlowEndpoint(flow.id, ENDPOINT_URI);
  console.log('endpoint_uri set:', ENDPOINT_URI);
} catch (e) {
  console.warn('set endpoint_uri failed:', e.response?.data?.error?.message || e.message);
}

const upd = await wa.updateFlowJSON(flow.id, b2c.serviceFlow());
if (upd.validation_errors?.length) {
  console.warn('VALIDATION ERRORS:', JSON.stringify(upd.validation_errors, null, 2));
} else {
  console.log('JSON updated, no validation errors.');
}

try {
  await wa.publishFlow(flow.id);
  console.log('PUBLISHED ✓');
} catch (e) {
  console.error('publish failed:', e.response?.data?.error?.message || e.message);
}
