// B2C WhatsApp Flow JSON definitions.
const VERSION = '6.3';

// Dynamic-array data schema helper (Flow JSON requires `items` for arrays).
function arrayData(example = [{ id: 'x', title: 'y' }]) {
  return {
    type: 'array',
    items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' } } },
    __example__: example
  };
}

function arrayDataWithImage(example = [{ id: 'x', title: 'y', description: 'z', image: 'iVBORw0KGgo' }]) {
  return {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        image: { type: 'string' }
      },
      required: ['id', 'title']
    },
    __example__: example
  };
}

// ---------------------------------------------------------------------------
// 1) B2C SERVICE SELECTION (Browse products / Gifting / Track Order / Talk to us)
// ---------------------------------------------------------------------------
export function serviceFlow() {
  return {
    version: VERSION,
    data_api_version: '3.0',
    routing_model: { SERVICE_MENU: ['CATEGORY_SELECT', 'TRACK_ORDERS'], CATEGORY_SELECT: [], TRACK_ORDERS: [] },
    screens: [
      {
        id: 'SERVICE_MENU',
        title: 'Choose Service',
        data: {
          welcome_banner: { type: 'string', __example__: 'iVBORw0KGgo' },
          has_welcome_banner: { type: 'boolean', __example__: false },
          heading: { type: 'string', __example__: 'Welcome to Devine Natural Foods 🌿' },
          subheading: { type: 'string', __example__: 'Select a service below to explore' },
          services: arrayDataWithImage([
            { id: 'browse', title: 'Browse our products', description: 'Explore natural food items, honey & spices' },
            { id: 'gifting', title: 'Corporate & Bulk gifting', description: 'Custom hampers starting from Rs.299' },
            { id: 'track', title: 'Track Order', description: 'Live order & delivery tracking' },
            { id: 'talk', title: 'Talk to us', description: 'Chat or call customer support' }
          ])
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Image',
              src: '${data.welcome_banner}',
              width: 1000,
              height: 125,
              'scale-type': 'cover',
              'alt-text': 'Devine Natural Foods',
              visible: '${data.has_welcome_banner}'
            },
            {
              type: 'TextHeading',
              text: '${data.heading}'
            },
            {
              type: 'TextCaption',
              text: '${data.subheading}'
            },
            {
              type: 'RadioButtonsGroup',
              name: 'selected_service',
              label: 'Services',
              required: true,
              'data-source': '${data.services}'
            },
            {
              type: 'Footer',
              label: 'Continue',
              'on-click-action': {
                name: 'data_exchange',
                payload: { screen: 'SERVICE_MENU', selected_service: '${form.selected_service}' }
              }
            }
          ]
        }
      },
      {
        id: 'CATEGORY_SELECT',
        title: 'Browse Categories',
        terminal: true,
        success: true,
        data: {
          welcome_banner: { type: 'string', __example__: 'iVBORw0KGgo' },
          has_welcome_banner: { type: 'boolean', __example__: false },
          heading: { type: 'string', __example__: '🛍️ Select a Category' },
          subheading: { type: 'string', __example__: 'Tap a category below to explore our products' },
          categories: arrayDataWithImage([{ id: 'honey', title: 'Honey', description: 'Pure & raw natural honey' }])
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Image',
              src: '${data.welcome_banner}',
              width: 1000,
              height: 125,
              'scale-type': 'cover',
              'alt-text': 'Devine Natural Foods',
              visible: '${data.has_welcome_banner}'
            },
            {
              type: 'TextHeading',
              text: '${data.heading}'
            },
            {
              type: 'TextCaption',
              text: '${data.subheading}'
            },
            {
              type: 'RadioButtonsGroup',
              name: 'selected_category',
              label: 'Categories',
              required: true,
              'data-source': '${data.categories}'
            },
            {
              type: 'Footer',
              label: 'View Products',
              'on-click-action': {
                name: 'complete',
                payload: { selected_service: 'browse', selected_category: '${form.selected_category}' }
              }
            }
          ]
        }
      },
      {
        id: 'TRACK_ORDERS',
        title: 'Track Order',
        terminal: true,
        success: true,
        data: {
          welcome_banner: { type: 'string', __example__: 'iVBORw0KGgo' },
          has_welcome_banner: { type: 'boolean', __example__: false },
          heading: { type: 'string', __example__: '📦 Your Orders' },
          subheading: { type: 'string', __example__: 'Select an order to see live tracking' },
          orders: arrayDataWithImage([
            { id: 'TRK-A1B2C3', title: 'DVN-B2C-1234 - Rs.500', description: 'Out for Delivery - 10/08/2026' }
          ])
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Image',
              src: '${data.welcome_banner}',
              width: 1000,
              height: 125,
              'scale-type': 'cover',
              'alt-text': 'Devine Natural Foods',
              visible: '${data.has_welcome_banner}'
            },
            { type: 'TextHeading', text: '${data.heading}' },
            { type: 'TextCaption', text: '${data.subheading}' },
            {
              type: 'RadioButtonsGroup',
              name: 'selected_order',
              label: 'Your Orders',
              required: true,
              'data-source': '${data.orders}'
            },
            {
              type: 'Footer',
              label: 'Track Order',
              'on-click-action': {
                name: 'complete',
                payload: { selected_service: 'track', selected_order: '${form.selected_order}' }
              }
            }
          ]
        }
      }
    ]
  };
}

// ---------------------------------------------------------------------------
// 2) ORDER SUMMARY FLOW — shows cart summary, then payment method choice
// ---------------------------------------------------------------------------
export function orderSummaryFlow() {
  return {
    version: VERSION,
    routing_model: { ORDER_SUMMARY: ['CONTACT_DETAILS'], CONTACT_DETAILS: ['PAYMENT_METHOD'], PAYMENT_METHOD: [] },
    screens: [
      {
        id: 'ORDER_SUMMARY',
        title: 'Your Order',
        data: {
          cart_items: arrayDataWithImage([
            { id: '0', title: '2x Honey Amla', description: 'Rs.500' }
          ]),
          summary_total: { type: 'string', __example__: 'Rs.500' },
          wa_number: { type: 'string', __example__: '+919876543210' },
          payment_options: arrayDataWithImage([
            { id: 'online', title: 'Online Payment', description: 'Pay securely via UPI / Card' },
            { id: 'cod', title: 'Cash on Delivery', description: 'Pay when your order arrives' }
          ])
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            { type: 'TextHeading', text: 'Your Order' },
            {
              type: 'RadioButtonsGroup',
              name: 'cart_view',
              label: 'Items in your cart',
              required: false,
              enabled: false,
              'data-source': '${data.cart_items}'
            },
            { type: 'TextSubheading', text: 'Total: ${data.summary_total}' },
            {
              type: 'Footer',
              label: 'Continue',
              'on-click-action': {
                name: 'navigate',
                next: { type: 'screen', name: 'CONTACT_DETAILS' },
                payload: { summary_total: '${data.summary_total}', wa_number: '${data.wa_number}', payment_options: '${data.payment_options}' }
              }
            }
          ]
        }
      },
      {
        id: 'CONTACT_DETAILS',
        title: 'Your Details',
        data: {
          summary_total: { type: 'string', __example__: 'Rs.500' },
          wa_number: { type: 'string', __example__: '+919876543210' },
          payment_options: arrayDataWithImage([
            { id: 'online', title: 'Online Payment', description: 'Pay securely via UPI / Card' },
            { id: 'cod', title: 'Cash on Delivery', description: 'Pay when your order arrives' }
          ])
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            { type: 'TextHeading', text: 'Delivery Contact' },
            { type: 'TextInput', name: 'name', label: 'Your name', required: true, 'input-type': 'text' },
            {
              type: 'TextInput',
              name: 'whatsapp_number',
              label: 'WhatsApp number',
              'input-type': 'phone',
              enabled: false,
              'init-value': '${data.wa_number}',
              'helper-text': 'Linked to this chat'
            },
            { type: 'TextInput', name: 'contact_phone', label: 'Phone number', required: true, 'input-type': 'phone', 'helper-text': 'Alternate number for delivery' },
            {
              type: 'Footer',
              label: 'Continue',
              'on-click-action': {
                name: 'navigate',
                next: { type: 'screen', name: 'PAYMENT_METHOD' },
                payload: {
                  name: '${form.name}',
                  contact_phone: '${form.contact_phone}',
                  wa_number: '${data.wa_number}',
                  payment_options: '${data.payment_options}'
                }
              }
            }
          ]
        }
      },
      {
        id: 'PAYMENT_METHOD',
        title: 'Payment Method',
        terminal: true,
        data: {
          name: { type: 'string', __example__: 'Guest' },
          contact_phone: { type: 'string', __example__: '9876543210' },
          wa_number: { type: 'string', __example__: '+919876543210' },
          payment_options: arrayDataWithImage([
            { id: 'online', title: 'Online Payment', description: 'Pay securely via UPI / Card' },
            { id: 'cod', title: 'Cash on Delivery', description: 'Pay when your order arrives' }
          ])
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'RadioButtonsGroup',
              name: 'payment_method',
              label: 'How would you like to pay?',
              required: true,
              'data-source': '${data.payment_options}'
            },
            {
              type: 'Footer',
              label: 'Confirm',
              'on-click-action': {
                name: 'complete',
                payload: {
                  payment_method: '${form.payment_method}',
                  name: '${data.name}',
                  contact_phone: '${data.contact_phone}',
                  wa_number: '${data.wa_number}'
                }
              }
            }
          ]
        }
      }
    ]
  };
}

// ---------------------------------------------------------------------------
// 3) REVIEW FLOW — pick purchased product, rate + review
// ---------------------------------------------------------------------------
export function reviewFlow() {
  return {
    version: VERSION,
    routing_model: { PICK_PRODUCT: ['RATE'], RATE: [] },
    screens: [
      {
        id: 'PICK_PRODUCT',
        title: 'Rate your order',
        data: { products: arrayData([{ id: 'honey', title: 'Honey Amla' }]) },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'RadioButtonsGroup',
              name: 'product',
              label: 'Which product would you like to review?',
              required: true,
              'data-source': '${data.products}'
            },
            {
              type: 'Footer',
              label: 'Continue',
              'on-click-action': { name: 'navigate', next: { type: 'screen', name: 'RATE' }, payload: { product: '${form.product}' } }
            }
          ]
        }
      },
      {
        id: 'RATE',
        title: 'Your Review',
        terminal: true,
        data: { product: { type: 'string', __example__: 'honey' } },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'Dropdown',
              name: 'rating',
              label: 'Your rating',
              required: true,
              'data-source': [
                { id: '5', title: '5 - Excellent' },
                { id: '4', title: '4 - Very Good' },
                { id: '3', title: '3 - Good' },
                { id: '2', title: '2 - Fair' },
                { id: '1', title: '1 - Poor' }
              ]
            },
            { type: 'TextArea', name: 'review', label: 'Tell us more (optional)', required: false },
            {
              type: 'Footer',
              label: 'Submit',
              'on-click-action': {
                name: 'complete',
                payload: { product: '${data.product}', rating: '${form.rating}', review: '${form.review}' }
              }
            }
          ]
        }
      }
    ]
  };
}

// ---------------------------------------------------------------------------
// 4) CORPORATE / BULK GIFTING (B2C) — mirrors the B2B gifting collection.
// ---------------------------------------------------------------------------
export function giftingFlow() {
  return {
    version: VERSION,
    screens: [
      {
        id: 'GIFTING',
        title: 'Corporate / Bulk Gifting',
        terminal: true,
        data: {},
        layout: {
          type: 'SingleColumnLayout',
          children: [
            { type: 'TextBody', text: 'Custom premium natural gift hampers. Hampers start from Rs.299/unit (MOQ 50).' },
            { type: 'TextInput', name: 'hampers', label: 'Number of hampers required', required: true, 'input-type': 'number' },
            { type: 'TextInput', name: 'budget', label: 'Budget per hamper', required: true, 'input-type': 'number' },
            { type: 'TextInput', name: 'delivery_date', label: 'Delivery date required', required: true, 'input-type': 'text' },
            { type: 'TextInput', name: 'company', label: 'Company / Name', required: true, 'input-type': 'text' },
            {
              type: 'Footer',
              label: 'Confirm',
              'on-click-action': {
                name: 'complete',
                payload: {
                  hampers: '${form.hampers}',
                  budget: '${form.budget}',
                  delivery_date: '${form.delivery_date}',
                  company: '${form.company}'
                }
              }
            }
          ]
        }
      }
    ]
  };
}

export default { serviceFlow, orderSummaryFlow, reviewFlow, giftingFlow };
