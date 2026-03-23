const mongoose = require('mongoose');

const ProcessedHashSchema = new mongoose.Schema(
  {
    hash: { type: String, required: true, index: true },
    chain: { type: String, required: true, index: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ProcessedHashSchema.index({ hash: 1, chain: 1 }, { unique: true });
const ttlDays = Number(process.env.PROCESSED_HASH_TTL_DAYS || 90);
if (Number.isFinite(ttlDays) && ttlDays > 0) {
  ProcessedHashSchema.index({ createdAt: 1 }, { expireAfterSeconds: Math.floor(ttlDays * 86400) });
}

module.exports = mongoose.model('ProcessedHash', ProcessedHashSchema);
