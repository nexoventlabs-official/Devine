import { EventEmitter } from 'events';

// Central event bus for real-time admin updates (SSE).
class Bus extends EventEmitter {}
const bus = new Bus();
bus.setMaxListeners(50);

// Emit a new lead alert consumed by the admin SSE stream.
export function emitLead(lead) {
  bus.emit('lead', lead);
  bus.emit('update', { type: 'lead' });
}

export function emitOrder(order) {
  bus.emit('order', order);
  bus.emit('update', { type: 'order' });
}

export function emitMessage(message) {
  bus.emit('message', message);
}

export default bus;
