// B2C WhatsApp Flow JSON definitions (Flow JSON v5.1).
const VERSION = '5.1';

// Dynamic-array data schema helper (Flow JSON requires `items` for arrays).
function arrayData(example = [{ id: 'x', title: 'y' }]) {
  return {
    type: 'array',
    items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' } } },
    __example__: example
  };
}

// ---------------------------------------------------------------------------
// 1) B2C SERVICE SELECTION (Browse products / Gifting / Track Order / Talk to us)
// ---------------------------------------------------------------------------
export function serviceFlow() {
  return {
    version: VERSION,
    screens: [
      {
        id: 'SERVICE_MENU',
        title: 'How can we help?',
        terminal: true,
        data: {},
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'RadioButtonsGroup',
              name: 'selected_service',
              label: 'What brings you here today?',
              required: true,
              'data-source': [
                { id: 'browse', title: 'Browse our products' },
                { id: 'gifting', title: 'Corporate / Bulk gifting' },
                { id: 'track', title: 'Track Order' },
                { id: 'talk', title: 'Talk to us' }
              ]
            },
            {
              type: 'Footer',
              label: 'Continue',
              'on-click-action': { name: 'complete', payload: { selected_service: '${form.selected_service}' } }
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
    routing_model: { ORDER_SUMMARY: ['PAYMENT_METHOD'], PAYMENT_METHOD: [] },
    screens: [
      {
        id: 'ORDER_SUMMARY',
        title: 'Order Summary',
        data: {
          summary_items: { type: 'string', __example__: '2x Honey Amla - Rs.500' },
          summary_total: { type: 'string', __example__: 'Rs.500' },
          customer_name: { type: 'string', __example__: 'Guest' }
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            { type: 'TextHeading', text: 'Your Order' },
            { type: 'TextSubheading', text: 'Items' },
            { type: 'TextBody', text: '${data.summary_items}' },
            { type: 'TextSubheading', text: 'Total' },
            { type: 'TextBody', text: '${data.summary_total}' },
            { type: 'TextInput', name: 'name', label: 'Your name', required: true, 'input-type': 'text' },
            {
              type: 'Footer',
              label: 'Continue',
              'on-click-action': { name: 'navigate', next: { type: 'screen', name: 'PAYMENT_METHOD' }, payload: { name: '${form.name}' } }
            }
          ]
        }
      },
      {
        id: 'PAYMENT_METHOD',
        title: 'Payment Method',
        terminal: true,
        data: { name: { type: 'string', __example__: 'Guest' } },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'RadioButtonsGroup',
              name: 'payment_method',
              label: 'How would you like to pay?',
              required: true,
              'data-source': [
                { id: 'online', title: 'Online Payment' },
                { id: 'cod', title: 'Cash on Delivery' }
              ]
            },
            {
              type: 'Footer',
              label: 'Confirm',
              'on-click-action': {
                name: 'complete',
                payload: { payment_method: '${form.payment_method}', name: '${data.name}' }
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
