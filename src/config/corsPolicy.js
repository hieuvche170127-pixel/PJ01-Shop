const cors = require('cors');
const allowedOrigins = () => ['http://localhost:3000','http://localhost:3001','http://127.0.0.1:3000','http://127.0.0.1:3001',process.env.CLIENT_URL].filter(Boolean);
const isAllowed = origin => !origin || allowedOrigins().includes(origin);
module.exports = {
  isAllowed,
  middleware: cors({ credentials: true, origin: (origin, callback) => {
    if (isAllowed(origin)) return callback(null, true);
    callback(Object.assign(new Error('Origin is not allowed'), { status: 403 }));
  } })
};
