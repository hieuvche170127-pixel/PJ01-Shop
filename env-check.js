// Script to check environment variables for payment integrations
require('dotenv').config();
console.log('Checking environment variables for payment integrations...');

const envVars = {
  // VietQR variables
  BANK_ACCOUNT_NO: process.env.BANK_ACCOUNT_NO,
  BANK_ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME,
  BANK_ACQ_ID: process.env.BANK_ACQ_ID,
  VIETQR_CLIENT_ID: process.env.VIETQR_CLIENT_ID,
  VIETQR_API_KEY: process.env.VIETQR_API_KEY,
  
  // PayOS variables
  PAYOS_CLIENT_ID: process.env.PAYOS_CLIENT_ID,
  PAYOS_API_KEY: process.env.PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY: process.env.PAYOS_CHECKSUM_KEY
};

let allVarsPresent = true;

console.log('\n--- PAYMENT ENVIRONMENT VARIABLES ---');
for (const [key, value] of Object.entries(envVars)) {
  const status = value ? '✅ Set' : '❌ MISSING';
  console.log(`${key}: ${status}`);
  if (!value) allVarsPresent = false;
}

if (allVarsPresent) {
  console.log('\n✅ All payment environment variables are set!');
} else {
  console.log('\n❌ Some payment environment variables are missing!');
  console.log('Please check your .env file and add the missing variables.');
} 