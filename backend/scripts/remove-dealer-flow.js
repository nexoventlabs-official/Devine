// One-off: remove the now-redundant standalone "Devine B2B - Dealer Registration"
// flow from Meta. Dealer registration is merged into the Choose Service flow.
// Tries delete (works for drafts); falls back to deprecate for published flows.
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { getClient } from '../services/metaCloud.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const NAME = 'Devine B2B - Dealer Registration';

async function run() {
  const wa = getClient('b2b');
  const flows = await wa.getFlows().catch(() => []);
  const match = flows.find((f) => f.name === NAME);
  if (!match) {
    console.log('Flow not found (already removed).');
    return;
  }
  console.log('flow id:', match.id, 'status:', match.status);
  try {
    await wa.deleteFlow(match.id);
    console.log('deleted OK');
  } catch (e) {
    console.warn('delete failed, trying deprecate:', e.response?.data?.error?.message || e.message);
    await wa.deprecateFlow(match.id);
    console.log('deprecated OK');
  }
}

run().catch((e) => {
  console.error('FAILED:', e.response?.data?.error?.message || e.message);
  process.exit(1);
});
