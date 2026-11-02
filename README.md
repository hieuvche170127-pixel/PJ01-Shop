# Shopii — Project SDN302

Website thương mại điện tử với ba vai trò **Buyer, Seller và Admin**, xây dựng bằng React, Express, MongoDB và Socket.IO. Project dùng **COD mô phỏng** để demo cuối môn; không cần tài khoản ngân hàng, VietQR hoặc PayOS.

## Thành viên

| Thành viên | Phần phụ trách |
| --- | --- |
| Hoàng Quân | Backend nền tảng, database, tích hợp và sửa lỗi toàn project |
| Minh Phú | Tài khoản, catalog, tìm kiếm/lọc/phân trang |
| Công Hiếu | Giỏ hàng, địa chỉ, voucher, checkout và lịch sử đơn |
| Mạnh Hùng | Seller: sản phẩm, ảnh, tồn kho, giao hàng và thu COD |
| Gia Anh | Admin, chat, báo cáo và xuất CSV |

Tài liệu phân công và review được chia sẻ riêng trong nhóm.

## Chức năng

- **Buyer:** tìm/lọc/sắp xếp sản phẩm, giỏ hàng, địa chỉ, voucher, đặt COD, theo dõi/hủy đơn hợp lệ, đánh giá, yêu cầu trả hàng và tranh chấp.
- **Seller:** quản lý sản phẩm/ảnh/tồn kho, xử lý phần hàng của shop, giao hàng, xác nhận thu COD, báo cáo và tải CSV.
- **Admin:** quản lý user, duyệt shop, quản lý sản phẩm/voucher và báo cáo toàn hệ thống.
- **Chat:** trao đổi buyer–seller thời gian thực, ảnh đính kèm, trạng thái đã đọc.
- **Tài khoản:** JWT, phân quyền và kiểm tra chủ sở hữu ở backend, hồ sơ, đổi/quên mật khẩu.
- **Catalog demo:** 20 sản phẩm, 5 danh mục, 2 shop và ảnh có sẵn. Giá tham khảo ngày 01/11/2026; xem [nguồn sản phẩm](PRODUCT_SOURCES.md).

## Công nghệ và cấu trúc

React 18, Redux Toolkit, React Router, MUI/Ant Design; Node.js, Express, Mongoose; MongoDB; Socket.IO; Cloudinary; Nodemailer.

```text
PJ01-Shop/
├── server.js              # Khởi chạy backend
├── src/                   # Routers, middleware, controllers, services, models
│   └── scripts/seedDemo.js # Tạo database demo mới
├── front-end/             # Ứng dụng React và ảnh catalog
├── tests/                 # Kiểm thử nghiệp vụ và phân quyền
├── postman/               # Collection và environment mẫu
├── product-sources.json   # Catalog để seed
└── .env.example           # Cấu hình mẫu không chứa khóa thật
```

Backend chính nằm ở **gốc repository**. Không cần thư mục `back-end/` hoặc import dump database cũ.

## Cài và chạy lần đầu

Yêu cầu **Node.js/npm** và **MongoDB local** chạy tại `127.0.0.1:27017`. Bản demo được kiểm tra với Node.js **24.18**. Giữ lockfile để cài đúng dependencies.

### 1. Clone và cài dependencies

```powershell
git clone https://github.com/hieuvche170127-pixel/PJ01-Shop.git
cd PJ01-Shop
npm ci
cd front-end
npm ci
cd ..
```

### 2. Tạo cấu hình backend

Chỉ tạo `.env` khi chưa có, không ghi đè cấu hình máy đang dùng:

```powershell
Copy-Item .env.example .env
```

Mở `.env`, đặt database demo và JWT secret ngẫu nhiên riêng:

```dotenv
PORT=9999
MONGO_URI=mongodb://127.0.0.1:27017/shopii_demo
JWT_SECRET=thay_bang_chuoi_ngau_nhien_rieng
CLIENT_URL=http://localhost:3000
```

Tạo giá trị ngẫu nhiên rồi dán vào `JWT_SECRET`:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Email/Cloudinary có thể để trống khi chỉ review catalog/COD. Không commit `.env` hoặc khóa thật.

### 3. Tạo dữ liệu và tài khoản

```powershell
npm run seed:demo
```

Script tạo database **`shopii_demo`**, 20 sản phẩm, 5 danh mục, 2 shop đã duyệt, tồn kho, địa chỉ giả lập và 4 tài khoản:

| Vai trò | Email đăng nhập |
| --- | --- |
| Buyer | buyer_demo@example.test |
| Seller 1 | seller_demo@example.test |
| Seller 2 | seller_demo_2@example.test |
| Admin | admin_demo@example.test |

**Mật khẩu nằm trong `demo/accounts.local.json`**, được tạo ngẫu nhiên khi seed. File chỉ lưu trên máy và được Git bỏ qua. Đăng nhập bằng email.

Seed chỉ chạy trên database local **chưa có collection** và không ghi đè dữ liệu. Những lần chạy web sau không cần seed lại. Nếu database/file tài khoản đã tồn tại, dùng bộ demo hiện có hoặc đặt `DEMO_MONGO_URI` với tên mới dạng `shopii_demo_<ten>` và `DEMO_ACCOUNTS_FILE` trỏ tới file mới tên `accounts.local.json`; cập nhật `MONGO_URI` tương ứng.

### 4. Chạy hai terminal

Terminal 1 tại gốc project:

```powershell
npm start
```

Terminal 2:

```powershell
cd front-end
npm start
```

- Web: [localhost:3000](http://localhost:3000)
- API: `http://localhost:9999/api` — ví dụ [danh sách sản phẩm](http://localhost:9999/api/products).
- Seller: [quản lý sản phẩm](http://localhost:3000/manage-product)
- Admin: [dashboard](http://localhost:3000/admin)

Nếu đổi cổng backend, đặt `REACT_APP_API_URL=http://localhost:CONG_MOI` trong `front-end/.env` rồi restart frontend. Nếu đổi frontend origin, cập nhật `CLIENT_URL` ở backend.

## Email và ảnh

| Biến backend | Nội dung |
| --- | --- |
| `EMAIL_USER` | Gmail gửi thông báo/khôi phục mật khẩu |
| `EMAIL_PASS` | App Password tạo từ chính Gmail trên |
| `CLOUDINARY_URL` | `cloudinary://API_KEY:API_SECRET@CLOUD_NAME` |
| `CLIENT_URL` | Origin frontend để tạo liên kết khôi phục mật khẩu |

- Restart backend sau khi sửa cấu hình.
- Ảnh catalog có sẵn; upload **ảnh mới** trong seller/chat cần Cloudinary hợp lệ. JPEG/PNG/GIF/WebP, tối đa 5 MB/file.
- Email `@example.test` không nhận thư thật. Review quên mật khẩu bằng tài khoản thử có hộp thư truy cập được. Liên kết reset dùng một lần, hiệu lực 15 phút.
- Gmail App Password không phải mật khẩu đăng nhập website.

## Review và demo nhanh

1. Buyer tìm sản phẩm còn kho rồi thêm giỏ.
2. Admin tạo voucher hợp lệ nếu muốn demo giảm giá; buyer chọn địa chỉ và đặt COD.
3. Seller mở đúng đơn, chuyển **pending → shipping → shipped**, sau đó xác nhận thu COD.
4. Buyer tải lại lịch sử; seller/admin đối chiếu tiền đã thu sau giảm giá.
5. Dùng hai hồ sơ trình duyệt để demo chat buyer–seller và ảnh.
6. Tạo đơn phụ để thử hủy lúc pending và kiểm tra hoàn kho; thử hai shop để review phân quyền và tiền từng shop.

Đơn hàng/tồn kho là mô phỏng. **Đã giao** và **đã thu tiền** là hai bước riêng. Một shop chưa thu thì toàn đơn nhiều shop chưa được coi là đã thanh toán xong.

## Kiểm thử và build

Bật MongoDB, cài dependencies backend/frontend rồi chạy:

```powershell
npm test
cd front-end
npm run build
```

Bộ backend có **71 kiểm thử** cho nghiệp vụ, quyền truy cập, tồn kho, COD, chat, upload, reset mật khẩu và seed. Tests dùng database riêng tên ngẫu nhiên, chỉ dọn dữ liệu test, giả lập email/Cloudinary. Frontend build vào `front-end/build/`; hiện còn cảnh báo lint và dung lượng bundle.

Collection và environment mẫu ở `postman/`. Điền tài khoản demo trên máy, chạy Authentication trước; request tạo/sửa dữ liệu dùng bộ demo.

## Lỗi thường gặp

- **Không có sản phẩm:** kiểm tra MongoDB/backend, kết quả seed và `MONGO_URI` có trỏ đúng database đã seed không.
- **Không đăng nhập được:** lấy mật khẩu từ file tài khoản trên máy; mỗi lần seed bộ mới có mật khẩu khác.
- **Sai quyền:** kiểm tra role, đăng xuất trước khi đổi tài khoản trong cùng hồ sơ trình duyệt.
- **Upload lỗi:** kiểm tra Cloudinary, loại/kích thước ảnh và restart backend sau khi thay khóa.
- **Không nhận email:** kiểm tra Gmail/App Password cùng tài khoản và hộp thư nhận có thật.
- **Cổng đã dùng:** kiểm tra terminal chạy project trước đó, tránh chạy nhiều bản trên cùng cổng.

Dùng seed để chia sẻ dữ liệu demo. Không cần đưa dump người dùng/đơn hàng cũ, `node_modules`, build hoặc thông tin đăng nhập thật lên GitHub.
