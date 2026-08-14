// B2B WhatsApp Flow JSON definitions (Flow JSON v5.1).
// The dealer flow is endpoint-driven (data_exchange) for dynamic state->district.
import { stateOptions } from '../data/geo.js';

const VERSION = '6.3';
const DATA_API = '3.0';

// Dynamic-array data schema helper: Flow JSON requires `items` for array data.
function arrayData(example = [{ id: 'x', title: 'y' }]) {
  return {
    type: 'array',
    items: {
      type: 'object',
      properties: { id: { type: 'string' }, title: { type: 'string' } }
    },
    __example__: example
  };
}

// Array schema whose items carry an optional base64 `image` (1:1 logo) + description.
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

// Shared dealer registration screens (used by the merged service flow AND the
// standalone dealer flow fallback). Endpoint-driven (data_exchange).
function dealerScreens() {
  return [
    {
      id: 'BUSINESS_NAME',
      title: 'Dealer Registration',
      data: {},
      layout: {
        type: 'SingleColumnLayout',
        children: [
          { type: 'TextHeading', text: 'Great! Let us set you up.' },
          { type: 'TextBody', text: 'To share our dealer pricing and product catalogue, we need a few quick details.' },
          { type: 'TextInput', name: 'business_name', label: 'What is your business name?', required: true, 'input-type': 'text' },
          {
            type: 'Footer',
            label: 'Continue',
            'on-click-action': {
              name: 'data_exchange',
              payload: { screen: 'BUSINESS_NAME', business_name: '${form.business_name}' }
            }
          }
        ]
      }
    },
    {
      id: 'STATE_SELECT',
      title: 'Your Location',
      data: { states: arrayData(stateOptions().slice(0, 2)) },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          { type: 'Dropdown', name: 'state', label: 'Select your state', required: true, 'data-source': '${data.states}' },
          {
            type: 'Footer',
            label: 'Continue',
            'on-click-action': {
              name: 'data_exchange',
              payload: { screen: 'STATE_SELECT', state: '${form.state}' }
            }
          }
        ]
      }
    },
    {
      id: 'DISTRICT_CITY',
      title: 'Your Location',
      data: { districts: arrayData([{ id: 'Chennai', title: 'Chennai' }]) },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          { type: 'Dropdown', name: 'district', label: 'Which district?', required: true, 'data-source': '${data.districts}' },
          { type: 'TextInput', name: 'city', label: 'City / Town', required: true, 'input-type': 'text' },
          {
            type: 'Footer',
            label: 'Continue',
            'on-click-action': {
              name: 'data_exchange',
              payload: { screen: 'DISTRICT_CITY', district: '${form.district}', city: '${form.city}' }
            }
          }
        ]
      }
    },
    {
      id: 'BUSINESS_PROFILE',
      title: 'Business Profile',
      data: {},
      layout: {
        type: 'SingleColumnLayout',
        children: [
          {
            type: 'Dropdown',
            name: 'business_type',
            label: 'What type of business do you run?',
            required: true,
            'data-source': [
              { id: 'retail', title: 'Retail Shop' },
              { id: 'wholesale', title: 'Wholesale Distributor' },
              { id: 'online', title: 'Online Seller (Amazon/Flipkart)' },
              { id: 'supermarket', title: 'Supermarket / Modern Trade' },
              { id: 'other', title: 'Other' }
            ]
          },
          {
            type: 'Dropdown',
            name: 'capacity',
            label: 'Estimated monthly purchase capacity?',
            required: true,
            'data-source': [
              { id: 'below_10k', title: 'Below Rs.10,000' },
              { id: '10k_50k', title: 'Rs.10,000 - Rs.50,000' },
              { id: '50k_2l', title: 'Rs.50,000 - Rs.2,00,000' },
              { id: 'above_2l', title: 'Above Rs.2,00,000' }
            ]
          },
          {
            type: 'Footer',
            label: 'Continue',
            'on-click-action': {
              name: 'data_exchange',
              payload: { screen: 'BUSINESS_PROFILE', business_type: '${form.business_type}', capacity: '${form.capacity}' }
            }
          }
        ]
      }
    },
    {
      id: 'SUMMARY',
      title: 'Confirm Your Details',
      terminal: true,
      data: {
        summary_business: { type: 'string', __example__: 'Devine Stores' },
        summary_location: { type: 'string', __example__: 'Chennai, Tamil Nadu' },
        summary_type: { type: 'string', __example__: 'Retail Shop' },
        summary_capacity: { type: 'string', __example__: 'Rs.50,000 - Rs.2,00,000' }
      },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          { type: 'TextHeading', text: 'Please confirm' },
          { type: 'TextSubheading', text: 'Business Name' },
          { type: 'TextBody', text: '${data.summary_business}' },
          { type: 'TextSubheading', text: 'Location' },
          { type: 'TextBody', text: '${data.summary_location}' },
          { type: 'TextSubheading', text: 'Business Type' },
          { type: 'TextBody', text: '${data.summary_type}' },
          { type: 'TextSubheading', text: 'Monthly Capacity' },
          { type: 'TextBody', text: '${data.summary_capacity}' },
          {
            type: 'Footer',
            label: 'Confirm',
            'on-click-action': {
              name: 'complete',
              payload: {
                confirmed: true,
                business_name: '${data.summary_business}',
                summary_business: '${data.summary_business}',
                summary_location: '${data.summary_location}',
                summary_type: '${data.summary_type}',
                summary_capacity: '${data.summary_capacity}'
              }
            }
          }
        ]
      }
    }
  ];
}

// ---------------------------------------------------------------------------
// 1) SERVICE SELECTION FLOW (opens from "Choose service" CTA on the welcome msg)
//    Static list of B2B services. `already_dealer` flag toggles the first item.
// ---------------------------------------------------------------------------
export function serviceFlow() {
  return {
    version: VERSION,
    data_api_version: DATA_API,
    routing_model: {
      CHOOSE_SERVICE: ['BUSINESS_NAME', 'BULK_ORDER', 'GIFTING', 'COUNTRY_SELECT'],
      BUSINESS_NAME: ['STATE_SELECT'],
      STATE_SELECT: ['DISTRICT_CITY'],
      DISTRICT_CITY: ['BUSINESS_PROFILE'],
      BUSINESS_PROFILE: ['SUMMARY'],
      SUMMARY: [],
      BULK_ORDER: ['BULK_DETAILS'],
      BULK_DETAILS: [],
      GIFTING: [],
      COUNTRY_SELECT: ['EXPORT_DETAILS'],
      EXPORT_DETAILS: []
    },
    screens: [
      {
        id: 'CHOOSE_SERVICE',
        title: 'Choose a Service',
        data: {
          welcome_banner: { type: 'string', __example__: 'iVBORw0KGgo' },
          has_welcome_banner: { type: 'boolean', __example__: false },
          heading: { type: 'string', __example__: 'How can we help your business?' },
          subheading: { type: 'string', __example__: 'Select a service below to continue' },
          services: arrayDataWithImage([
            { id: 'dealer', title: 'Become a Dealer / Distributor', description: 'Get dealer pricing & product catalogue' },
            { id: 'bulk', title: 'Bulk / Wholesale Enquiry', description: 'Volume orders at wholesale rates' },
            { id: 'gifting', title: 'Corporate Gifting (B2B)', description: 'Custom premium gift hampers' },
            { id: 'export', title: 'Export / International Supply', description: 'Ship Devine products worldwide' }
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
              'alt-text': 'Devine Business',
              visible: '${data.has_welcome_banner}'
            },
            { type: 'TextHeading', text: '${data.heading}' },
            { type: 'TextCaption', text: '${data.subheading}' },
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
                payload: { screen: 'CHOOSE_SERVICE', selected_service: '${form.selected_service}' }
              }
            }
          ]
        }
      },
      ...dealerScreens(),
      ...bulkScreens(),
      ...giftingScreens(),
      ...exportScreens()
    ]
  };
}

// ---------------------------------------------------------------------------
// Screen helpers for the services merged into the Choose Service flow.
// ---------------------------------------------------------------------------

// Bulk / Wholesale: pick range (with 1:1 logos) -> quantity + contact details.
// Completion triggers a location ask handled by the chatbot.
function bulkScreens() {
  return [
    {
      id: 'BULK_ORDER',
      title: 'Bulk / Wholesale',
      data: {
        ranges: arrayDataWithImage([{ id: 'honey', title: 'Honey Range', description: 'MOQ 50/variant' }])
      },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          { type: 'TextBody', text: 'For bulk orders, our minimum order quantities are shown below.' },
          {
            type: 'RadioButtonsGroup',
            name: 'product_range',
            label: 'Select product range',
            required: true,
            'data-source': '${data.ranges}'
          },
          {
            type: 'Footer',
            label: 'Continue',
            'on-click-action': {
              name: 'data_exchange',
              payload: { screen: 'BULK_ORDER', product_range: '${form.product_range}' }
            }
          }
        ]
      }
    },
    {
      id: 'BULK_DETAILS',
      title: 'Your Details',
      terminal: true,
      data: {
        product_range: { type: 'string', __example__: 'honey' },
        product_label: { type: 'string', __example__: 'Honey Range - MOQ 50/variant' },
        wa_number: { type: 'string', __example__: '+919876543210' }
      },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          { type: 'TextSubheading', text: 'Selected product' },
          { type: 'TextBody', text: '${data.product_label}' },
          { type: 'TextInput', name: 'quantity', label: 'Quantity required', required: true, 'input-type': 'number' },
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
          { type: 'TextInput', name: 'contact_phone', label: 'Phone number', required: true, 'input-type': 'phone', 'helper-text': 'Alternate number for dispatch' },
          { type: 'TextInput', name: 'email', label: 'Email address', required: true, 'input-type': 'email' },
          {
            type: 'Footer',
            label: 'Confirm',
            'on-click-action': {
              name: 'complete',
              payload: {
                service: 'bulk',
                product_range: '${data.product_range}',
                product_label: '${data.product_label}',
                quantity: '${form.quantity}',
                name: '${form.name}',
                contact_phone: '${form.contact_phone}',
                email: '${form.email}',
                wa_number: '${data.wa_number}'
              }
            }
          }
        ]
      }
    }
  ];
}

// Corporate Gifting: hampers / budget / delivery date (calendar) / company + contact details.
function giftingScreens() {
  return [
    {
      id: 'GIFTING',
      title: 'Corporate Gifting',
      terminal: true,
      data: {
        wa_number: { type: 'string', __example__: '+919876543210' }
      },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          { type: 'TextBody', text: 'Custom premium natural gift hampers. Hampers start from Rs.299/unit (MOQ 50).' },
          { type: 'TextInput', name: 'hampers', label: 'Number of hampers required', required: true, 'input-type': 'number' },
          { type: 'TextInput', name: 'budget', label: 'Budget per hamper', required: true, 'input-type': 'number' },
          { type: 'DatePicker', name: 'delivery_date', label: 'Delivery date required', required: true },
          { type: 'TextInput', name: 'company', label: 'Company name', required: true, 'input-type': 'text' },
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
          { type: 'TextInput', name: 'contact_phone', label: 'Phone number', required: true, 'input-type': 'phone' },
          { type: 'TextInput', name: 'email', label: 'Email address', required: true, 'input-type': 'email' },
          {
            type: 'Footer',
            label: 'Confirm',
            'on-click-action': {
              name: 'complete',
              payload: {
                service: 'gifting',
                hampers: '${form.hampers}',
                budget: '${form.budget}',
                delivery_date: '${form.delivery_date}',
                company: '${form.company}',
                name: '${form.name}',
                contact_phone: '${form.contact_phone}',
                email: '${form.email}',
                wa_number: '${data.wa_number}'
              }
            }
          }
        ]
      }
    }
  ];
}

// Export / International: country select (endpoint) -> requirements.
function exportScreens() {
  return [
    {
      id: 'COUNTRY_SELECT',
      title: 'Export / International',
      data: {
        countries: arrayDataWithImage([{ id: 'enquiry', title: 'Enquiry', description: 'General enquiry' }])
      },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          { type: 'TextBody', text: 'Select a destination country or make a general enquiry.' },
          {
            type: 'Dropdown',
            name: 'country',
            label: 'Country',
            required: true,
            'data-source': '${data.countries}'
          },
          {
            type: 'Footer',
            label: 'Continue',
            'on-click-action': {
              name: 'data_exchange',
              payload: { screen: 'COUNTRY_SELECT', country: '${form.country}' }
            }
          }
        ]
      }
    },
    {
      id: 'EXPORT_DETAILS',
      title: 'Export Requirements',
      terminal: true,
      data: {
        products: arrayData([{ id: 'honey', title: 'Honey' }]),
        country_label: { type: 'string', __example__: 'Enquiry' },
        country_of_import: { type: 'string', __example__: '' }
      },
      layout: {
        type: 'SingleColumnLayout',
        children: [
          { type: 'TextInput', name: 'country_of_import', label: 'Country of import', required: true, 'input-type': 'text', 'init-value': '${data.country_of_import}' },
          {
            type: 'CheckboxGroup',
            name: 'products_required',
            label: 'Products required',
            required: true,
            'data-source': '${data.products}'
          },
          { type: 'TextInput', name: 'monthly_volume', label: 'Estimated monthly volume', required: true, 'input-type': 'text' },
          { type: 'TextInput', name: 'iec', label: 'Import license / IEC number', required: false, 'input-type': 'text' },
          {
            type: 'DocumentPicker',
            name: 'document',
            label: 'Upload your document (optional)',
            'max-file-size-kb': 10240,
            'allowed-mime-types': ['application/pdf', 'image/jpeg', 'image/png']
          },
          {
            type: 'Footer',
            label: 'Confirm',
            'on-click-action': {
              name: 'complete',
              payload: {
                service: 'export',
                country_of_import: '${form.country_of_import}',
                products_required: '${form.products_required}',
                monthly_volume: '${form.monthly_volume}',
                iec: '${form.iec}'
              }
            }
          }
        ]
      }
    }
  ];
}

export default { serviceFlow };
