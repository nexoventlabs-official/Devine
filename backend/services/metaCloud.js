// Meta WhatsApp Cloud API client (ESM) with DUAL-CHANNEL support.
// One Meta app powers two numbers (B2B + B2C). We route by phone_number_id.
import axios from 'axios';
import https from 'https';
import FormData from 'form-data';
import logger from './logger.js';
import cloudinaryService from './cloudinary.js';

const agent = new https.Agent({ keepAlive: true, maxSockets: 25, timeout: 60000 });
const api = axios.create({
  httpsAgent: agent,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

const GRAPH = () => `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || 'v21.0'}`;

// Channel configs sourced from env.
const CHANNELS = {
  b2b: () => ({
    channel: 'b2b',
    token: process.env.WA_B2B_TOKEN,
    phoneNumberId: process.env.WA_B2B_PHONE_NUMBER_ID,
    wabaId: process.env.WA_B2B_WABA_ID
  }),
  b2c: () => ({
    channel: 'b2c',
    token: process.env.WA_B2C_TOKEN,
    phoneNumberId: process.env.WA_B2C_PHONE_NUMBER_ID,
    wabaId: process.env.WA_B2C_WABA_ID
  })
};

/** Resolve which channel a webhook phone_number_id belongs to. */
export function channelForPhoneNumberId(phoneNumberId) {
  if (String(phoneNumberId) === String(process.env.WA_B2B_PHONE_NUMBER_ID)) return 'b2b';
  if (String(phoneNumberId) === String(process.env.WA_B2C_PHONE_NUMBER_ID)) return 'b2c';
  return null;
}

const clean = (phone) => String(phone || '').replace('@c.us', '').replace(/\D/g, '');
const squareUrl = (url) => cloudinaryService.getOptimizedUrl(url, '1:1');

/**
 * Build a Meta client bound to one channel.
 * @param {'b2b'|'b2c'} channel
 */
export function getClient(channel) {
  const cfg = CHANNELS[channel]?.();
  if (!cfg || !cfg.phoneNumberId) {
    throw new Error(`Unknown or unconfigured WhatsApp channel: ${channel}`);
  }
  const base = `${GRAPH()}/${cfg.phoneNumberId}`;
  const authHeaders = { Authorization: `Bearer ${cfg.token}` };

  const post = (payload) => api.post(`${base}/messages`, payload, { headers: authHeaders });

  const client = {
    channel,
    config: cfg,

    async sendText(phone, body) {
      try {
        const { data } = await post({
          messaging_product: 'whatsapp',
          to: clean(phone),
          type: 'text',
          text: { body }
        });
        return data;
      } catch (err) {
        logger.error('sendText error', { channel, error: err.response?.data?.error?.message || err.message });
        throw err;
      }
    },

    async sendButtons(phone, body, buttons, footer = '') {
      try {
        const payload = {
          messaging_product: 'whatsapp',
          to: clean(phone),
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: body },
            ...(footer ? { footer: { text: footer } } : {}),
            action: {
              buttons: buttons.slice(0, 3).map((b, i) => ({
                type: 'reply',
                reply: { id: b.id || String(i + 1), title: (b.text || b).substring(0, 20) }
              }))
            }
          }
        };
        const { data } = await post(payload);
        return data;
      } catch (err) {
        logger.error('sendButtons error', { channel, error: err.response?.data?.error?.message || err.message });
        return this.sendText(phone, `${body}\n\n${buttons.map((b, i) => `${i + 1}. ${b.text || b}`).join('\n')}`);
      }
    },

    async sendImageWithButtons(phone, imageUrl, body, buttons, footer = '') {
      try {
        const payload = {
          messaging_product: 'whatsapp',
          to: clean(phone),
          type: 'interactive',
          interactive: {
            type: 'button',
            header: { type: 'image', image: { link: squareUrl(imageUrl) } },
            body: { text: body },
            ...(footer ? { footer: { text: footer } } : {}),
            action: {
              buttons: buttons.slice(0, 3).map((b, i) => ({
                type: 'reply',
                reply: { id: b.id || String(i + 1), title: (b.text || b).substring(0, 20) }
              }))
            }
          }
        };
        const { data } = await post(payload);
        return data;
      } catch (err) {
        logger.error('sendImageWithButtons error', { channel, error: err.response?.data?.error?.message || err.message });
        return this.sendButtons(phone, body, buttons, footer);
      }
    },

    async sendList(phone, header, body, buttonText, sections, footer = '') {
      try {
        const payload = {
          messaging_product: 'whatsapp',
          to: clean(phone),
          type: 'interactive',
          interactive: {
            type: 'list',
            header: { type: 'text', text: header.substring(0, 60) },
            body: { text: body.substring(0, 1024) },
            ...(footer ? { footer: { text: footer.substring(0, 60) } } : {}),
            action: {
              button: buttonText.substring(0, 20),
              sections: sections.map((s) => ({
                title: s.title.substring(0, 24),
                rows: s.rows.slice(0, 10).map((r) => ({
                  id: r.id,
                  title: r.title.substring(0, 24),
                  description: (r.description || '').substring(0, 72)
                }))
              }))
            }
          }
        };
        const { data } = await post(payload);
        return data;
      } catch (err) {
        logger.error('sendList error', { channel, error: err.response?.data?.error?.message || err.message });
        throw err;
      }
    },

    async sendImage(phone, imageUrl, caption = '') {
      try {
        const { data } = await post({
          messaging_product: 'whatsapp',
          to: clean(phone),
          type: 'image',
          image: { link: squareUrl(imageUrl), caption }
        });
        return data;
      } catch (err) {
        logger.error('sendImage error', { channel, error: err.response?.data?.error?.message || err.message });
        return this.sendText(phone, caption);
      }
    },

    async sendCtaUrl(phone, body, buttonText, url, footer = '', imageUrl = null) {
      try {
        const payload = {
          messaging_product: 'whatsapp',
          to: clean(phone),
          type: 'interactive',
          interactive: {
            type: 'cta_url',
            ...(imageUrl ? { header: { type: 'image', image: { link: squareUrl(imageUrl) } } } : {}),
            body: { text: body },
            ...(footer ? { footer: { text: footer } } : {}),
            action: { name: 'cta_url', parameters: { display_text: buttonText, url } }
          }
        };
        const { data } = await post(payload);
        return data;
      } catch (err) {
        logger.error('sendCtaUrl error', { channel, error: err.response?.data?.error?.message || err.message });
        return this.sendText(phone, `${body}\n\n🔗 ${buttonText}: ${url}`);
      }
    },

    async sendDocument(phone, documentUrl, filename, caption = '') {
      try {
        const { data } = await post({
          messaging_product: 'whatsapp',
          to: clean(phone),
          type: 'document',
          document: { link: documentUrl, filename, ...(caption ? { caption } : {}) }
        });
        return data;
      } catch (err) {
        logger.error('sendDocument error', { channel, error: err.response?.data?.error?.message || err.message });
        throw err;
      }
    },

    // PDF/document header + body + CTA button in a single bubble.
    async sendDocumentWithCtaUrl(phone, documentUrl, filename, body, buttonText, url, footer = '') {
      try {
        const payload = {
          messaging_product: 'whatsapp',
          to: clean(phone),
          type: 'interactive',
          interactive: {
            type: 'cta_url',
            header: { type: 'document', document: { link: documentUrl, filename } },
            body: { text: body },
            ...(footer ? { footer: { text: footer } } : {}),
            action: { name: 'cta_url', parameters: { display_text: buttonText, url } }
          }
        };
        const { data } = await post(payload);
        return data;
      } catch (err) {
        logger.error('sendDocumentWithCtaUrl error', { channel, error: err.response?.data?.error?.message || err.message });
        return this.sendCtaUrl(phone, body, buttonText, url, footer);
      }
    },

    // Opens WhatsApp's native location picker.
    async sendLocationRequest(phone, body) {
      try {
        const { data } = await post({
          messaging_product: 'whatsapp',
          to: clean(phone),
          type: 'interactive',
          interactive: {
            type: 'location_request_message',
            body: { text: body },
            action: { name: 'send_location' }
          }
        });
        return data;
      } catch (err) {
        logger.error('sendLocationRequest error', { channel, error: err.response?.data?.error?.message || err.message });
        throw err;
      }
    },

    // Interactive WhatsApp Flow message (user-initiated).
    async sendFlowMessage(phone, options) {
      const {
        flowId, flowCta, headerText, headerImageUrl, bodyText, footerText,
        screenName, screenData = {}, flowToken = 'unused', mode = 'published', flowAction = 'navigate'
      } = options;
      try {
        const header = headerImageUrl
          ? { type: 'image', image: { link: headerImageUrl } }
          : { type: 'text', text: headerText || 'Devine' };
        const actionParams = {
          flow_message_version: '3',
          flow_token: flowToken,
          flow_id: flowId,
          flow_cta: flowCta,
          mode,
          flow_action: flowAction
        };
        if (flowAction === 'navigate') {
          actionParams.flow_action_payload = { screen: screenName, data: { ...screenData, flow_token: flowToken } };
        }
        const payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: clean(phone),
          type: 'interactive',
          interactive: {
            type: 'flow',
            header,
            body: { text: bodyText || ' ' },
            ...(footerText ? { footer: { text: footerText } } : {}),
            action: { name: 'flow', parameters: actionParams }
          }
        };
        const { data } = await post(payload);
        return data;
      } catch (err) {
        logger.error('sendFlowMessage error', { channel, flowId, error: err.response?.data?.error?.message || err.message, details: err.response?.data?.error?.error_data });
        throw err;
      }
    },

    // Marketing/utility template send (works outside 24h window once approved).
    async sendTemplate(phone, templateName, { languageCode = 'en', headerImageUrl = null, bodyParams = [], buttonUrlParam = null } = {}) {
      try {
        const components = [];
        if (headerImageUrl) components.push({ type: 'header', parameters: [{ type: 'image', image: { link: headerImageUrl } }] });
        if (bodyParams.length) components.push({ type: 'body', parameters: bodyParams.map((t) => ({ type: 'text', text: String(t) })) });
        if (buttonUrlParam) components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: buttonUrlParam }] });
        const { data } = await post({
          messaging_product: 'whatsapp',
          to: clean(phone),
          type: 'template',
          template: { name: templateName, language: { code: languageCode }, ...(components.length ? { components } : {}) }
        });
        return data;
      } catch (err) {
        logger.error('sendTemplate error', { channel, templateName, error: err.response?.data?.error?.message || err.message });
        throw err;
      }
    },

    async downloadMedia(mediaId) {
      const meta = await axios.get(`${GRAPH()}/${mediaId}`, { headers: authHeaders });
      const file = await axios.get(meta.data.url, { headers: authHeaders, responseType: 'arraybuffer' });
      return Buffer.from(file.data);
    },

    // Native WhatsApp Pay (order_details / review_and_pay) via Razorpay config.
    // Opens the in-chat "Review and Pay" -> UPI app flow (payment.png / payment1.png).
    async sendOrderDetails(phone, referenceId, items, totalAmount, { tax = 0, shipping = 0, discount = 0, headerImageUrl = null } = {}) {
      const paymentConfig = process.env.WHATSAPP_PAYMENT_CONFIG;
      if (!paymentConfig) throw new Error('WHATSAPP_PAYMENT_CONFIG not configured');
      const toPaise = (r) => Math.round(Number(r) * 100);
      const businessName = process.env.MERCHANT_NAME || 'Devine Natural Foods';
      const hasImages = items.some((i) => i.imageUrl);

      const orderItems = items.map((i) => {
        const obj = { name: i.name, amount: { value: toPaise(i.price), offset: 100 }, quantity: i.quantity };
        if (hasImages) {
          if (i.imageUrl) obj.image = { link: i.imageUrl };
          obj.country_of_origin = 'India';
          obj.importer_name = businessName;
          obj.importer_address = { address_line1: businessName, city: 'Chennai', zone_code: 'TN', postal_code: '600001', country_code: 'IN' };
        } else {
          obj.retailer_id = i.retailerId;
        }
        return obj;
      });
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

      const order = {
        status: 'pending',
        expiration: { timestamp: Math.floor(Date.now() / 1000) + 900, description: 'Order expires in 15 minutes' },
        items: orderItems,
        subtotal: { value: toPaise(subtotal), offset: 100 },
        tax: { value: toPaise(tax), offset: 100, description: 'Tax' },
        shipping: { value: toPaise(shipping), offset: 100, description: 'Delivery' },
        discount: { value: toPaise(discount), offset: 100, description: 'Discount' }
      };
      if (!hasImages && process.env.META_CATALOG_ID) order.catalog_id = process.env.META_CATALOG_ID;

      const payload = {
        messaging_product: 'whatsapp',
        to: clean(phone),
        type: 'interactive',
        interactive: {
          type: 'order_details',
          ...(headerImageUrl ? { header: { type: 'image', image: { link: headerImageUrl } } } : {}),
          body: { text: `🧾 *Order #${referenceId}*\nReview your items and pay securely via UPI.` },
          footer: { text: 'Powered by WhatsApp Pay' },
          action: {
            name: 'review_and_pay',
            parameters: {
              reference_id: referenceId,
              type: 'physical-goods',
              payment_settings: [
                { type: 'payment_gateway', payment_gateway: { type: 'razorpay', configuration_name: paymentConfig } }
              ],
              currency: 'INR',
              total_amount: { value: toPaise(totalAmount), offset: 100 },
              order
            }
          }
        }
      };
      const { data } = await post(payload);
      return data;
    },

    // Confirm/cancel payment outcome to the customer (order_status).
    async sendOrderStatusUpdate(phone, referenceId, status, description = '') {
      const paymentConfig = process.env.WHATSAPP_PAYMENT_CONFIG;
      const payload = {
        messaging_product: 'whatsapp',
        to: clean(phone),
        type: 'interactive',
        interactive: {
          type: 'order_status',
          body: { text: description || (status === 'completed' ? '✅ Payment received! Order confirmed.' : `Order status: ${status}`) },
          action: {
            name: 'review_order',
            parameters: { reference_id: referenceId, order: { status, description: description || `Order ${status}` }, payment_configuration: paymentConfig }
          }
        }
      };
      const { data } = await post(payload);
      return data;
    },

    // ---------- Flow management (WABA-level) ----------
    async createFlow(name, categories = ['OTHER'], { endpointUri = null } = {}) {
      const body = { name, categories };
      if (endpointUri) body.endpoint_uri = endpointUri;
      const { data } = await api.post(`${GRAPH()}/${cfg.wabaId}/flows`, body, { headers: authHeaders });
      return data;
    },

    async updateFlowJSON(flowId, flowJsonObj) {
      const form = new FormData();
      form.append('file', Buffer.from(JSON.stringify(flowJsonObj)), { filename: 'flow.json', contentType: 'application/json' });
      form.append('name', 'flow.json');
      form.append('asset_type', 'FLOW_JSON');
      const { data } = await api.post(`${GRAPH()}/${flowId}/assets`, form, {
        headers: { ...authHeaders, ...form.getHeaders() },
        maxContentLength: 10 * 1024 * 1024,
        maxBodyLength: 10 * 1024 * 1024
      });
      return data;
    },

    async publishFlow(flowId) {
      const { data } = await api.post(`${GRAPH()}/${flowId}/publish`, {}, { headers: authHeaders });
      return data;
    },

    async getFlows() {
      const { data } = await api.get(`${GRAPH()}/${cfg.wabaId}/flows?fields=id,name,status,categories&limit=100`, { headers: authHeaders });
      return data?.data || [];
    },

    async getFlowDetails(flowId) {
      const { data } = await api.get(`${GRAPH()}/${flowId}?fields=id,name,status,categories,validation_errors`, { headers: authHeaders });
      return data;
    },

    async deleteFlow(flowId) {
      const { data } = await api.delete(`${GRAPH()}/${flowId}`, { headers: authHeaders });
      return data;
    },

    // ---------- Commerce Catalog (product sync) ----------
    // Upsert products into the Meta Commerce Catalog via items_batch.
    // products: [{ retailerId, name, description, price, salePrice?, currency?, imageUrl?, category?, availability, url? }]
    async batchUpsertCatalogProducts(catalogId, products) {
      if (!catalogId) throw new Error('META_CATALOG_ID not configured');
      const requests = products.map((p) => {
        const currency = p.currency || 'INR';
        const link = p.url || process.env.WEBSITE_URL || `https://wa.me/${cfg.phoneNumberId}`;
        const data = {
          id: p.retailerId,
          title: p.name,
          description: p.description || p.name,
          availability: p.availability || 'in stock',
          price: `${Number(p.price).toFixed(2)} ${currency}`,
          link,
          google_product_category: 'Food, Beverages & Tobacco > Food Items',
          brand: process.env.BUSINESS_NAME || 'Devine Natural Foods',
          condition: 'new',
          // Unique group id per product = no variant picker
          item_group_id: p.retailerId,
          // Clear strikethrough unless a real sale price is provided
          sale_price: p.salePrice && p.salePrice < p.price ? `${Number(p.salePrice).toFixed(2)} ${currency}` : ''
        };
        if (p.imageUrl) data.image_link = squareUrl(p.imageUrl);
        return { method: 'CREATE', data };
      });
      const { data } = await api.post(
        `${GRAPH()}/${catalogId}/items_batch`,
        { item_type: 'PRODUCT_ITEM', requests },
        { headers: authHeaders }
      );
      return data;
    },

    async deleteCatalogProduct(catalogId, retailerId) {
      if (!catalogId) throw new Error('META_CATALOG_ID not configured');
      const { data } = await api.post(
        `${GRAPH()}/${catalogId}/batch`,
        { requests: [{ method: 'DELETE', retailer_id: retailerId }] },
        { headers: authHeaders }
      );
      return data;
    },

    // ---------- Native catalog messages ----------
    // Multi-product browsable list (native WhatsApp catalog cards).
    async sendProductList(phone, catalogId, headerText, bodyText, sections, footerText = '') {
      try {
        const payload = {
          messaging_product: 'whatsapp',
          to: clean(phone),
          type: 'interactive',
          interactive: {
            type: 'product_list',
            header: { type: 'text', text: (headerText || 'Menu').substring(0, 60) },
            body: { text: (bodyText || ' ').substring(0, 1024) },
            ...(footerText ? { footer: { text: footerText.substring(0, 60) } } : {}),
            action: {
              catalog_id: catalogId,
              sections: sections.map((s) => ({
                title: (s.title || 'Products').substring(0, 24),
                product_items: (s.productRetailerIds || []).slice(0, 30).map((id) => ({ product_retailer_id: id }))
              }))
            }
          }
        };
        const { data } = await post(payload);
        return data;
      } catch (err) {
        logger.error('sendProductList error', { channel, error: err.response?.data?.error?.message || err.message });
        throw err;
      }
    },

    // Single product card (native).
    async sendProduct(phone, catalogId, retailerId, bodyText = '', footerText = '') {
      const payload = {
        messaging_product: 'whatsapp',
        to: clean(phone),
        type: 'interactive',
        interactive: {
          type: 'product',
          ...(bodyText ? { body: { text: bodyText.substring(0, 1024) } } : {}),
          ...(footerText ? { footer: { text: footerText.substring(0, 60) } } : {}),
          action: { catalog_id: catalogId, product_retailer_id: retailerId }
        }
      };
      const { data } = await post(payload);
      return data;
    }
  };

  return client;
}

// Convenience singletons
export const b2b = () => getClient('b2b');
export const b2c = () => getClient('b2c');

export default { getClient, channelForPhoneNumberId, b2b, b2c };
