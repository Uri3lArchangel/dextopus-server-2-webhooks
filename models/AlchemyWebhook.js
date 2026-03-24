const mongoose = require('mongoose');

const AlchemyWebhookSchema = new mongoose.Schema(
  {
    chain: { type: String, required: true, unique: true, index: true },
    network: { type: String, required: true },
    webhookId: { type: String, required: true, index: true },
    signingKey: { type: String, required: true },
    webhookUrl: { type: String, required: true },
    tokenIndex: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

AlchemyWebhookSchema.index({ webhookId: 1 }, { unique: true });

module.exports = mongoose.model('AlchemyWebhook', AlchemyWebhookSchema);
