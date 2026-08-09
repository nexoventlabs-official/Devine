import mongoose from 'mongoose';

// Generic key-value settings store. Used for Flow Images (banners, icons, PDFs),
// published Flow IDs, Google review link, support numbers, etc.
// Managed from the admin "Flow Images" page.
const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: mongoose.Schema.Types.Mixed },
    group: { type: String, default: 'general' }, // 'flow_images' | 'flow_ids' | 'links' | 'general'
    label: { type: String, default: '' }
  },
  { timestamps: true }
);

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);

// Convenience helpers
export async function getSetting(key, fallback = null) {
  const Setting = mongoose.models.Setting;
  const doc = await Setting.findOne({ key });
  return doc ? doc.value : fallback;
}

export async function setSetting(key, value, group = 'general', label = '') {
  const Setting = mongoose.models.Setting;
  return Setting.findOneAndUpdate(
    { key },
    { $set: { value, group, label } },
    { new: true, upsert: true }
  );
}
