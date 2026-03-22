// server2-monitor.js - Complete script for Server 2 with toChain as reference only
const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Import token list and constants
const { TOKENS, NATIVE_TOKEN_ADDRESS } = require('./tokens.js');

// ==================== CHAIN EXPLORERS ====================
const CHAIN_EXPLORERS = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  bsc: 'https://bscscan.com/tx/',
  arbitrum: 'https://arbiscan.io/tx/',
  optimism: 'https://optimistic.etherscan.io/tx/',
  base: 'https://basescan.org/tx/',
  avalanche: 'https://snowtrace.io/tx/',
  tron: 'https://tronscan.org/#/transaction/',
  mantle: 'https://mantlescan.xyz/tx/',
  cronos: 'https://cronoscan.com/tx/',
  gnosis: 'https://gnosisscan.io/tx/',
  flare: 'https://flare-explorer.flare.network/tx/',
  ink: 'https://explorer.ink.io/tx/',
  unichain: 'https://uniscan.xyz/tx/',
  bera: 'https://berascan.com/tx/',
  plasma: 'https://plasmascan.io/tx/',
  monad: 'https://monadexplorer.com/tx/',
  katana: 'https://katanascan.com/tx/'
};

// ==================== CONFIGURATION ====================
const CONFIG = {
  PORT: process.env.PORT || 3005,
  
  // Security
  SECRET_KEY: process.env.SECRET_KEY,
  
  // Alchemy
  ALCHEMY_KEY: process.env.ALCHEMY_KEY,
  ALCHEMY_AUTH_TOKEN: process.env.ALCHEMY_AUTH_TOKEN,
  
  // Tatum
  TATUM_API_KEY: process.env.TATUM_API_KEY,
  TATUM_WEBHOOK_SECRET: process.env.TATUM_WEBHOOK_SECRET,
  
  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI,
  
  // Server URL
  SERVER2_URL: process.env.SERVER2_URL || 'http://localhost:3005',
  
  // Contract addresses
  ETH_CONTRACT_ADDRESS: process.env.ETH_CONTRACT_ADDRESS,
  BSC_CONTRACT_ADDRESS: process.env.BSC_CONTRACT_ADDRESS,
  POLYGON_CONTRACT_ADDRESS: process.env.POLYGON_CONTRACT_ADDRESS,
  TRON_CONTRACT_ADDRESS: process.env.TRON_CONTRACT_ADDRESS,
  ARBITRUM_CONTRACT_ADDRESS: process.env.ARBITRUM_CONTRACT_ADDRESS,
  OPTIMISM_CONTRACT_ADDRESS: process.env.OPTIMISM_CONTRACT_ADDRESS,
  BASE_CONTRACT_ADDRESS: process.env.BASE_CONTRACT_ADDRESS,
  AVALANCHE_CONTRACT_ADDRESS: process.env.AVALANCHE_CONTRACT_ADDRESS,
  MANTLE_CONTRACT_ADDRESS: process.env.MANTLE_CONTRACT_ADDRESS,
  CRONOS_CONTRACT_ADDRESS: process.env.CRONOS_CONTRACT_ADDRESS,
  GNOSIS_CONTRACT_ADDRESS: process.env.GNOSIS_CONTRACT_ADDRESS,
  FLARE_CONTRACT_ADDRESS: process.env.FLARE_CONTRACT_ADDRESS,
  INK_CONTRACT_ADDRESS: process.env.INK_CONTRACT_ADDRESS,
  UNICHAIN_CONTRACT_ADDRESS: process.env.UNICHAIN_CONTRACT_ADDRESS,
  BERA_CONTRACT_ADDRESS: process.env.BERA_CONTRACT_ADDRESS,
  PLASMA_CONTRACT_ADDRESS: process.env.PLASMA_CONTRACT_ADDRESS,
  MONAD_CONTRACT_ADDRESS: process.env.MONAD_CONTRACT_ADDRESS,
  KATANA_CONTRACT_ADDRESS: process.env.KATANA_CONTRACT_ADDRESS,
  
  
  // Chain configurations
  CHAINS: {
    ethereum: {
      compiler: 'EVM',
      chainId: 1,
      alchemyUrl: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.ETH_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'ETH',
      explorer: CHAIN_EXPLORERS.ethereum
    },
    polygon: {
      compiler: 'EVM',
      chainId: 137,
      alchemyUrl: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.POLYGON_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'POL',
      explorer: CHAIN_EXPLORERS.polygon
    },
    bsc: {
      compiler: 'EVM',
      chainId: 56,
      alchemyUrl: `https://bnb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.BSC_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'BNB',
      explorer: CHAIN_EXPLORERS.bsc
    },
    arbitrum: {
      compiler: 'EVM',
      chainId: 42161,
      alchemyUrl: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.ARBITRUM_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'ETH',
      explorer: CHAIN_EXPLORERS.arbitrum
    },
    optimism: {
      compiler: 'EVM',
      chainId: 10,
      alchemyUrl: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.OPTIMISM_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'ETH',
      explorer: CHAIN_EXPLORERS.optimism
    },
    base: {
      compiler: 'EVM',
      chainId: 8453,
      alchemyUrl: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.BASE_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'ETH',
      explorer: CHAIN_EXPLORERS.base
    },
    avalanche: {
      compiler: 'EVM',
      chainId: 43114,
      alchemyUrl: `https://avax-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.AVALANCHE_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'AVAX',
      explorer: CHAIN_EXPLORERS.avalanche
    },
    tron: {
      compiler: 'TVM',
      chainId: 728126428,
      contractAddress: process.env.TRON_CONTRACT_ADDRESS,
      webhookProvider: 'tatum',
      decimals: 6,
      nativeToken: 'TRX',
      explorer: CHAIN_EXPLORERS.tron
    },
    mantle: {
      compiler: 'EVM',
      chainId: 5000,
      alchemyUrl: `https://mantle-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.MANTLE_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'MNT',
      explorer: CHAIN_EXPLORERS.mantle
    },
    cronos: {
      compiler: 'EVM',
      chainId: 25,
      alchemyUrl: `https://cronos-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.CRONOS_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'CRO',
      explorer: CHAIN_EXPLORERS.cronos
    },
    gnosis: {
      compiler: 'EVM',
      chainId: 100,
      alchemyUrl: `https://gnosis-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.GNOSIS_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'XDAI',
      explorer: CHAIN_EXPLORERS.gnosis
    },
    flare: {
      compiler: 'EVM',
      chainId: 14,
      alchemyUrl: `https://flare-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.FLARE_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'FLR',
      explorer: CHAIN_EXPLORERS.flare
    },
    ink: {
      compiler: 'EVM',
      chainId: 57073,
      alchemyUrl: `https://ink-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.INK_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'INK',
      explorer: CHAIN_EXPLORERS.ink
    },
    unichain: {
      compiler: 'EVM',
      chainId: 130,
      alchemyUrl: `https://unichain-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.UNICHAIN_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'UNI',
      explorer: CHAIN_EXPLORERS.unichain
    },
    bera: {
      compiler: 'EVM',
      chainId: 80094,
      alchemyUrl: `https://bera-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.BERA_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'BERA',
      explorer: CHAIN_EXPLORERS.bera
    },
    plasma: {
      compiler: 'EVM',
      chainId: 9745,
      alchemyUrl: `https://plasma-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.PLASMA_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'XPL',
      explorer: CHAIN_EXPLORERS.plasma
    },
    monad: {
      compiler: 'EVM',
      chainId: 143,
      alchemyUrl: `https://monad-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.MONAD_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'MON',
      explorer: CHAIN_EXPLORERS.monad
    },
    katana: {
      compiler: 'EVM',
      chainId: 1260,
      alchemyUrl: `https://katana-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
      contractAddress: process.env.KATANA_CONTRACT_ADDRESS,
      webhookProvider: 'alchemy',
      decimals: 18,
      nativeToken: 'KATANA',
      explorer: CHAIN_EXPLORERS.katana
    }
  }
};

// Import User model
const UserModel = require('./models/User.js');

// ==================== IN-MEMORY CACHE ====================
const processedHashes = new Set();
const pendingTrackings = new Map();
const addressToTrackings = new Map();
const webhookMapping = new Map();

// Helper function to find token
function findToken(chain, address, symbol) {
  if (address) {
    const addressLower = address.toLowerCase();
    const token = TOKENS.find(t => 
      t.address.toLowerCase() === addressLower && 
      t.chains.includes(chain)
    );
    if (token) return token;
  }
  
  if (symbol) {
    const symbolUpper = symbol.toUpperCase();
    const token = TOKENS.find(t => 
      t.symbol.toUpperCase() === symbolUpper && 
      t.chains.includes(chain)
    );
    if (token) return token;
  }
  
  return TOKENS.find(t => 
    t.address === NATIVE_TOKEN_ADDRESS && 
    t.chains.includes(chain)
  );
}

// ==================== UTILITY FUNCTIONS ====================

function isValidWebhookUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function getExplorerUrl(chain, hash) {
  const explorer = CHAIN_EXPLORERS[chain];
  return explorer ? `${explorer}${hash}` : null;
}

function verifyServer1Request(req) {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const body = JSON.stringify(req.body);
  
  if (!signature || !timestamp) return false;
  if (Date.now() - parseInt(timestamp) > 300000) return false;
  
  const expectedSignature = crypto
    .createHmac('sha256', CONFIG.SECRET_KEY)
    .update(timestamp + body)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

async function verifyAlchemyWebhook(req) {
  const signature = req.headers['x-alchemy-signature'];
  if (!signature) {
    console.log('❌ No signature header found');
    return false;
  }

  try {
    const payload = req.body;
    
    let address = null;
    let webhookId = null;
    
    if (payload.event?.activity?.[0]?.toAddress) {
      address = payload.event.activity[0].toAddress;
      webhookId = payload.webhookId;
    } else if (payload.activity?.[0]?.toAddress) {
      address = payload.activity[0].toAddress;
      webhookId = payload.webhookId;
    } else if (payload.params?.result?.toAddress) {
      address = payload.params.result.toAddress;
    } else if (payload.toAddress) {
      address = payload.toAddress;
    } else if (payload.webhookId) {
      webhookId = payload.webhookId;
      for (const [addr, data] of webhookMapping.entries()) {
        if (data.webhookId === payload.webhookId) {
          address = addr;
          break;
        }
      }
    }
    
    if (!address) {
      console.log('⚠️ Could not extract address from webhook payload');
      return false;
    }
    
    const addressKey = address.toLowerCase();
    
    if (webhookMapping.has(addressKey)) {
      const signingKey = webhookMapping.get(addressKey).signingKey;
      
      const expectedSignature = crypto
        .createHmac('sha256', signingKey)
        .update(req.rawBody || JSON.stringify(req.body))
        .digest('hex');
        
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    }
    
    console.log(`⚠️ No signing key found for address ${address}`);
    return false;
    
  } catch (error) {
    console.error('❌ Error verifying Alchemy webhook:', error);
    return false;
  }
}

function verifyTatumWebhook(req) {
  const signature = req.headers['x-payload-hash'];
  if (!signature) return false;
  
  const expectedSignature = crypto
    .createHmac('sha512', CONFIG.TATUM_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('base64');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

let cachedDb = null;

async function connectDB() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  
  mongoose.set('bufferCommands', false);
  
  const conn = await mongoose.connect(CONFIG.MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });
  
  cachedDb = conn;
  return conn;
}

// ==================== WEBHOOK SETUP ====================

async function enableTatumHmac() {
  try {
    await axios.put(
      'https://api.tatum.io/v4/subscription',
      {
        hmacSecret: CONFIG.TATUM_WEBHOOK_SECRET
      },
      {
        headers: {
          'x-api-key': CONFIG.TATUM_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Tatum HMAC enabled successfully');
  } catch (error) {
    console.error('❌ Failed to enable Tatum HMAC:', error.response?.data || error.message);
  }
}

async function createTatumWebhook(address) {
  try {
    const webhookUrl = `${CONFIG.SERVER2_URL}/api/tatum-webhook`;
    
    const response = await axios.get(
      'https://api.tatum.io/v4/subscription',
      {
        headers: {
          'x-api-key': CONFIG.TATUM_API_KEY
        }
      }
    );

    const existing = response.data.find(s => 
      s.attr && s.attr.address === address && 
      s.type === 'ADDRESS_EVENT'
    );

    if (!existing) {
      await axios.post(
        'https://api.tatum.io/v4/subscription',
        {
          type: 'ADDRESS_EVENT',
          attr: {
            chain: 'TRON',
            address: address,
            url: webhookUrl
          }
        },
        {
          headers: {
            'x-api-key': CONFIG.TATUM_API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ Created Tatum webhook for Tron address: ${address}`);
    }
  } catch (error) {
    console.error(`❌ Failed to create Tatum webhook:`, error.response?.data || error.message);
  }
}

async function createAlchemyWebhook(chain, address) {
  if (!CONFIG.ALCHEMY_AUTH_TOKEN) {
    console.log(`⚠️ Alchemy Auth Token not configured.`);
    return;
  }

  try {
    // Ensure no double slash in webhook URL
    let baseUrl = CONFIG.SERVER2_URL;
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const webhookUrl = `${baseUrl}/api/alchemy-webhook`;
    console.log({webhookUrl});
    if (!isValidWebhookUrl(webhookUrl)) {
      console.error(`❌ Invalid webhook URL: ${webhookUrl}`);
      return;
    }
    
    const networkMap = {
      ethereum: 'ETH_MAINNET',
      polygon: 'MATIC_MAINNET',
      arbitrum: 'ARB_MAINNET',
      optimism: 'OPT_MAINNET',
      base: 'BASE_MAINNET',
      bsc: 'BNB_MAINNET',
      avalanche: 'AVAX_MAINNET',
      mantle: 'MANTLE_MAINNET',
      cronos: 'CRONOS_MAINNET',
      gnosis: 'GNOSIS_MAINNET',
      flare: 'FLARE_MAINNET',
      ink: 'INK_MAINNET',
      unichain: 'UNICHAIN_MAINNET',
      bera: 'BERA_MAINNET',
      plasma: 'PLASMA_MAINNET',
      monad: 'MONAD_MAINNET',
      katana: 'KATANA_MAINNET'
    };
    
    const network = networkMap[chain];
    if (!network) {
      console.error(`❌ Unsupported chain for Alchemy webhooks: ${chain}`);
      return;
    }

    const createResponse = await axios.post(
      'https://dashboard.alchemy.com/api/create-webhook',
      {
        network: network,
        webhook_type: 'ADDRESS_ACTIVITY',
        webhook_url: webhookUrl,
        addresses: [address]
      },
      {
        headers: {
          'X-Alchemy-Token': CONFIG.ALCHEMY_AUTH_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Created Alchemy webhook for ${chain}: ${address}`);
    
    if (createResponse.data?.data?.id) {
      const webhookId = createResponse.data.data.id;
      const signingKey = createResponse.data.data.signing_key;
      
      webhookMapping.set(address.toLowerCase(), {
        webhookId,
        signingKey,
        chain,
        createdAt: new Date()
      });
      
      console.log(`   Webhook ID: ${webhookId}`);
      console.log(`   Signing Key stored for verification`);
    }

  } catch (error) {
    console.error(`❌ Failed to create Alchemy webhook:`, error.response?.data || error.message);
  }
}

// ==================== TRANSACTION PROCESSING ====================

async function processTransaction(transaction, apiKey, trackingId) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    processedHashes.add(transaction.hash);

    const tracking = pendingTrackings.get(trackingId);
    const expectedAmount = tracking?.data?.amount;

    // Get explorer URL for this chain
    const explorerUrl = getExplorerUrl(transaction.chain, transaction.hash);

    const result = await UserModel.updateOne(
      { 'integrations.apiKey': apiKey },
      {
        $pull: { 'integrations.$.pendingTrackings': { trackingId: trackingId } },
        $push: {
          'integrations.$.txHashes': {
            hash: transaction.hash,
            amount: transaction.amount,
            displayAmount: transaction.displayAmount,
            currency: transaction.currency,
            status: 'completed',
            fromAddress: transaction.fromAddress,
            toAddress: transaction.toAddress,
            fromChain: transaction.chain, // The chain where fee was collected
            toChain: tracking?.data?.toChain || transaction.chain, // Store the intended destination chain from tracking
            explorerUrl: explorerUrl,
            tokenAddress: transaction.tokenAddress,
            decimals: transaction.decimals,
            blockNumber: transaction.blockNumber,
            createdAt: new Date()
          }
        }
      },
      { session }
    );

    if (result.modifiedCount === 0) {
      throw new Error('Failed to update user document');
    }

    await session.commitTransaction();

    pendingTrackings.delete(trackingId);
    
    const addressKey = transaction.toAddress.toLowerCase();
    if (addressToTrackings.has(addressKey)) {
      const trackings = addressToTrackings.get(addressKey);
      const updated = trackings.filter(id => id !== trackingId);
      if (updated.length > 0) {
        addressToTrackings.set(addressKey, updated);
      } else {
        addressToTrackings.delete(addressKey);
      }
    }

    console.log(`✅ Transaction completed: ${trackingId} -> ${transaction.hash}`);
    console.log(`   Amount: ${transaction.displayAmount} ${transaction.currency} (Expected: ${expectedAmount || 'N/A'})`);
    console.log(`   Fee collected on: ${transaction.chain}`);
    console.log(`   Destination chain (reference): ${tracking?.data?.toChain || 'N/A'}`);
    console.log(`   Explorer: ${explorerUrl}`);

    return true;

  } catch (error) {
    await session.abortTransaction();
    console.error(`❌ Error processing transaction:`, error);
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Find matching pending tracking for a transaction
 * Matches by address AND source chain (blockchain)
 */
async function findMatchingTracking(transaction) {
  await connectDB();
  
  const addressKey = transaction.toAddress.toLowerCase();
  
  // First check memory cache with source chain matching
  if (addressToTrackings.has(addressKey)) {
    const trackingIds = addressToTrackings.get(addressKey);
    
    for (const trackingId of trackingIds) {
      if (pendingTrackings.has(trackingId)) {
        const tracking = pendingTrackings.get(trackingId);
        // Match by address AND source chain (blockchain) - this is where the fee is collected
        if (tracking.data.blockchain === transaction.chain) {
          return {
            apiKey: tracking.apiKey,
            trackingId: trackingId
          };
        }
      }
    }
  }
  
  // If not in cache, search database with source chain matching
  const users = await UserModel.find({
    'integrations.pendingTrackings': {
      $elemMatch: {
        recipientAddress: { $regex: new RegExp(`^${transaction.toAddress}$`, 'i') },
        blockchain: transaction.chain, // Match by source chain where fee is collected
        status: 'pending'
      }
    }
  }).lean();

  for (const user of users) {
    for (const integration of user.integrations) {
      const match = integration.pendingTrackings.find(t => 
        t.recipientAddress.toLowerCase() === transaction.toAddress.toLowerCase() &&
        t.blockchain === transaction.chain && // Match by source chain
        t.status === 'pending'
      );
      
      if (match) {
        // Store in memory caches
        pendingTrackings.set(match.trackingId, {
          apiKey: integration.apiKey,
          data: match
        });
        
        if (!addressToTrackings.has(addressKey)) {
          addressToTrackings.set(addressKey, []);
        }
        addressToTrackings.get(addressKey).push(match.trackingId);
        
        return {
          apiKey: integration.apiKey,
          trackingId: match.trackingId
        };
      }
    }
  }
  
  return null;
}

// ==================== PROGRAMMATIC FUNCTIONS ====================

/**
 * Track a transaction with support for source and destination chains
 * @param {string} apiKey - User's API key
 * @param {object} txData - Transaction data
 * @param {string} txData.recipientAddress - Address to monitor
 * @param {number} txData.amount - Expected amount (reference only)
 * @param {string} txData.blockchain - Source chain where fee is collected (webhook created here)
 * @param {string} txData.vm - Virtual machine type (EVM, TVM, SVM)
 * @param {string} txData.toChain - Destination chain (for reference only, stored in DB)
 */
async function trackTransaction(apiKey, txData) {
  try {
    await connectDB();
    
    const { recipientAddress, amount, blockchain, vm, toChain } = txData;
    
    if (!recipientAddress || !amount || !blockchain || !vm) {
      throw new Error('Missing required transaction data');
    }

    if (!CONFIG.CHAINS[blockchain]) {
      throw new Error(`Unsupported blockchain: ${blockchain}`);
    }
    
    const trackingId = crypto.randomBytes(16).toString('hex');
    
    const trackingRecord = {
      trackingId,
      recipientAddress,
      amount,
      blockchain, // Source chain where fee is collected
      toChain: toChain || blockchain, // Destination chain (for reference only)
      vm,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000) // 1 hour expiry
    };

    // Store in user's document under the correct integration
    const result = await UserModel.updateOne(
      { 'integrations.apiKey': apiKey, 'integrations.isActive': true },
      { $push: { 'integrations.$.pendingTrackings': trackingRecord } }
    );

    if (result.modifiedCount === 0) {
      throw new Error('Invalid API key or inactive integration');
    }

    // Store in memory caches for quick lookup
    pendingTrackings.set(trackingId, { apiKey, data: trackingRecord });
    
    const addressKey = recipientAddress.toLowerCase();
    if (!addressToTrackings.has(addressKey)) {
      addressToTrackings.set(addressKey, []);
    }
    addressToTrackings.get(addressKey).push(trackingId);

    // Set up webhook on the SOURCE chain (where fee is collected)
    if (CONFIG.CHAINS[blockchain]) {
      if (CONFIG.CHAINS[blockchain].webhookProvider === 'tatum') {
        createTatumWebhook(recipientAddress).catch(console.error);
      } else if (CONFIG.CHAINS[blockchain].webhookProvider === 'alchemy') {
        createAlchemyWebhook(blockchain, recipientAddress).catch(console.error);
      }
    }

    console.log(`📝 Tracked transaction ${trackingId} for ${recipientAddress}`);
    console.log(`   Fee Collection Chain: ${blockchain} (webhook created here)`);
    console.log(`   Destination Chain (reference): ${trackingRecord.toChain}`);
    console.log(`   Expected amount: ${amount} (for reference only)`);

    return trackingId;

  } catch (error) {
    console.error(`❌ Error in trackTransaction:`, error);
    throw error;
  }
}

async function getUserPendingTransactions(apiKey) {
  await connectDB();
  
  const user = await UserModel.findOne(
    { 'integrations.apiKey': apiKey },
    { 'integrations.$': 1 }
  ).lean();

  if (!user || !user.integrations || !user.integrations[0]) {
    return [];
  }

  // Add chain info to pending transactions
  return (user.integrations[0].pendingTrackings || []).map(t => ({
    ...t,
    feeChain: t.blockchain, // Chain where fee will be collected
    destinationChain: t.toChain // Chain where funds will go (reference only)
  }));
}

async function getUserCompletedTransactions(apiKey) {
  await connectDB();
  
  const user = await UserModel.findOne(
    { 'integrations.apiKey': apiKey },
    { 'integrations.$': 1 }
  ).lean();

  if (!user || !user.integrations || !user.integrations[0]) {
    return [];
  }

  return user.integrations[0].txHashes || [];
}

// ==================== WEBHOOK HANDLERS ====================

/**
 * Safely parse amount from webhook
 * NEVER uses BigInt on decimal strings
 */
function parseAmount(rawAmount, decimals) {
  // Convert to string first (it might be a number)
  const amountStr = String(rawAmount);
  
  // If it's already a decimal string, just parse it directly
  if (amountStr.includes('.')) {
    const amount = parseFloat(amountStr);
    console.log(`   📊 Decimal amount detected: ${amountStr} -> ${amount}`);
    return amount;
  }
  
  // If it's an integer string, try to convert from smallest unit
  try {
    // Check if it's a valid integer string
    if (/^\d+$/.test(amountStr)) {
      const rawAmountBigInt = BigInt(amountStr);
      const amount = Number(rawAmountBigInt) / Math.pow(10, decimals);
      console.log(`   📊 Integer amount detected: ${amountStr} -> ${amount} (${decimals} decimals)`);
      return amount;
    }
  } catch (e) {
    // Ignore BigInt errors
  }
  
  // Final fallback
  console.log(`   ⚠️ Using parseFloat fallback: ${amountStr}`);
  return parseFloat(amountStr);
}

async function handleAlchemyWebhook(req, res) {
  try {
    console.log('📨 Received Alchemy webhook');
    
    const isValid = await verifyAlchemyWebhook(req);
    if (!isValid) {
      console.log('❌ Invalid Alchemy webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const payload = req.body;
    
    let activities = [];
    
    if (payload.event?.activity) {
      activities = payload.event.activity;
    } else if (payload.activity) {
      activities = payload.activity;
    } else if (payload.params?.result) {
      activities = [payload.params.result];
    } else if (payload.transactions) {
      activities = payload.transactions;
    }
    
    if (!activities.length) {
      console.log('ℹ️ No activities in webhook');
      return res.status(200).json({ received: true });
    }

    console.log(`📨 Processing ${activities.length} activities`);

    for (const tx of activities) {
      try {
        if (processedHashes.has(tx.hash)) {
          console.log(`⏭️ Skipping duplicate: ${tx.hash}`);
          continue;
        }

        const chain = tx.network?.toLowerCase() || 
                     tx.chain?.toLowerCase() || 
                     'arbitrum';
                     
        const toAddress = tx.toAddress || tx.to;
        const fromAddress = tx.fromAddress || tx.from;
        const hash = tx.hash || tx.transactionHash;
        const rawAmount = tx.value || tx.amount || '0';
        const tokenAddress = tx.rawContract?.address || tx.contractAddress;
        const tokenSymbol = tx.asset || tx.symbol || tx.tokenSymbol;
        
        if (!toAddress || !hash) {
          console.log('⚠️ Missing required fields in transaction:', tx);
          continue;
        }

        // Find token in our list
        const tokenInfo = findToken(chain, tokenAddress, tokenSymbol);
        const decimals = tokenInfo?.decimals || CONFIG.CHAINS[chain]?.decimals || 18;
        
        if (tokenInfo) {
          console.log(`   ✅ Found token: ${tokenInfo.symbol} (${tokenInfo.name}) with ${decimals} decimals`);
        } else {
          console.log(`   ⚠️ Token not found, using ${decimals} decimals`);
        }
        
        // Parse amount using the safe function
        const amount = parseAmount(rawAmount, decimals);
        
        // Format amount for display
        let displayAmount;
        if (amount < 0.000001) {
          displayAmount = amount.toExponential(6);
        } else if (amount < 1) {
          displayAmount = amount.toFixed(6);
        } else if (amount < 1000) {
          displayAmount = amount.toFixed(4);
        } else {
          displayAmount = amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
        }

        const transaction = {
          hash: hash,
          fromAddress: fromAddress,
          toAddress: toAddress,
          amount: amount,
          displayAmount: displayAmount,
          currency: tokenInfo?.symbol || tokenSymbol || CONFIG.CHAINS[chain]?.nativeToken || 'ETH',
          tokenAddress: tokenAddress,
          decimals: decimals,
          rawAmount: rawAmount,
          blockNumber: tx.blockNum ? parseInt(tx.blockNum, 16) : null,
          chain: chain // This is the chain where fee was collected
        };

        console.log(`   Processing: ${transaction.hash} -> ${displayAmount} ${transaction.currency} on ${chain}`);

        // Find matching pending tracking by address AND source chain
        const match = await findMatchingTracking(transaction);
        
        if (match) {
          await processTransaction(
            transaction,
            match.apiKey,
            match.trackingId
          );
          console.log(`✅ Transaction processed and stored in database`);
        } else {
          console.log(`ℹ️ No pending tracking for address ${transaction.toAddress} on chain ${chain}`);
        }

      } catch (err) {
        console.error(`❌ Error processing activity:`, err.message);
      }
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error(`❌ Alchemy webhook error:`, error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleTatumWebhook(req, res) {
  try {
    if (!verifyTatumWebhook(req)) {
      console.log('❌ Invalid Tatum webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const webhookData = req.body;
    
    if (webhookData.type === 'ADDRESS_EVENT' && webhookData.data) {
      const tx = webhookData.data;
      
      if (processedHashes.has(tx.txId)) {
        console.log(`⏭️ Skipping duplicate Tron tx: ${tx.txId}`);
        return res.status(200).json({ received: true });
      }

      const tokenInfo = findToken('tron', null, 'TRX');
      const decimals = tokenInfo?.decimals || 6;
      
      const rawAmount = tx.amount || '0';
      
      // Parse amount using the safe function
      const amount = parseAmount(rawAmount, decimals);
      
      let displayAmount;
      if (amount < 0.000001) {
        displayAmount = amount.toExponential(6);
      } else if (amount < 1) {
        displayAmount = amount.toFixed(6);
      } else {
        displayAmount = amount.toFixed(4);
      }

      const transaction = {
        hash: tx.txId,
        fromAddress: tx.from,
        toAddress: tx.to,
        amount: amount,
        displayAmount: displayAmount,
        currency: 'TRX',
        blockNumber: tx.blockNumber,
        chain: 'tron',
        decimals: decimals,
        rawAmount: rawAmount
      };

      console.log(`📨 Processing Tron tx: ${transaction.hash} -> ${displayAmount} TRX`);

      const match = await findMatchingTracking(transaction);
      
      if (match) {
        await processTransaction(
          transaction,
          match.apiKey,
          match.trackingId
        );
      }
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error(`❌ Tatum webhook error:`, error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// ==================== API ENDPOINTS ====================

/**
 * Register a new transaction for monitoring
 * POST /api/register-transaction
 * Body: {
 *   apiKey: string,
 *   recipientAddress: string,
 *   amount: number,
 *   blockchain: string, // Source chain where fee is collected
 *   vm: string,
 *   toChain?: string // Destination chain (for reference only, stored in DB)
 * }
 */
async function registerTransaction(req, res) {
  try {
    if (!verifyServer1Request(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { apiKey, recipientAddress, amount, blockchain, vm, toChain } = req.body;

    if (!apiKey || !recipientAddress || !amount || !blockchain || !vm) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['apiKey', 'recipientAddress', 'amount', 'blockchain', 'vm']
      });
    }

    const trackingId = await trackTransaction(apiKey, {
      recipientAddress,
      amount,
      blockchain,
      vm,
      toChain
    });

    res.status(200).json({ 
      success: true, 
      trackingId,
      message: 'Transaction registered for monitoring'
    });

  } catch (error) {
    console.error(`❌ Error registering transaction:`, error);
    
    if (error.message.includes('Invalid API key')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: 'Failed to register transaction',
      details: error.message 
    });
  }
}

async function getUserTransactions(req, res) {
  try {
    const { apiKey } = req.params;
    
    await connectDB();

    const user = await UserModel.findOne(
      { 'integrations.apiKey': apiKey },
      { 'integrations.$': 1 }
    ).lean();

    if (!user || !user.integrations || !user.integrations[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const integration = user.integrations[0];
    
    const pending = (integration.pendingTrackings || []).map(t => ({
      trackingId: t.trackingId,
      recipientAddress: t.recipientAddress,
      expectedAmount: t.amount,
      feeChain: t.blockchain, // Chain where fee will be collected
      destinationChain: t.toChain, // Chain where funds will go (reference)
      vm: t.vm,
      status: t.status,
      createdAt: t.createdAt,
      expiresAt: t.expiresAt,
      timeRemaining: Math.max(0, new Date(t.expiresAt) - Date.now())
    }));

    const completed = (integration.txHashes || []).map(t => ({
      hash: t.hash,
      amount: t.displayAmount || t.amount,
      rawAmount: t.amount,
      currency: t.currency,
      fromAddress: t.fromAddress,
      toAddress: t.toAddress,
      feeChain: t.fromChain || t.chain, // Chain where fee was collected
      destinationChain: t.toChain, // Chain where funds will go (reference)
      explorerUrl: t.explorerUrl,
      createdAt: t.createdAt,
      tokenAddress: t.tokenAddress
    }));

    res.status(200).json({
      success: true,
      pending,
      completed
    });

  } catch (error) {
    console.error(`❌ Error fetching transactions:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function healthCheck(req, res) {
  try {
    await connectDB();
    
    const pendingCount = await UserModel.aggregate([
      { $unwind: '$integrations' },
      { $unwind: '$integrations.pendingTrackings' },
      { $match: { 'integrations.pendingTrackings.status': 'pending' } },
      { $count: 'total' }
    ]);

    const completedCount = await UserModel.aggregate([
      { $unwind: '$integrations' },
      { $unwind: '$integrations.txHashes' },
      { $count: 'total' }
    ]);

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      stats: {
        processedHashes: processedHashes.size,
        activeTrackings: pendingTrackings.size,
        addressesMonitored: addressToTrackings.size,
        webhooksConfigured: webhookMapping.size,
        pendingTransactions: pendingCount[0]?.total || 0,
        completedTransactions: completedCount[0]?.total || 0
      }
    });

  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: error.message 
    });
  }
}

// ==================== EXPORTS ====================

module.exports = {
  initialize: async () => {
    await connectDB();
    await enableTatumHmac();
    // Log ALCHEMY_AUTH_TOKEN for debugging (mask all but last 4 chars)
    const token = CONFIG.ALCHEMY_AUTH_TOKEN;
    if (token) {
      const masked = token.length > 8 ? token.slice(0, 4) + '...' + token.slice(-4) : token;
      console.log(`🔑 ALCHEMY_AUTH_TOKEN loaded: ${masked}`);
    } else {
      console.warn('⚠️  ALCHEMY_AUTH_TOKEN is NOT set!');
    }
    console.log(`🚀 Server 2 monitor initialized`);
    console.log(`📊 Token list loaded with ${TOKENS.length} tokens`);
    console.log(`📊 Memory caches ready`);
    console.log(`📊 Monitoring fee collection on source chains, storing destination chains as reference`);
  },
  
  trackTransaction,
  getUserPendingTransactions,
  getUserCompletedTransactions,
  
  registerTransaction,
  alchemyWebhook: handleAlchemyWebhook,
  tatumWebhook: handleTatumWebhook,
  getUserTransactions,
  healthCheck,
  
  CONFIG
};