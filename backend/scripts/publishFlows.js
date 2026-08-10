// Create + upload JSON + publish all WhatsApp Flows to Meta, then write the
// resulting flow ids back into backend/.env.
// Run: node scripts/publishFlows.js
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { getClient } from '../services/metaCloud.js';
import { FLOW_ENV } from '../flows/flowKeys.js';
import * as b2b from '../flows/b2bFlows.js';
import * as b2c from '../flows/b2cFlows.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, '..', '.env');
dotenv.config({ path: ENV_PATH });

const PUBLIC = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');
const ENDPOINT_URI = `${PUBLIC}/api/whatsapp/flow-endpoint`;

// key -> { channel, name, json, endpoint }
const FLOWS = {
  b2b_service: { channel: 'b2b', name: 'Devine B2B - Choose Service', json: b2b.serviceFlow() },
  b2b_dealer: { channel: 'b2b', name: 'Devine B2B - Dealer Registration', json: b2b.dealerFlow(), endpoint: true },
  b2b_bulk: { channel: 'b2b', name: 'Devine B2B - Bulk Wholesale', json: b2b.bulkFlow() },
  b2b_gifting: { channel: 'b2b', name: 'Devine B2B - Corporate Gifting', json: b2b.giftingFlow() },
  b2b_export: { channel: 'b2b', name: 'Devine B2B - Export Supply', json: b2b.exportFlow(), endpoint: true },
  b2c_service: { channel: 'b2c', name: 'Devine B2C - Choose Service', json: b2c.serviceFlow() },
  b2c_order_summary: { channel: 'b2c', name: 'Devine B2C - Order Summary', json: b2c.orderSummaryFlow() },
  b2c_review: { channel: 'b2c', name: 'Devine B2C - Review', json: b2c.reviewFlow() },
  b2c_gifting: { channel: 'b2c', name: 'Devine B2C - Corporate Gifting', json: b2c.giftingFlow() }
};

function writeEnv(updates) {
  let env = fs.readFileSync(ENV_PATH, 'utf8');
  for (const [k, v] of Object.entries(updates)) {
    const line = `${k}=${v}`;
    if (new RegExp(`^${k}=.*$`, 'm').test(env)) env = env.replace(new RegExp(`^${k}=.*$`, 'm'), line);
    else env += `\n${line}`;
  }
  fs.writeFileSync(ENV_PATH, env);
}

async function run() {
  const updates = {};
  // Cache existing flows per channel so re-runs reuse instead of duplicating.
  const existingByChannel = {};
  for (const [key, def] of Object.entries(FLOWS)) {
    const wa = getClient(def.channel);
    try {
      console.log(`\n=== ${key} (${def.channel}) ===`);
      if (!existingByChannel[def.channel]) {
        existingByChannel[def.channel] = await wa.getFlows().catch(() => []);
      }
      const match = existingByChannel[def.channel].find((f) => f.name === def.name);
      let flowId;
      if (match) {
        flowId = match.id;
        console.log('reusing existing flow id:', flowId, `(status: ${match.status})`);
      } else {
        const created = await wa.createFlow(def.name, ['OTHER'], def.endpoint ? { endpointUri: ENDPOINT_URI } : {});
        flowId = created.id;
        console.log('created flow id:', flowId);
      }

      const upd = await wa.updateFlowJSON(flowId, def.json);
      if (upd.validation_errors?.length) {
        console.warn('validation errors:', JSON.stringify(upd.validation_errors, null, 2));
      }
      try {
        await wa.publishFlow(flowId);
        console.log('published ✓');
      } catch (pubErr) {
        console.warn('publish failed (flow left as DRAFT):', pubErr.response?.data?.error?.message || pubErr.message);
      }
      updates[FLOW_ENV[key]] = flowId;
    } catch (err) {
      console.error(`FAILED ${key}:`, err.response?.data?.error?.message || err.message);
    }
  }
  if (Object.keys(updates).length) {
    writeEnv(updates);
    console.log('\n.env updated with flow ids:', updates);
  }
  console.log('\nDone.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
