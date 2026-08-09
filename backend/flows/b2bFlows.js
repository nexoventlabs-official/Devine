// B2B WhatsApp Flow JSON definitions (Flow JSON v5.1).
// The dealer flow is endpoint-driven (data_exchange) for dynamic state->district.
import { stateOptions } from '../data/geo.js';

const VERSION = '5.1';
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

// ---------------------------------------------------------------------------
// 1) SERVICE SELECTION FLOW (opens from "Choose service" CTA on the welcome msg)
//    Static list of B2B services. `already_dealer` flag toggles the first item.
// ---------------------------------------------------------------------------
export function serviceFlow() {
  return {
    version: VERSION,
    screens: [
      {
        id: 'CHOOSE_SERVICE',
        title: 'Choose a Service',
        terminal: true,
        data: {
          services: arrayData([{ id: 'dealer', title: 'Become a Dealer / Distributor' }])
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            {
              type: 'RadioButtonsGroup',
              name: 'selected_service',
              label: 'How can we help your business?',
              required: true,
              'data-source': '${data.services}'
            },
            {
              type: 'Footer',
              label: 'Continue',
              'on-click-action': {
                name: 'complete',
                payload: { selected_service: '${form.selected_service}' }
              }
            }
          ]
        }
      }
    ]
  };
}

// ---------------------------------------------------------------------------
// 2) DEALER / DISTRIBUTOR SIGNUP FLOW (endpoint-driven)
// ---------------------------------------------------------------------------
export function dealerFlow() {
  return {
    version: VERSION,
    data_api_version: DATA_API,
    routing_model: {
      BUSINESS_NAME: ['STATE_SELECT'],
      STATE_SELECT: ['DISTRICT_CITY'],
      DISTRICT_CITY: ['BUSINESS_PROFILE'],
      BUSINESS_PROFILE: ['SUMMARY'],
      SUMMARY: []
    },
    screens: [
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
        data: {
          states: arrayData(stateOptions().slice(0, 2))
        },
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
        data: {
          districts: arrayData([{ id: 'Chennai', title: 'Chennai' }])
        },
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
                payload: {
                  screen: 'BUSINESS_PROFILE',
                  business_type: '${form.business_type}',
                  capacity: '${form.capacity}'
                }
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
              'on-click-action': { name: 'complete', payload: { confirmed: true } }
            }
          ]
        }
      }
    ]
  };
}

// ---------------------------------------------------------------------------
// 3) BULK / WHOLESALE FLOW (MOQ select -> quantity)
// ---------------------------------------------------------------------------
export function bulkFlow() {
  return {
    version: VERSION,
    screens: [
      {
        id: 'BULK_ORDER',
        title: 'Bulk / Wholesale',
        terminal: true,
        data: {
          ranges: arrayData([{ id: 'honey', title: 'Honey Range - MOQ 50 units/variant' }])
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            { type: 'TextBody', text: 'For bulk orders, our minimum order quantities are:' },
            {
              type: 'RadioButtonsGroup',
              name: 'product_range',
              label: 'Select product range',
              required: true,
              'data-source': '${data.ranges}'
            },
            {
              type: 'TextInput',
              name: 'quantity',
              label: 'Quantity required',
              required: true,
              'input-type': 'number'
            },
            {
              type: 'Footer',
              label: 'Confirm',
              'on-click-action': {
                name: 'complete',
                payload: { product_range: '${form.product_range}', quantity: '${form.quantity}' }
              }
            }
          ]
        }
      }
    ]
  };
}

// ---------------------------------------------------------------------------
// 4) CORPORATE GIFTING FLOW
// ---------------------------------------------------------------------------
export function giftingFlow() {
  return {
    version: VERSION,
    screens: [
      {
        id: 'GIFTING',
        title: 'Corporate Gifting',
        terminal: true,
        data: {},
        layout: {
          type: 'SingleColumnLayout',
          children: [
            { type: 'TextBody', text: 'Custom premium natural gift hampers. Hampers start from Rs.299/unit (MOQ 50).' },
            { type: 'TextInput', name: 'hampers', label: 'Number of hampers required', required: true, 'input-type': 'number' },
            { type: 'TextInput', name: 'budget', label: 'Budget per hamper', required: true, 'input-type': 'number' },
            { type: 'TextInput', name: 'delivery_date', label: 'Delivery date required', required: true, 'input-type': 'text' },
            { type: 'TextInput', name: 'company', label: 'Company name', required: true, 'input-type': 'text' },
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

// ---------------------------------------------------------------------------
// 5) EXPORT / INTERNATIONAL FLOW (country select incl. Enquiry -> details)
// ---------------------------------------------------------------------------
export function exportFlow() {
  return {
    version: VERSION,
    data_api_version: DATA_API,
    routing_model: { COUNTRY_SELECT: ['EXPORT_DETAILS'], EXPORT_DETAILS: [] },
    screens: [
      {
        id: 'COUNTRY_SELECT',
        title: 'Export / International',
        data: {
          countries: arrayData([{ id: 'enquiry', title: 'Enquiry' }])
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
          country_label: { type: 'string', __example__: 'Enquiry' }
        },
        layout: {
          type: 'SingleColumnLayout',
          children: [
            { type: 'TextInput', name: 'country_of_import', label: 'Country of import', required: true, 'input-type': 'text' },
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
    ]
  };
}

export default { serviceFlow, dealerFlow, bulkFlow, giftingFlow, exportFlow };
