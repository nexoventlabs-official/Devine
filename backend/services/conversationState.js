import Conversation from '../models/Conversation.js';

// Thin helpers over the Conversation model used by the chatbot router.
export async function getConversation(phone, channel) {
  let convo = await Conversation.findOne({ phone, channel });
  if (!convo) {
    convo = await Conversation.create({ phone, channel, step: 'new', context: {} });
  }
  return convo;
}

export async function setStep(phone, channel, step, contextPatch = {}) {
  return Conversation.findOneAndUpdate(
    { phone, channel },
    { $set: { step, ...prefix('context', contextPatch), lastInboundAt: new Date() } },
    { new: true, upsert: true }
  );
}

export async function patchContext(phone, channel, contextPatch = {}) {
  return Conversation.findOneAndUpdate(
    { phone, channel },
    { $set: prefix('context', contextPatch) },
    { new: true, upsert: true }
  );
}

export async function resetConversation(phone, channel) {
  return Conversation.findOneAndUpdate(
    { phone, channel },
    { $set: { step: 'welcome', context: {} } },
    { new: true, upsert: true }
  );
}

// Build a dotted $set patch so we only touch nested context keys.
function prefix(root, obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) out[`${root}.${k}`] = v;
  return out;
}

export default { getConversation, setStep, patchContext, resetConversation };
