// One-off: update JSON + publish only the B2C Order Summary flow.
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { getClient } from '../services/metaCloud.js';
import * as b2c from '../flows/b2cFlows.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const NAME = 'Devine B2C - Order Summary';

async function run() {
  const wa = getClient('b2c');
  const flows = await wa.getFlows().catch(() => []);
  const match = flows.find((f) => f.name === NAME);
  if (!match) {
    console.error('Order Summary flow not found on Meta.');
    process.exit(1);
  }
  console.log('flow id:', match.id, 'status:', match.status);
  const upd = await wa.updateFlowJSON(match.id, b2c.orderSummaryFlow());
  if (upd.validation_errors?.length) {
    console.warn('validation errors:', JSON.stringify(upd.validation_errors, null, 2));
  }
  await wa.publishFlow(match.id);
  console.log('published OK');
}

run().catch((e) => {
  console.error('FAILED:', e.response?.data?.error?.message || e.message);
  process.exit(1);
});
