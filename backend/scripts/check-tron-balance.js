#!/usr/bin/env node

/**
 * Check TRON wallet balances (TRX and USDT)
 * Reads wallet address from .env file
 */

require('dotenv').config({ path: '../.env' });
// const TronWeb = require('tronweb').default || require('tronweb');

const { TronWeb } = require('tronweb');




const WALLET_ADDRESS = process.env.TRON_WALLET_ADDRESS;
const TRON_API_URL = process.env.TRON_API_URL || 'https://nile.trongrid.io';
const USDT_CONTRACT = process.env.TRON_USDT_CONTRACT || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

if (!WALLET_ADDRESS) {
  console.error('❌ Error: TRON_WALLET_ADDRESS not found in .env file');
  console.log('\nPlease add your wallet address to .env:');
  console.log('TRON_WALLET_ADDRESS=your_wallet_address_here\n');
  process.exit(1);
}
console.log("tron wallet found", WALLET_ADDRESS)
// Initialize TronWeb

async function checkBalances() {

  console.log('\n🔐 Checking TRON wallet balance for testnet...\n');

  // Initialize TronWeb for Nile testnet
  const tronWeb = new TronWeb({
     fullHost: TRON_API_URL,
     privateKey: process.env.TRON_PRIVATE_KEY
  })


  console.log('\n🔍 Checking wallet balances...\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 WALLET BALANCES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`🏦 Wallet Address: ${WALLET_ADDRESS}`);
  console.log(`🌐 Network: ${TRON_API_URL}\n`);

  try {
    // Check TRX balance
    console.log('⏳ Fetching TRX balance...');
    const trxBalance = await tronWeb.trx.getBalance(WALLET_ADDRESS);
    const trxBalanceFormatted = (trxBalance / 1_000_000).toFixed(6);

    console.log(`💰 TRX Balance: ${trxBalanceFormatted} TRX`);

    if (trxBalance === 0) {
      console.log('   ⚠️  No TRX! You need TRX for gas fees.');
      console.log('   → Get testnet TRX from: https://nileex.io/\n');
    } else if (trxBalance < 10_000_000) { // Less than 10 TRX
      console.log('   ⚠️  Low TRX balance. Consider getting more for gas fees.\n');
    } else {
      console.log('   ✅ Sufficient TRX for transactions\n');
    }

    // Check USDT balance
    console.log('⏳ Fetching USDT balance...');
    try {
      const contract = await tronWeb.contract().at(USDT_CONTRACT);
      const usdtBalance = await contract.balanceOf(WALLET_ADDRESS).call();
      const usdtBalanceFormatted = (Number(usdtBalance) / 1_000_000).toFixed(6);

      console.log(`💵 USDT Balance: ${usdtBalanceFormatted} USDT`);

      if (Number(usdtBalance) === 0) {
        console.log('   ℹ️  No USDT yet. You can acquire testnet USDT from exchanges or faucets.\n');
      } else {
        console.log('   ✅ USDT available for transfers\n');
      }
    } catch (error) {
      console.log('   ⚠️  Could not fetch USDT balance');
      console.log(`   Error: ${error.message}\n`);
    }

    // Get account info
    console.log('⏳ Fetching account information...');
    const account = await tronWeb.trx.getAccount(WALLET_ADDRESS);

    if (account && account.create_time) {
      const createDate = new Date(account.create_time);
      console.log(`📅 Account Created: ${createDate.toLocaleString()}`);
    }

    if (account && account.bandwidth) {
      console.log(`📊 Bandwidth: ${account.bandwidth.freeNetUsed || 0} / ${account.bandwidth.freeNetLimit || 0} used`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('\n❌ Error fetching balances:');
    console.error(error.message);

    if (error.message.includes('Account not found')) {
      console.log('\n💡 This wallet has not been activated yet.');
      console.log('   To activate, you need to receive TRX from the faucet:');
      console.log('   → Visit: https://nileex.io/');
      console.log(`   → Enter address: ${WALLET_ADDRESS}\n`);
    }
  }
}

// Run the balance check
checkBalances().catch(console.error);
