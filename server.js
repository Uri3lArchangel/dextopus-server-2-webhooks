// server.js - Main Express server
const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const txListener = require('./script.js');

dotenv.config();


// Initialize express
const app = express();

// Enable trust proxy for correct client IP detection behind proxies (secure: trust only first proxy)
app.set('trust proxy', 1);

// Middleware to capture raw body for webhook verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  },
  limit: '10mb'
}));

app.use(helmet());
app.use(cors());

// Cache setup
const cache = new NodeCache({ 
  stdTTL: 300,
  checkperiod: 60,
  maxKeys: 1000 
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Constants
const SECRET_KEY = process.env.SECRET_KEY; // Shared ONLY with Server 1
const TOKEN_EXPIRY_SECONDS = 300; // 5 minutes

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// ==================== TOKEN AUTHENTICATION (Server 1 only) ====================

class TokenManager {
  static generateToken(timestamp = Date.now()) {
    const payload = `${timestamp}:${crypto.randomBytes(16).toString('hex')}`;
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(payload);
    const signature = hmac.digest('hex');
    return `${payload}:${signature}`;
  }

  static validateToken(token) {
    try {
      const parts = token.split(':');
      if (parts.length !== 3) return false;

      const [timestamp, nonce, signature] = parts; 
      
      // Check expiration
      const tokenTime = parseInt(timestamp);
      const now = Date.now();
      if (now - tokenTime > TOKEN_EXPIRY_SECONDS * 1000) {
        return false;
      }

      // Verify signature
      const payload = `${timestamp}:${nonce}`;
      const hmac = crypto.createHmac('sha256', SECRET_KEY);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');

      if (signature !== expectedSignature) {
        return false;
      }

      // Prevent replay attacks
      const replayKey = `token:${nonce}`;
      if (cache.has(replayKey)) {
        return false;
      }
      cache.set(replayKey, true, TOKEN_EXPIRY_SECONDS);

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
}

// Middleware to verify requests from Server 1 only
const authenticateServer1 = (req, res, next) => {
  const token = req.headers['x-access-token'];
  
  if (!token) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  if (!TokenManager.validateToken(token)) {
    return res.status(403).json({ error: 'Invalid or expired access token' });
  }

  next();
};

// ==================== HEALTH ENDPOINT ====================

app.get('/health', (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'healthy',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cache: {
      keys: cache.keys().length
    }
  };
  res.status(200).json(health);
});

// ==================== ENDPOINTS ====================

/**
 * ENDPOINT 1: Server 1 calls this after building transaction
 * POST /api/register-transaction
 */
app.post("/api/register-transaction", authenticateServer1, async (req, res) => {
  try {
    const { apiKey, recipientAddress, amount, blockchain, vm } = req.body;
      console.log({ALCHEMY_AUTH_TOKEN: process.env.ALCHEMY_AUTH_TOKEN});
    // Validate required fields
    if (!apiKey || !recipientAddress || !amount || !blockchain || !vm) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['apiKey', 'recipientAddress', 'amount', 'blockchain', 'vm']
      });
    }

    console.log(`📝 Registering transaction for API key: ${apiKey.substring(0, 8)}...`);

    // Call the programmatic trackTransaction function
    const trackingId = await txListener.trackTransaction(apiKey, {
      recipientAddress,
      amount,
      blockchain,
      vm
    });

    res.status(200).json({
      success: true,
      trackingId,
      message: 'Transaction registered for monitoring'
    });

  } catch (error) {
    console.error('❌ Error registering transaction:', error);
    
    if (error.message.includes('Invalid API key')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to register transaction',
      details: error.message 
    });
  }
});

/**
 * ENDPOINT 2: Alchemy webhook (EVM chains)
 */
app.post('/api/alchemy-webhook', async (req, res) => {
  try {
    await txListener.alchemyWebhook(req, res);
  } catch (error) {
    console.error('❌ Alchemy webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * ENDPOINT 3: Tatum webhook (Tron)
 */
app.post('/api/tatum-webhook', async (req, res) => {
  try {
    await txListener.tatumWebhook(req, res);
  } catch (error) {
    console.error('❌ Tatum webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * ADMIN: Reconcile Alchemy webhooks for pending addresses
 * POST /api/admin/reconcile-webhooks
 * Body: { limit?: number, dryRun?: boolean }
 */
app.post('/api/admin/reconcile-webhooks', authenticateServer1, async (req, res) => {
  try {
    const { limit, dryRun } = req.body || {};
    const summary = await txListener.reconcileAlchemyWebhooks({
      limit: typeof limit === 'number' ? limit : 100,
      dryRun: !!dryRun
    });
    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error('❌ Reconcile webhooks error:', error);
    res.status(500).json({ error: 'Reconcile failed', details: error.message });
  }
});

/**
 * ENDPOINT 4: Dashboard fetches user transactions
 * GET /api/transactions/:apiKey
 */
app.get('/api/transactions/:apiKey', async (req, res) => {
  try {
    const { apiKey } = req.params;

    console.log(`📊 Dashboard fetching transactions for API key: ${apiKey.substring(0, 8)}...`);

    // Get transactions from listener
    const [pending, completed] = await Promise.all([
      txListener.getUserPendingTransactions(apiKey),
      txListener.getUserCompletedTransactions(apiKey)
    ]);

    res.status(200).json({
      success: true,
      pending: pending.map(t => ({
        trackingId: t.trackingId,
        recipientAddress: t.recipientAddress,
        expectedAmount: t.amount,
        blockchain: t.blockchain,
        status: t.status,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
        timeRemaining: Math.max(0, new Date(t.expiresAt) - Date.now())
      })),
      completed: completed.map(t => ({
        hash: t.hash,
        amount: t.amount,
        currency: t.currency,
        fromAddress: t.fromAddress,
        toAddress: t.toAddress,
        createdAt: t.createdAt
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== START SERVER ====================

let isInitialized = false;

const initializeApp = async (req, res, next) => {
  if (!isInitialized) {
    try {
      // Connect to MongoDB if not already connected
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');
      }
      
      // Initialize your custom txListener
      await txListener.initialize();
      
      isInitialized = true;
      next();
    } catch (error) {
      console.error('Initialization Error:', error);
      res.status(500).send('Server Initialization Failed');
    }
  } else {
    next();
  }
};
app.use(initializeApp);
const PORT = process.env.PORT || 3005;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3005;
  app.listen(PORT, () => {
    console.log(`🚀 Local Server running on port ${PORT}`);
  });
}

module.exports = app;
