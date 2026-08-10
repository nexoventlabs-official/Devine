import logger from './logger.js';
import { getClient } from './metaCloud.js';
import { getConversation, setStep, resetConversation } from './conversationState.js';
import { getAssetUrl } from './flowAssets.js';
import Dealer from '../models/Dealer.js';

const GREETINGS = ['hi', 'hello', 'hey', 'hai', 'start', 'menu', 'namaskaram', 'vanakkam'];
const isGreeting = (t) => t && GREETINGS.includes(t.trim().toLowerCase());

// ---------------- B2B ----------------
async function sendB2BWelcome(client, phone) {
  const banner = await getAssetUrl('b2b_welcome_banner');
  const dealer = await Dealer.findOne({ phone: phone.replace(/\D/g, ''), status: 'approved' }).lean();

  const body =
    '*🌿 Welcome to Devine — Partner Portal*\n\n' +
    'Natural, preservative-free food products from Tamil Nadu since 2015.\n\n' +
    'How would you like to work with us? Tap *Choose Service* to get started.';

  // Service options. First row swaps to dealer profile if already approved.
  const rows = [
    dealer
      ? { id: 'b2b_dealer_profile', title: 'Already a Dealer', description: 'View your dealer profile & details' }
      : { id: 'b2b_become_dealer', title: 'Become a Dealer', description: 'Dealer / Distributor onboarding' },
    { id: 'b2b_bulk', title: 'Bulk / Wholesale', description: 'Bulk order enquiry & MOQ' },
    { id: 'b2b_corporate', title: 'Corporate Gifting', description: 'Custom premium gift hampers' },
    { id: 'b2b_export', title: 'Export / Intl Supply', description: 'International supply & IEC' }
  ];

  if (banner) {
    await client.sendImage(phone, banner);
  }
  await client.sendList(phone, 'Devine Partner', body, 'Choose Service', [{ title: 'Our Services', rows }], 'Devine Natural Foods');
  await setStep(phone, 'b2b', 'awaiting_service');
}

async function handleB2B(parsed) {
  const client = getClient('b2b');
  const { phone, text, selectedId, messageType } = parsed;

  if (isGreeting(text) || (messageType === 'text' && !selectedId)) {
    if (isGreeting(text)) {
      await resetConversation(phone, 'b2b');
      return sendB2BWelcome(client, phone);
    }
  }

  switch (selectedId) {
    case 'b2b_become_dealer':
      await setStep(phone, 'b2b', 'dealer_flow');
      await client.sendText(phone, 'Great! To share our dealer pricing and product catalogue, we need a few quick details. (Dealer onboarding flow coming up.)');
      return;
    case 'b2b_dealer_profile': {
      const dealer = await Dealer.findOne({ phone: phone.replace(/\D/g, ''), status: 'approved' }).lean();
      if (dealer) {
        await client.sendText(
          phone,
          `*Your Dealer Profile*\n\nDealer ID: ${dealer.dealerId}\nName: ${dealer.name}\nBusiness: ${dealer.businessName}\nLocation: ${dealer.city}, ${dealer.district}\nArea Manager: ${dealer.areaManagerName || 'TBA'}`
        );
      } else {
        await client.sendText(phone, 'We could not find an approved dealer profile for this number.');
      }
      return;
    }
    case 'b2b_bulk':
      await setStep(phone, 'b2b', 'bulk_flow');
      await client.sendText(phone, 'For bulk orders, here are our minimum order quantities. (Bulk flow coming up.)');
      return;
    case 'b2b_corporate':
      await setStep(phone, 'b2b', 'corporate_flow');
      await client.sendText(phone, '🎁 Devine Corporate Gifting — Premium Natural Gift Hampers. (Corporate gifting flow coming up.)');
      return;
    case 'b2b_export':
      await setStep(phone, 'b2b', 'export_flow');
      await client.sendText(phone, 'Export / International Supply. (Export flow coming up.)');
      return;
    default:
      // Unknown/other → re-show welcome
      return sendB2BWelcome(client, phone);
  }
}

// ---------------- B2C ----------------
async function sendB2CWelcome(client, phone) {
  const banner = await getAssetUrl('b2c_welcome_banner');
  const body =
    '*🌿 Namaskaram! Welcome to Devine Food Products.*\n\n' +
    'We make natural, preservative-free food products — straight from Tamil Nadu to your home since 2015.\n\n' +
    '*What brings you here today?*';

  const rows = [
    { id: 'b2c_browse', title: 'Browse Products', description: 'Shop honey, gulkand, dry fruits & more' },
    { id: 'b2c_gifting', title: 'Corporate / Bulk Gifting', description: 'Gift hampers for occasions' },
    { id: 'b2c_track', title: 'Track Order', description: 'Live status of your order' },
    { id: 'b2c_talk', title: 'Talk to Us', description: 'Chat with our team' }
  ];

  if (banner) {
    await client.sendImage(phone, banner);
  }
  await client.sendList(phone, 'Devine', body, 'Choose Service', [{ title: 'How can we help?', rows }], 'Devine Natural Foods');
  await setStep(phone, 'b2c', 'awaiting_service');
}

async function handleB2C(parsed) {
  const client = getClient('b2c');
  const { phone, text, selectedId } = parsed;

  if (isGreeting(text)) {
    await resetConversation(phone, 'b2c');
    return sendB2CWelcome(client, phone);
  }

  switch (selectedId) {
    case 'b2c_browse':
      await setStep(phone, 'b2c', 'browse_flow');
      await client.sendText(phone, 'Loading our product categories… (Browse flow coming up.)');
      return;
    case 'b2c_gifting':
      await setStep(phone, 'b2c', 'gifting_flow');
      await client.sendText(phone, '🎁 Corporate / Bulk gifting. (Gifting flow coming up.)');
      return;
    case 'b2c_track':
      await setStep(phone, 'b2c', 'track_flow');
      await client.sendText(phone, 'Let me pull up your order status… (Track flow coming up.)');
      return;
    case 'b2c_talk':
      await client.sendText(phone, 'Our team will reach out shortly. You can also call us. 🙏');
      return;
    default:
      return sendB2CWelcome(client, phone);
  }
}

// ---------------- Dispatch ----------------
async function handleMessage(parsed) {
  const { channel, phone } = parsed;
  await getConversation(phone, channel); // ensure a record exists
  logger.info('Inbound message', { channel, phone, type: parsed.messageType, selectedId: parsed.selectedId, text: parsed.text?.slice(0, 40) });

  if (channel === 'b2b') return handleB2B(parsed);
  if (channel === 'b2c') return handleB2C(parsed);
  logger.warn('No handler for channel', { channel });
}

async function handleStatus(channel, status) {
  // Delivery/read/payment receipts. Payment handling wired in the payments phase.
  if (status.type === 'payment' || status.payment) {
    logger.info('Payment status received', { channel, referenceId: status.payment?.reference_id });
  }
}

export default { handleMessage, handleStatus };
