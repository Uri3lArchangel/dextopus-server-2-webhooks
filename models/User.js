// models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;


const TransactionSchema = new Schema({
  hash: { type: String, required: true },
  amount: { type: Number, required: true },
  displayAmount: { type: String }, // Formatted amount for display
  currency: { type: String, required: true, default: 'ETH' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  fromAddress: { type: String, required: true },
  toAddress: { type: String, required: true },
  fromChain: { type: String }, // Source chain (for cross-chain)
  toChain: { type: String, required: true }, // Destination chain
  explorerUrl: { type: String }, // Link to view transaction on explorer
  tokenAddress: { type: String }, // Token contract address
  decimals: { type: Number }, // Token decimals
  blockNumber: { type: Number } // Block number where transaction occurred
});

// New schema for tracking pending transactions
const TrackingSchema = new Schema({
  trackingId: { type: String, required: true },
  recipientAddress: { type: String, required: true },
  amount: { type: Number, required: true },
  blockchain: { type: String, required: true }, // Source chain
  toChain: { type: String, required: true }, // 👈 Add destination chain
  vm: { type: String, required: true, enum: ['EVM', 'TVM', 'SVM'] },
  status: { type: String, enum: ['pending', 'completed', 'expired', 'timeout'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  completedAt: { type: Date },
  transactionHash: { type: String },
  error: { type: String }
});

const FeeRecipientSchema = new Schema({
  evm: { type: String, required: true },
  tvm: { type: String, required: true },
  svm: { type: String, required: true },
}, { _id: false });

const BusinessProfileSchema = new Schema({
  businessName: { type: String },
  businessAddress: { type: String },
  businessPhone: { type: String },
  businessWebsite: { type: String },
  taxId: { type: String },
  businessType: { type: String },
  completedAt: { type: Date },
  skippedAt: { type: Date },
}, { _id: false });

const IntegrationSchema = new Schema({
  apiKey: { type: String, required: true },
  name: { type: String, required: true },
  feeRecipients: { type: FeeRecipientSchema, required: true },
  feeBPS: { type: Number, required: true, min: 0, max: 10000 },
  txHashes: [TransactionSchema],
  pendingTrackings: [TrackingSchema],
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    businessProfile: { type: BusinessProfileSchema },
    integrations: [IntegrationSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
UserSchema.index(
  { 'integrations.apiKey': 1 },
  {
    unique: true,
    partialFilterExpression: { 'integrations.apiKey': { $exists: true, $type: 'string' } },
  }
);
UserSchema.index(
  { 'integrations.pendingTrackings.trackingId': 1 },
  {
    unique: true,
    partialFilterExpression: { 'integrations.pendingTrackings.trackingId': { $exists: true, $type: 'string' } },
  }
);
UserSchema.index(
  { 'integrations.txHashes.hash': 1 },
  {
    unique: true,
    partialFilterExpression: { 'integrations.txHashes.hash': { $exists: true, $type: 'string' } },
  }
);
UserSchema.index({ 'integrations.pendingTrackings.status': 1 });
UserSchema.index({
  'integrations.pendingTrackings.recipientAddress': 1,
  'integrations.pendingTrackings.blockchain': 1,
  'integrations.pendingTrackings.status': 1
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
