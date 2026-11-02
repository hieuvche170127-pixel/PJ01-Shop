const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const express = require('express');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const { io: client } = require('../front-end/node_modules/socket.io-client');
process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
const sent = []; let emailFails = false, cloudFails = false, cloudCalls = 0, deleted = [];
for (const name of ['../src/services/emailService', '../src/utils/email']) {
  const file = require.resolve(name);
  require.cache[file] = { id: file, filename: file, loaded: true, exports: { sendEmail: async (...args) => { if (emailFails) throw Error('Simulated delivery failure'); sent.push(args); } } };
}
const { cloudinary } = require('../src/config/cloudinary');
cloudinary.uploader.upload_stream = (options, callback) => ({ end() {
  cloudCalls++;
  if (cloudFails) return callback(Error('Simulated provider failure'));
  const id = 'test/' + crypto.randomUUID();
  callback(null, { public_id: id, secure_url: 'https://example.com/' + id + '.png' });
} });
cloudinary.uploader.destroy = async id => { deleted.push(id); if (cloudFails) throw Error('Simulated provider failure'); return { result: 'ok' }; };
const { User, Store, Product, Category, Inventory, Message, Conversation, Order, OrderItem, Payment, Address } = require('../src/models');
const Asset = require('../src/models/UploadedAsset');
const router = require('../src/routers');
const { initSocketServer } = require('../src/services/socketService');

test('Phase 4 catalog, chat, uploads, reset and reports', { timeout: 90000 }, async t => {
  const dbName = 'shopii_phase4_test_' + crypto.randomBytes(8).toString('hex');
  const uri = new URL(process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017');
  assert(['127.0.0.1','localhost'].includes(uri.hostname)); assert.equal(uri.protocol, 'mongodb:'); uri.pathname = '/' + dbName;
  let server, io; const sockets = [];
  try {
    await mongoose.connect(uri.toString(), { dbName, autoIndex: false, serverSelectionTimeoutMS: 5000 });
    await Conversation.collection.createIndex({ pairKey: 1 }, { unique: true, sparse: true });
    const app = express(); app.use(require('../src/config/corsPolicy').middleware); app.use(express.json()); app.use('/api', router);
    app.use((error, req, res, next) => res.status(error.status || 500).json({ message: 'Request denied' }));
    server = http.createServer(app); io = initSocketServer(server); app.set('io', io);
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    const base = 'http://127.0.0.1:' + server.address().port;
    const users = {};
    for (const [name, role] of [['buyer','buyer'],['outsider','buyer'],['seller','seller'],['second','seller'],['pending','seller'],['admin','admin']]) users[name] = await User.create({ username: 'p4_' + name, email: name + '@example.test', password: 'Initial-password-123', role });
    const token = user => jwt.sign({ id: String(user._id), role: user.role, ver: user.tokenVersion || 0 }, process.env.JWT_SECRET);
    async function call(route, { user = users.buyer, method = 'GET', body, raw, auth } = {}) {
      const response = await fetch(base + '/api' + route, { method, headers: { ...(raw ? {} : { 'Content-Type':'application/json' }), ...(user ? { Authorization: 'Bearer ' + (auth || token(user)) } : {}) }, body: raw || (body ? JSON.stringify(body) : undefined), signal: AbortSignal.timeout(10000) });
      return { status: response.status, body: await response.json() };
    }
    const category = await Category.create({ name: 'Phones' });
    for (const name of ['seller','second','pending']) await Store.create({ sellerId: users[name]._id, storeName: name, status: name === 'pending' ? 'pending' : 'approved' });
    const make = async (title, seller = users.seller, price = 100000) => {
      const product = await Product.create({ sellerId: seller._id, categoryId: category._id, title, description: 'Catalog fixture', price, isAuction: true });
      await Inventory.create({ productId: product._id, quantity: 5 }); return product;
    };
    const p = await make('Phone Alpha'), p2 = await make('Phone Beta', users.second, 200000), hidden = await make('Pending Phone',users.pending);
    await t.test('catalog filters approved shops before pagination and exposes public details', async () => {
      const r = await call('/products?limit=1&sort=price-asc', { user: null });
      assert.equal(r.status,200,JSON.stringify(r.body)); assert.equal(r.body.pagination.total,2); assert.equal(r.body.data.length,1); assert.equal(r.body.data[0]._id,String(p._id));
      assert.equal((await call('/products?page=2&limit=1&sort=price-asc')).body.data[0]._id,String(p2._id));
      assert.equal((await call('/products/'+p._id+'/detail',{user:null})).status,200);
      assert.equal((await call('/products/'+hidden._id+'/detail',{user:null})).status,404);
      assert.equal((await call('/products/'+hidden._id+'/reviews')).status,404);
      assert.equal((await call('/products?q=Beta')).body.pagination.total,1);
      assert.equal((await call('/products?q=%5B')).body.pagination.total,0);
      assert.equal((await call('/products?minPrice=150000')).body.data[0]._id,String(p2._id));
    });
    await t.test('catalog rejects malformed IDs, pagination and filters', async () => {
      for (const query of ['page=0','limit=101','page=abc','sort=__proto__','categories=nope','q[x]=x','minPrice=abc','minPrice=5&maxPrice=1']) assert.equal((await call('/products?'+query)).status,400,query);
      assert.equal((await call('/products/bad/detail')).status,400);
    });
    await t.test('locked seller and inactive products disappear from listing and detail',async()=>{
      await User.updateOne({_id:users.second._id},{action:'lock'});
      assert.equal((await call('/products')).body.pagination.total,1); assert.equal((await call('/products/'+p2._id+'/detail')).status,404);
      await User.updateOne({_id:users.second._id},{action:'unlock'});
      await Product.updateOne({_id:p2._id},{isAuction:false}); assert.equal((await call('/products/'+p2._id+'/detail')).status,404); await Product.updateOne({_id:p2._id},{isAuction:true});
    });
    await t.test('seller cannot mass-assign ownership, price operators or partially update stock', async()=>{
      const route='/seller/products/'+p._id, before=await Product.findById(p._id).lean();
      for(const body of [{sellerId:String(users.second._id)},{'$set':{price:1}},{price:-1},{price:1.5},{price:'100'},{categoryId:String(new mongoose.Types.ObjectId())},{image:'blob:temporary'},{isAuction:'true'}]) assert.equal((await call(route,{method:'PUT',user:users.seller,body})).status,400,JSON.stringify(body));
      assert.equal((await call(route,{method:'PUT',user:users.seller,body:{title:'Changed',quantity:9}})).status,409);
      assert.equal((await Product.findById(p._id)).title,before.title); assert.equal((await Inventory.findOne({productId:p._id})).quantity,5);
      assert.equal((await call(route,{method:'PUT',user:users.second,body:{title:'Hijack'}})).status,404);
      assert.equal((await call(route,{method:'PUT',user:users.seller,body:{description:'Updated description'}})).status,200);
    });
    await t.test('approved shop required for product creation and inventory; GET never creates missing inventory',async()=>{
      const body={title:'New',description:'New description',price:100,categoryId:String(category._id),quantity:2};
      assert.equal((await call('/seller/products',{method:'POST',user:users.pending,body})).status,403);
      assert.equal((await call('/seller/inventory/'+hidden._id,{method:'PUT',user:users.pending,body:{quantity:2}})).status,403);
      const r=await call('/seller/products',{method:'POST',user:users.seller,body});assert.equal(r.status,201,JSON.stringify(r.body));
      const orphan=await make('Missing inventory');await Inventory.deleteOne({productId:orphan._id});
      assert.equal((await call('/seller/products',{user:users.seller})).status,200); assert.equal((await call('/seller/products/'+orphan._id,{user:users.seller})).status,200);
      assert.equal(await Inventory.countDocuments({productId:orphan._id}),0);
    });
    let conversation;
    await t.test('conversation GET is read-only, POST is idempotent under concurrency and has consistent participant shape',async()=>{
      const route='/chat/conversations/user/'+users.seller._id;
      assert.equal((await call(route)).status,404); assert.equal(await Conversation.countDocuments(),0);
      const results=await Promise.all([call(route,{method:'POST'}),call(route,{method:'POST'})]);
      for(const r of results){assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.conversation.participant._id,String(users.seller._id));}
      conversation=results[0].body.conversation._id; assert.equal(await Conversation.countDocuments(),1);
      assert.equal((await call('/chat/conversations/user/'+users.buyer._id,{method:'POST'})).status,400);
    });
    async function connect(user) {
      const socket=client(base,{auth:{token:token(user)},transports:['websocket'],reconnection:false});sockets.push(socket);
      await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});return socket;
    }
    const buyerSocket=await connect(users.buyer), sellerSocket=await connect(users.seller), outsideSocket=await connect(users.outsider);
    const emit=(socket,event,data)=>new Promise((resolve,reject)=>socket.timeout(3000).emit(event,data,(error,result)=>error?reject(error):resolve(result)));
    let message;
    await t.test('socket outsider cannot join/send/type/read, cannot spoof recipient or image URL',async()=>{
      assert.equal((await emit(outsideSocket,'joinConversation',conversation)).status,404);
      for(const event of ['sendMessage','typing','markAsRead']) assert.equal((await emit(outsideSocket,event,{conversationId:conversation,recipientId:String(users.seller._id),content:'intrusion',isTyping:true,messageIds:[]})).success,false,event);
      assert.equal(await Message.countDocuments(),0);
      assert.equal((await emit(buyerSocket,'sendMessage',{conversationId:conversation,recipientId:String(users.outsider._id),content:'spoof'})).status,400);
      assert.equal((await emit(buyerSocket,'sendMessage',{conversationId:conversation,image:{public_id:'arbitrary',url:'https://example.com'}})).status,400);
    });
    await t.test('legitimate message delivered only to participants, GET does not mark it read, receipt is scoped',async()=>{
      let outsideReceived=0;outsideSocket.on('newMessage',()=>outsideReceived++);
      const delivery=new Promise(resolve=>sellerSocket.once('newMessage',resolve));
      const r=await emit(buyerSocket,'sendMessage',{conversationId:conversation,content:'hello'});assert.equal(r.success,true,JSON.stringify(r));message=r.data;
      assert.equal((await delivery)._id,message._id);
      assert.equal((await call('/chat/conversations/'+conversation+'/messages',{user:users.seller})).status,200);
      assert.equal((await Message.findById(message._id)).read,false);assert.equal(outsideReceived,0);
      assert.equal((await call('/chat/conversations/'+conversation+'/messages',{user:users.outsider})).status,404);
      assert.equal((await emit(buyerSocket,'markAsRead',{conversationId:conversation,messageIds:[message._id]})).status,400);
      assert.equal((await emit(sellerSocket,'markAsRead',{conversationId:conversation,messageIds:[message._id]})).success,true);
      assert.equal((await Message.findById(message._id)).read,true);
      assert.equal((await call('/chat/conversations/'+conversation+'/messages?limit=999')).status,400);
    });
    const png=Buffer.from('89504e470d0a1a0a0000000d49484452','hex');
    const upload=(buffer=png,mime='image/png',user=users.buyer)=>{const form=new FormData();form.append('image',new Blob([buffer],{type:mime}),'image.png');return call('/images/upload',{method:'POST',user,raw:form});};
    let asset;
    await t.test('upload limits and content signatures reject before provider call',async()=>{
      const count=cloudCalls;
      assert.equal((await upload(Buffer.from('<svg>bad</svg>'),'image/svg+xml')).status,400);
      assert.equal((await upload(Buffer.from('this is not really a png'))).status,400);
      assert.equal((await upload(Buffer.alloc(5*1024*1024+1))).status,413);assert.equal(cloudCalls,count);
      assert.equal((await upload(png,'image/png',null)).status,401);
      const r=await upload();assert.equal(r.status,200,JSON.stringify(r.body));asset=r.body.data;
      assert.equal(String((await Asset.findOne({publicId:asset.public_id})).ownerId),String(users.buyer._id));
    });
    await t.test('image deletion requires ownership, protects referenced image and recovers provider failure',async()=>{
      const remove=user=>call('/images/delete',{method:'DELETE',user,body:{public_id:asset.public_id}});
      assert.equal((await remove(users.outsider)).status,404);assert.equal(deleted.length,0);
      await Product.updateOne({_id:p._id},{image:asset.secure_url});assert.equal((await remove(users.buyer)).status,409);assert.equal(deleted.length,0);
      await Product.updateOne({_id:p._id},{image:''});cloudFails=true;assert.equal((await remove(users.buyer)).status,500);cloudFails=false;
      assert.equal((await Asset.findOne({publicId:asset.public_id})).state,'active');
      assert.equal((await remove(users.buyer)).status,200);assert.equal(await Asset.countDocuments({publicId:asset.public_id}),0);
      assert.equal((await call('/images/delete',{method:'DELETE',body:{public_id:'legacy-untracked'}})).status,404);
    });
    await t.test('chat accepts owned upload and stores provider URL instead of client-supplied URL',async()=>{
      const owned=(await upload()).body.data;
      const r=await emit(buyerSocket,'sendMessage',{conversationId:conversation,image:{public_id:owned.public_id,url:'https://attacker.invalid'}});
      assert.equal(r.success,true);assert.equal(r.data.image.url,owned.secure_url);
      assert.equal((await emit(sellerSocket,'sendMessage',{conversationId:conversation,image:owned})).status,400);
    });
    await t.test('reset request never changes password, returns generic result, uses hashed expiring token',async()=>{
      const before=(await User.findById(users.buyer._id).select('+password')).password;
      const r=await call('/forgot-password',{method:'POST',user:null,body:{email:users.buyer.email}});
      const unknown=await call('/forgot-password',{method:'POST',user:null,body:{email:'absent@example.test'}});assert.deepEqual(r,unknown);
      const doc=await User.findById(users.buyer._id).select('+password +resetTokenHash +resetExpiresAt');
      assert.equal(doc.password,before);assert(doc.resetExpiresAt>Date.now());assert(!JSON.stringify(doc).includes(doc.resetTokenHash));
      assert.equal(sent.length,1);await call('/forgot-password',{method:'POST',body:{email:users.buyer.email}});assert.equal(sent.length,1);
    });
    await t.test('reset rejects expiry/replay, is single-use concurrently and revokes old JWT',async()=>{
      const resetToken=sent[0][2].match(/#token=([a-f0-9]+)/)[1],oldToken=token(users.buyer);
      const request=()=>call('/reset-password',{method:'POST',user:null,body:{token:resetToken,newPassword:'New-password-456'}});
      await User.updateOne({_id:users.buyer._id},{resetExpiresAt:new Date(0)});assert.equal((await request()).status,400);
      await User.updateOne({_id:users.buyer._id},{resetExpiresAt:new Date(Date.now()+60000)});
      const results=await Promise.all([request(),request()]);assert.deepEqual(results.map(r=>r.status).sort(),[200,400]);
      assert.equal((await request()).status,400);assert.equal((await call('/profile',{auth:oldToken})).status,401);
      const login=await call('/login',{method:'POST',user:null,body:{email:users.buyer.email,password:'New-password-456'}});assert.equal(login.status,200);assert.equal((await call('/profile',{auth:login.body.token})).status,200);
    });
    await t.test('SMTP failure retains old password and invalidates unsent reset link',async()=>{
      emailFails=true;const user=users.outsider,before=(await User.findById(user._id).select('+password')).password;
      assert.equal((await call('/forgot-password',{method:'POST',user:null,body:{email:user.email}})).status,200);emailFails=false;
      const doc=await User.findById(user._id).select('+password +resetTokenHash');assert.equal(doc.password,before);assert.equal(doc.resetTokenHash,undefined);
    });
    await t.test('sales reports allocate voucher across shops, count only collected amounts and never write history',async()=>{
      const address=await Address.create({userId:users.outsider._id,fullName:'Demo',phone:'0000000000',street:'Demo',city:'Demo',state:'Demo',country:'VN'});
      const order=await Order.create({buyerId:users.outsider._id,addressId:address._id,totalPrice:270000,originalTotalPrice:270000,status:'shipped'});
      await OrderItem.create([{orderId:order._id,productId:p._id,quantity:1,unitPrice:100000,status:'shipped',codCollected:true},{orderId:order._id,productId:p2._id,quantity:1,unitPrice:200000,status:'shipped'}]);
      await Payment.create({orderId:order._id,userId:users.outsider._id,amount:270000,method:'COD',status:'pending'});
      const before=JSON.stringify(await OrderItem.find({orderId:order._id}).lean());
      const a=await call('/seller/report',{user:users.seller}),b=await call('/seller/report',{user:users.second});
      assert.equal(a.status,200,JSON.stringify(a.body));assert.equal(a.body.data.totalRevenue,90000);assert.equal(a.body.data.totalDeliveredPayable,90000);
      assert.equal(b.body.data.totalRevenue,0);assert.equal(b.body.data.totalOutstanding,180000);assert.equal(b.body.data.productsShipped,1);
      const admin=await call('/admin/report',{user:users.admin});assert.equal(admin.status,200,JSON.stringify(admin.body));assert.equal(admin.body.summary.totalRevenue,90000);assert.equal(admin.body.topSellers[0].totalRevenue,90000);
      assert.equal(JSON.stringify(await OrderItem.find({orderId:order._id}).lean()),before);
      assert.equal((await call('/seller/report?from=2026-02-30',{user:users.seller})).status,400);
      assert.equal((await call('/seller/report?from=2026-12-01&to=2026-01-01',{user:users.seller})).status,400);
    });
    await t.test('CORS allows the configured browser and rejects other origins without weakening authentication', async()=>{
      const allowed=await fetch(base+'/api/products',{headers:{Origin:'http://localhost:3000'}});assert.equal(allowed.status,200);assert.equal(allowed.headers.get('access-control-allow-origin'),'http://localhost:3000');
      assert.equal((await fetch(base+'/api/products',{headers:{Origin:'https://other.invalid'}})).status,403);
      assert.equal((await fetch(base+'/api/profile',{headers:{Origin:'http://localhost:3000'}})).status,401);
    });
    await t.test('profile password change requires current password and revokes old sessions, including legacy tokenVersion',async()=>{
      const user=users.pending;
      const old=token(user),route='/buyers/profile',before=(await User.findById(user._id).select('+password')).password;
      assert.equal((await call(route,{method:'PUT',user,body:{password:'Replacement-123',fullname:'Must not change'}})).status,400);
      assert.equal((await User.findById(user._id).select('+password')).password,before);
      await User.updateOne({_id:user._id},{$unset:{tokenVersion:1}});
      const r=await call(route,{method:'PUT',user,body:{password:'Replacement-123',currentPassword:'Initial-password-123'}});assert.equal(r.status,200,JSON.stringify(r.body));
      assert.equal((await call('/profile',{user,auth:old})).status,401);assert.equal((await call('/profile',{user,auth:r.body.token})).status,200);
    });
    await t.test('seller CSV is scoped, uses attachment headers and escapes spreadsheet formulas',async()=>{
      const response=await fetch(base+'/api/seller/report/download.csv',{headers:{Authorization:'Bearer '+token(users.seller)}});
      assert.equal(response.status,200);assert.match(response.headers.get('content-disposition'),/attachment/);assert.match(response.headers.get('content-type'),/text\/csv/);
      const csv=await response.text();assert(csv.includes('90000'));assert(!csv.includes('270000'));
      assert.equal((await call('/seller/report/download.csv',{user:users.outsider})).status,403);
      const {cell}=require('../src/controllers/reportDownloadController');assert.equal(cell('=SUM(A1)'), '"\'=SUM(A1)"');assert.equal(cell('a"b'),'"a""b"');
    });
  } finally {
    sockets.forEach(socket=>socket.disconnect());
    if(io) await new Promise(resolve=>io.close(resolve));
    if(server?.listening) await new Promise(resolve=>server.close(resolve));
    if(mongoose.connection.readyState===1){ assert.equal(mongoose.connection.name,dbName); await mongoose.connection.dropDatabase(); }
    await mongoose.disconnect();
  }
});
