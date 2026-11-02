const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const mongoose = require('mongoose');
const { seedDemo } = require('../src/scripts/seedDemo');
test('portable demo seed refuses existing databases and creates isolated catalog without real accounts', { timeout:30000 },async()=>{
  const dbName='shopii_demo_test_'+crypto.randomBytes(8).toString('hex');
  const uri='mongodb://127.0.0.1:27017/'+dbName;
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'shopii-seed-'));
  const accountFile=path.join(directory,'accounts.local.json');
  try {
    await assert.rejects(seedDemo({uri:'mongodb://127.0.0.1:27017/shopii',accountFile}),/dedicated database/);
    const result=await seedDemo({uri,accountFile});assert.equal(result.products,20);assert.equal(result.categories,5);
    const accounts=JSON.parse(fs.readFileSync(accountFile,'utf8')).accounts;assert.equal(accounts.length,4);assert(accounts.every(a=>a.email.endsWith('@example.test')&&a.password.length>16));
    await assert.rejects(seedDemo({uri,accountFile:path.join(directory,'second.local.json')}),/must be empty/);
    await mongoose.connect(uri,{autoIndex:false});
    const {User,Product,Inventory,Store}=require('../src/models');
    assert.equal(await Product.countDocuments(),20);assert.equal(await Inventory.countDocuments(),20);assert.equal(await Store.countDocuments({status:'approved'}),2);
    const user=await User.findOne({email:accounts[0].email}).select('+password');assert(await user.comparePassword(accounts[0].password));
  } finally {
    if(mongoose.connection.readyState!==1)await mongoose.connect(uri,{autoIndex:false});
    assert.equal(mongoose.connection.name,dbName);await mongoose.connection.dropDatabase();await mongoose.disconnect();
    // Only files created in this unique test directory are removed.
    for(const name of ['accounts.local.json','second.local.json']){const file=path.join(directory,name);if(fs.existsSync(file))fs.unlinkSync(file);}fs.rmdirSync(directory);
  }
});
