// Publish all DRAFT flows on the B2B + B2C WABAs (after checking validation).
// Run: node scripts/publish-drafts.js         (dry run: lists status + errors)
//      node scripts/publish-drafts.js --publish (actually publishes clean drafts)
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const GRAPH = `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v21.0'}`;
const DO_PUBLISH = process.argv.includes('--publish');

const channels = [
  { name: 'B2B', token: process.env.WA_B2B_TOKEN, wabaId: process.env.WA_B2B_WABA_ID },
  { name: 'B2C', token: process.env.WA_B2C_TOKEN, wabaId: process.env.WA_B2C_WABA_ID }
];

async function run(ch) {
  console.log(`\n===== ${ch.name} (${ch.wabaId}) =====`);
  const headers = { Authorization: `Bearer ${ch.token}` };
  const { data } = await axios.get(`${GRAPH}/${ch.wabaId}/flows?fields=id,name,status&limit=100`, { headers });
  const flows = data.data || [];

  for (const f of flows) {
    if (f.status !== 'DRAFT') {
      console.log(`  • ${f.name} [${f.status}] — skip`);
      continue;
    }
    // Check validation errors before publishing
    let details;
    try {
      const res = await axios.get(`${GRAPH}/${f.id}?fields=id,name,status,validation_errors`, { headers });
      details = res.data;
    } catch (e) {
      console.log(`  ✗ ${f.name} — cannot read details: ${e.response?.data?.error?.message || e.message}`);
      continue;
    }
    const errs = details.validation_errors || [];
    if (errs.length) {
      console.log(`  ✗ ${f.name} [DRAFT] has ${errs.length} validation error(s):`);
      errs.forEach((e) => console.log(`       - ${e.error || e.error_type}: ${e.message}`));
      continue;
    }
    if (!DO_PUBLISH) {
      console.log(`  ✓ ${f.name} [DRAFT] is clean — ready to publish (run with --publish)`);
      continue;
    }
    try {
      await axios.post(`${GRAPH}/${f.id}/publish`, {}, { headers });
      console.log(`  🚀 ${f.name} — PUBLISHED`);
    } catch (e) {
      console.log(`  ✗ ${f.name} — publish failed: ${e.response?.data?.error?.message || e.message}`);
    }
  }
}

for (const ch of channels) {
  // eslint-disable-next-line no-await-in-loop
  await run(ch);
}
console.log('\nDone.');
