// Fresh demo database only. Never imports the old db/ dumps or edits an existing database.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const root = path.resolve(__dirname, '../..');
async function seedDemo({ uri, accountFile }) {
  const url = new URL(uri);
  if (url.protocol !== 'mongodb:' || !['localhost','127.0.0.1'].includes(url.hostname) || !/^\/shopii_demo(?:_[a-zA-Z0-9_]+)?$/.test(url.pathname)) throw Error('Use a local, dedicated database named shopii_demo or shopii_demo_<name>');
  if (fs.existsSync(accountFile)) throw Error('Account output file already exists; choose a new output path');
  const catalog = JSON.parse(fs.readFileSync(path.join(root,'product-sources.json'),'utf8'));
  for (const item of catalog) {
    const asset = path.resolve(root, 'front-end/public', '.' + item.localImage);
    if (!asset.startsWith(path.join(root,'front-end','public','demo-assets') + path.sep) || !fs.existsSync(asset)) throw Error('Catalog image missing');
    if (crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex') !== item.sha256) throw Error('Catalog image checksum differs');
  }
  try {
    await mongoose.connect(uri, { autoIndex: false, serverSelectionTimeoutMS: 5000 });
    if ((await mongoose.connection.db.listCollections({}, { nameOnly:true }).toArray()).length) throw Error('Target database must be empty; no existing data will be overwritten');
    // An explicit lock also prevents two seed processes from filling the same new DB.
    await mongoose.connection.db.collection('demo_seed_lock').insertOne({ _id:'seed', startedAt:new Date() });
    const { User, Store, Category, Product, Inventory, Address } = require('../models');
    const accounts = [], users = {};
    for (const [name,role] of [['admin_demo','admin'],['buyer_demo','buyer'],['seller_demo','seller'],['seller_demo_2','seller']]) {
      const password = 'Demo-' + crypto.randomBytes(12).toString('base64url');
      const email = name + '@example.test';
      users[name] = new User({ username:name, fullname:name, email, password, role });
      accounts.push({ username:name, email, password, role });
    }
    // Save local credentials before creating users, never log passwords.
    fs.mkdirSync(path.dirname(accountFile), { recursive:true });
    fs.writeFileSync(accountFile,JSON.stringify({ database:url.pathname.slice(1),accounts },null,2),{ flag:'wx' });
    for (const user of Object.values(users)) await user.save();
    for (const name of ['seller_demo','seller_demo_2']) await Store.create({ sellerId:users[name]._id, storeName:name === 'seller_demo' ? 'Shopii Demo Store' : 'Nova Demo Store', status:'approved' });
    const categories = new Map();
    for (const name of [...new Set(catalog.map(p=>p.category))]) categories.set(name, await Category.create({ name }));
    const sellerIds = [...new Set(catalog.map(p=>p.sellerId))];
    for (const item of catalog) {
      const owner = users[sellerIds.indexOf(item.sellerId) === 0 ? 'seller_demo' : 'seller_demo_2'];
      const product = await Product.create({ _id:item.id, title:item.title, description:'Sản phẩm demo. Giá tham khảo ngày 01/11/2026; xem PRODUCT_SOURCES.md.', categoryId:categories.get(item.category)._id, sellerId:owner._id, image:item.localImage, price:item.price, isAuction:true });
      await Inventory.create({ productId:product._id, quantity:item.quantity });
    }
    await Address.create({ userId:users.buyer_demo._id, fullName:'Buyer Demo', phone:'0000000000', street:'Địa chỉ demo', city:'Hồ Chí Minh', state:'Demo', country:'Việt Nam', isDefault:true });
    await mongoose.connection.db.collection('demo_seed_lock').updateOne({ _id:'seed' },{ $set:{ completedAt:new Date() } });
    return { products:catalog.length, categories:categories.size, accounts:accounts.length, accountFile };
  } finally { await mongoose.disconnect(); }
}
module.exports = { seedDemo };
if (require.main === module) {
  const uri = process.env.DEMO_MONGO_URI || 'mongodb://127.0.0.1:27017/shopii_demo';
  const accountFile = path.resolve(process.env.DEMO_ACCOUNTS_FILE || path.join(root,'demo','accounts.local.json'));
  if (path.basename(accountFile) !== 'accounts.local.json') throw Error('Credential filename must be accounts.local.json (gitignored)');
  seedDemo({uri,accountFile}).then(result=>console.log(JSON.stringify(result))).catch(error=>{ console.error(error.message);process.exitCode=1; });
}
