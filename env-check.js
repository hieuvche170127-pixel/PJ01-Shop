require('dotenv').config();
console.log('Shopii demo: COD only. No bank account, VietQR or PayOS keys required.');
let missing = false;
for (const name of ['MONGO_URI', 'JWT_SECRET']) {
  const present = Boolean(process.env[name]);
  console.log(name + ': ' + (present ? 'configured' : 'missing'));
  if (!present) missing = true;
}
console.log('Email: ' + (process.env.EMAIL_USER && process.env.EMAIL_PASS ? 'configured (not verified)' : 'optional, not configured'));
console.log('Cloudinary: ' + (process.env.CLOUDINARY_URL ? 'configured (not verified)' : 'optional; uploads need configuration'));
if (missing) process.exitCode = 1;
