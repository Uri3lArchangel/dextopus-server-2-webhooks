const mongoose = require('mongoose');

const WebhookKeySchema = new mongoose.Schema(
  {
    address: { type: String, index: true, lowercase: true, trim: true },
    webhookId: { type: String, index: true },
    signingKey: { type: String, required: true },
    chain: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

WebhookKeySchema.index({ address: 1, chain: 1 }, { unique: true, sparse: true });
WebhookKeySchema.index({ webhookId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('WebhookKey', WebhookKeySchema);
