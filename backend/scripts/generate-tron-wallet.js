#!/usr/bin/env node

/**
 * Generate a new TRON wallet for testnet usage
 * This script creates a new wallet with private key, address, and mnemonic
 */

const { TronWeb } = require('tronweb');

(async () => {
  console.log('\n🔐 Generating new TRON wallet for testnet...\n');

  // Initialize TronWeb for Nile testnet
  const tronWeb = new TronWeb({
    fullHost: 'https://nile.trongrid.io',
  });

  // Generate a new account (await the Promise)
  const account = await tronWeb.createAccount();

  console.log('✅ Wallet generated successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 WALLET DETAILS (Nile Testnet)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('🏦 Wallet Address (Base58):');
  console.log(`   ${account.address.base58}\n`);

  console.log('🔑 Private Key:');
  console.log(`   ${account.privateKey}\n`);

  console.log('🔐 Hex Address:');
  console.log(`   ${account.address.hex}\n`);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('⚠️  SECURITY WARNING:');
  console.log('   • Save these credentials in a SECURE location');
  console.log('   • NEVER share your private key with anyone');
  console.log('   • NEVER commit the private key to version control');
  console.log('   • This is for TESTNET ONLY - do not use on mainnet\n');

  console.log('📝 NEXT STEPS:\n');
  console.log('1. Copy your wallet address and private key');
  console.log('2. Update your .env file with these values:');
  console.log(`   TRON_WALLET_ADDRESS=${account.address.base58}`);
  console.log(`   TRON_PRIVATE_KEY=${account.privateKey}\n`);
  console.log('3. Get testnet TRX from the faucet:');
  console.log('   → Visit: https://nileex.io/');
  console.log('   → Click "Request TRX" or similar');
  console.log(`   → Enter your wallet address: ${account.address.base58}\n`);
  console.log('4. Verify your balance after a few minutes\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
})();
