const mongoose = require('mongoose');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Review = require('../models/Review');
const Inventory = require('../models/Inventory');
const { fail, requireId, respondError } = require('../utils/apiError');
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function positiveInt(value, fallback, max) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) > max) fail(400, 'Tham số phân trang không hợp lệ.');
  return Number(value);
}
async function publicProduct(productId) {
  requireId(productId);
  const product = await Product.findOne({ _id: productId, isAuction: true }).populate('categoryId','name').populate('sellerId','_id username fullname avatarURL action role');
  if (!product || !product.sellerId || product.sellerId.action === 'lock' || product.sellerId.role !== 'seller') fail(404,'Sản phẩm hiện không được bán.');
  const store = await Store.findOne({ sellerId: product.sellerId._id, status: 'approved' }).select('storeName description bannerImageURL sellerId status');
  if (!store) fail(404,'Sản phẩm hiện không được bán.');
  return { product, store };
}
async function listAllProducts(req,res) {
 try {
  const page = positiveInt(req.query.page,1,10000), limit = positiveInt(req.query.limit,20,100);
  const query = { isAuction: true };
  if (req.query.categories !== undefined) {
   if (typeof req.query.categories !== 'string') fail(400,'Danh mục không hợp lệ.');
   const ids = req.query.categories.split(','); if(ids.length>10) fail(400,'Tối đa 10 danh mục.'); ids.forEach(requireId);
   query.categoryId = { $in: ids.map(id=>new mongoose.Types.ObjectId(id)) };
  }
  if (req.query.q !== undefined) {
   if(typeof req.query.q!=='string'||req.query.q.length>100) fail(400,'Từ khóa tối đa 100 ký tự.');
   if(req.query.q.trim()) query.$or = ['title','description'].map(key=>({[key]:{$regex:escapeRegex(req.query.q.trim()),$options:'i'}}));
  }
  for (const key of ['minPrice','maxPrice']) if(req.query[key]!==undefined) {
   if(typeof req.query[key]!=='string'||!/^\d+$/.test(req.query[key])||!Number.isSafeInteger(Number(req.query[key]))) fail(400,'Giá lọc không hợp lệ.');
   query.price ||= {};query.price[key==='minPrice'?'$gte':'$lte']=Number(req.query[key]);
  }
  if(query.price?.$gte > query.price?.$lte) fail(400,'Khoảng giá không hợp lệ.');
  const sorts={default:{createdAt:-1,_id:-1},'price-asc':{price:1,_id:1},'price-desc':{price:-1,_id:1},'name-asc':{title:1,_id:1},'name-desc':{title:-1,_id:1}};
  const sort = req.query.sort ?? 'default'; if(typeof sort!=='string'||!Object.hasOwn(sorts,sort)) fail(400,'Kiểu sắp xếp không hợp lệ.');
  const pipeline=[{$match:query},
   {$lookup:{from:'users',localField:'sellerId',foreignField:'_id',as:'seller',pipeline:[{$match:{role:'seller',action:{$ne:'lock'}}},{$project:{_id:1,username:1,fullname:1,avatarURL:1}}]}},
   {$unwind:'$seller'},
   {$lookup:{from:'stores',localField:'sellerId',foreignField:'sellerId',as:'approvedStore',pipeline:[{$match:{status:'approved'}},{$limit:1},{$project:{_id:1}}]}},
   {$match:{'approvedStore.0':{$exists:true}}},
   {$facet:{data:[{$sort:sorts[sort]},{$skip:(page-1)*limit},{$limit:limit},{$set:{sellerId:'$seller'}},{$unset:['seller','approvedStore']}],count:[{$count:'total'}]}}];
  const [result]=await Product.aggregate(pipeline);
  const data=await Product.populate(result.data,{path:'categoryId',select:'name'});
  const ids=data.map(p=>p._id);
  const [ratings,stocks]=await Promise.all([
   Review.aggregate([{$match:{productId:{$in:ids},parentId:null}},{$group:{_id:'$productId',rating:{$avg:'$rating'},reviewCount:{$sum:1}}}]),
   Inventory.find({productId:{$in:ids}}).select('productId quantity').lean()
  ]);
  const ratingMap=new Map(ratings.map(r=>[String(r._id),r])),stockMap=new Map(stocks.map(s=>[String(s.productId),s.quantity]));
  const total=result.count[0]?.total||0;
  res.json({success:true,data:data.map(p=>({...p,rating:ratingMap.get(String(p._id))?.rating||0,reviewCount:ratingMap.get(String(p._id))?.reviewCount||0,quantity:stockMap.get(String(p._id))||0})),pagination:{page,limit,total,totalPages:Math.ceil(total/limit)}});
 }catch(e){respondError(res,e);}
}
async function getProductDetail(req,res) {
 try {
  const {product,store}=await publicProduct(req.params.productId);
  const inventory=await Inventory.findOne({productId:product._id}).select('quantity');
  const reviews=await Review.find({productId:product._id,parentId:null}).populate('reviewerId','username fullname avatarURL').sort({createdAt:-1});
  const replies=await Review.find({parentId:{$in:reviews.map(r=>r._id)}}).populate('reviewerId','username fullname avatarURL');
  const grouped=new Map();for(const r of replies){const key=String(r.parentId);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(r);}
  res.json({success:true,data:{product,store,inventory:inventory||{quantity:0},reviews:reviews.map(r=>({...r.toObject(),replies:grouped.get(String(r._id))||[]})),averageRating:reviews.length?reviews.reduce((s,r)=>s+(r.rating||0),0)/reviews.length:0,totalReviews:reviews.length}});
 }catch(e){respondError(res,e);}
}
module.exports={listAllProducts,getProductDetail,publicProduct};
