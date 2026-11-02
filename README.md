# Shopii

Shopii là website thương mại điện tử sử dụng React, Node.js/Express và MongoDB. Hệ thống gồm ba vai trò: người mua (Buyer), người bán (Seller) và quản trị viên (Admin). Thanh toán trong bản này dùng COD mô phỏng.

## Cấu trúc project

```text
PJ01-Shop/
├── front-end/          # Giao diện React, quản lý trạng thái và gọi API
├── src/
│   ├── routers/        # Khai báo các endpoint API
│   ├── middleware/     # Xác thực, phân quyền và xử lý request
│   ├── controllers/    # Tiếp nhận request và trả response
│   ├── services/       # Xử lý nghiệp vụ, chat, email và báo cáo
│   ├── models/         # Schema MongoDB bằng Mongoose
│   ├── config/         # Cấu hình các thành phần backend
│   └── scripts/        # Tạo dữ liệu demo
├── tests/              # Kiểm thử backend
├── postman/            # Collection API và environment mẫu
├── server.js           # Khởi chạy Express, MongoDB và Socket.IO
├── product-sources.json # Dữ liệu catalog dùng khi seed
└── .env.example        # Mẫu cấu hình môi trường
```

## Cách hệ thống hoạt động

Giao diện React gửi request đến API Express. Backend kiểm tra JWT và quyền truy cập, xử lý nghiệp vụ rồi đọc/ghi MongoDB. Socket.IO phục vụ chat thời gian thực; Cloudinary lưu ảnh tải lên; Gmail SMTP gửi email khi được cấu hình.

- **Buyer:** xem/tìm sản phẩm, thêm giỏ hàng, chọn địa chỉ, áp voucher, đặt COD và theo dõi đơn.
- **Seller:** quản lý sản phẩm/tồn kho, xử lý phần hàng thuộc shop, cập nhật giao hàng và xác nhận thu COD.
- **Admin:** quản lý tài khoản, duyệt shop, quản lý sản phẩm/voucher và xem báo cáo.

Luồng đơn hàng: **đặt hàng → chờ xử lý → đang giao → đã giao → xác nhận thu COD**. Đã giao và đã thu tiền là hai trạng thái riêng. Buyer có thể hủy sản phẩm khi còn chờ xử lý; hệ thống hoàn lại tồn kho. Với đơn nhiều shop, mỗi seller chỉ xử lý phần của mình.

## Chạy trên máy local

Cần Node.js/npm và MongoDB đang chạy. Backend nằm ở gốc project, frontend nằm trong `front-end/`.

1. Cài dependencies ở cả hai thư mục:

   ```powershell
   npm ci
   cd front-end
   npm ci
   cd ..
   ```

2. Khi chưa có `.env`, sao chép `.env.example` thành `.env`. Điền `JWT_SECRET` ngẫu nhiên riêng và cấu hình `MONGO_URI`, `PORT`, `CLIENT_URL`. Với bộ demo mới, dùng `MONGO_URI=mongodb://127.0.0.1:27017/shopii_demo`.

3. Tạo dữ liệu lần đầu bằng `npm run seed:demo`. Script tạo database `shopii_demo` với 20 sản phẩm, 2 shop và tài khoản buyer/seller/admin. Email và mật khẩu được lưu trong `demo/accounts.local.json`. Script không ghi đè database đã có dữ liệu; không cần seed lại mỗi lần chạy.

4. Tại gốc project chạy `npm start` để bật backend. Mở terminal khác, vào `front-end` rồi chạy `npm start` để bật giao diện.

- Website: [http://localhost:3000](http://localhost:3000)
- API: `http://localhost:9999/api`
- Seller: `/manage-product`; Admin: `/admin` — yêu cầu đăng nhập đúng vai trò.

Ảnh catalog và COD có thể chạy mà không cần dịch vụ ngoài. Upload ảnh mới cần `CLOUDINARY_URL`; gửi email cần `EMAIL_USER` và `EMAIL_PASS` của cùng tài khoản Gmail. Khởi động lại backend sau khi đổi cấu hình. Không đưa `.env` hoặc file tài khoản lên Git.

## Lệnh kiểm tra

- `npm test` tại gốc project: chạy kiểm thử backend, cần MongoDB và dependencies của cả backend/frontend.
- `npm run build` trong `front-end/`: tạo bản giao diện production tại `front-end/build/`.
