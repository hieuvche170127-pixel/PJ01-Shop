# SHOPII — PHÂN CÔNG CÔNG VIỆC VÀ HƯỚNG DẪN REVIEW

## 1. Phân công thành viên

| Thành viên | Phần phụ trách | Nội dung phụ trách |
| --- | --- | --- |
| **Hoàng Quân** | Kiến trúc hệ thống, backend nền tảng, database và tích hợp | Cấu trúc React–Express–MongoDB, quan hệ dữ liệu, middleware xác thực/phân quyền, cách chạy project và kết nối các module |
| **Minh Phú** | Tài khoản và giao diện danh sách sản phẩm | Đăng nhập/đăng xuất, hồ sơ, tìm kiếm, lọc, sắp xếp, phân trang, chi tiết sản phẩm và điều hướng |
| **Công Hiếu** | Luồng mua hàng của buyer | Giỏ hàng, địa chỉ, voucher, checkout COD, lịch sử đơn và hủy đơn |
| **Mạnh Hùng** | Chức năng seller | Quản lý sản phẩm, ảnh, tồn kho, xử lý đơn hàng, giao hàng và xác nhận thu COD |
| **Gia Anh** | Chức năng admin, chat và báo cáo | Quản lý user/shop/voucher, chat buyer–seller, báo cáo doanh thu và xuất CSV |

Mỗi thành viên đọc phần code liên quan, thực hiện các bước review của module được giao và phối hợp chạy kịch bản demo chung. Hoàng Quân phụ trách tổng hợp và sửa lỗi toàn project.

## 2. Chuẩn bị để review

- Chạy MongoDB; tại gốc project chạy `npm start`. Terminal thứ hai vào `front-end` rồi chạy `npm start`. Hướng dẫn cài lần đầu xem [README](README.md).
- Mở [http://localhost:3000](http://localhost:3000), dùng tài khoản buyer, seller và admin của bộ demo.
- Mỗi vai trò dùng một hồ sơ trình duyệt riêng. Hai tab cùng hồ sơ có thể dùng chung phiên đăng nhập.
- Chuẩn bị hàng còn kho, hàng hết kho, địa chỉ giả lập và voucher hợp lệ. Dùng COD mô phỏng.
- Dùng cùng một mã đơn để phối hợp kiểm tra buyer → seller → báo cáo. Không import lại DB khi đang diễn tập.

### Tài khoản đăng nhập để test

Sau khi chạy `npm run seed:demo`, mở `demo/accounts.local.json` trên máy để lấy mật khẩu. Mỗi máy tạo bộ mật khẩu riêng; file này được Git bỏ qua.

| Vai trò | Email sau khi seed | Mật khẩu | Thành viên / luồng review |
| --- | --- | --- | --- |
| Buyer | buyer_demo@example.test | Trường password của buyer_demo trong file tài khoản | Minh Phú, Công Hiếu — tài khoản, mua hàng và chat |
| Seller 1 | seller_demo@example.test | Trường password của seller_demo | Mạnh Hùng — sản phẩm, kho, đơn và COD |
| Seller 2 | seller_demo_2@example.test | Trường password của seller_demo_2 | Mạnh Hùng, Công Hiếu — kiểm tra đơn nhiều shop |
| Admin | admin_demo@example.test | Trường password của admin_demo | Gia Anh, Hoàng Quân — quản trị và báo cáo |

- Đăng nhập tại [localhost:3000/signin](http://localhost:3000/signin). Seller mở `/manage-product`; admin mở `/admin`.
- Dùng hai hồ sơ trình duyệt để review buyer–seller đồng thời. Nếu dùng chung hồ sơ, đăng xuất trước khi đổi vai trò.
- Email `@example.test` không nhận thư thật; dùng tài khoản thử riêng có hộp thư truy cập được cho luồng quên mật khẩu.

## 3. Công việc và cách review từng phần

### Hoàng Quân — Hệ thống và tích hợp

**Công việc:** quản lý cấu hình chạy, cấu trúc backend, kết nối database, xác thực/phân quyền và tích hợp các phần của nhóm.

**Code cần đọc:** `server.js`, `src/routers/`, `src/middleware/`, `src/models/`, các service nghiệp vụ trong `src/services/`.

**Cách review:**
1. Chạy frontend và backend; kiểm tra web lấy được dữ liệu từ MongoDB.
2. Theo dõi một request từ giao diện qua router, middleware, controller/service đến model; đối chiếu dữ liệu trả về với giao diện.
3. Kiểm tra khách chưa đăng nhập và tài khoản sai vai trò không được đọc/sửa dữ liệu riêng tư.
4. Phối hợp cả nhóm chạy trọn một đơn COD, kiểm tra trạng thái và số tiền thống nhất ở buyer, seller và admin.
5. Tổng hợp lỗi, tích hợp thay đổi và nhờ người phụ trách kiểm tra lại.

### Minh Phú — Tài khoản và catalog

**Công việc:** phụ trách trải nghiệm truy cập web, tài khoản, tìm kiếm và xem sản phẩm.

**Code cần đọc:** `front-end/src/pages/SignIn.jsx`, `pages/Profile/`, `pages/Home.jsx`, `pages/ProductDetail/`, `components/home/Header/`, `src/controllers/catalogController.js`.

**Cách review:**
1. Chưa đăng nhập: mở Home/Shop, chuyển trang, xem ảnh, giá VNĐ, tồn kho và chi tiết sản phẩm.
2. Tìm `Samsung` bằng Enter và bằng gợi ý; kiểm tra kết quả đúng từ khóa.
3. Chọn danh mục, sắp xếp giá tăng/giảm, bấm Clear Filters. Thử từ khóa không có kết quả.
4. Bấm thêm giỏ khi chưa đăng nhập: phải yêu cầu đăng nhập. Hàng hết kho không cho thêm giỏ.
5. Đăng nhập sai rồi đúng; kiểm tra hồ sơ, đăng xuất và menu desktop/mobile.
6. Thử đổi mật khẩu trên tài khoản demo riêng. Luồng quên mật khẩu dùng email thử nghiệm của nhóm có thể nhận thư.

### Công Hiếu — Giỏ hàng và đơn mua

**Công việc:** phụ trách các bước buyer chọn hàng, đặt đơn, theo dõi và hủy đơn hợp lệ.

**Code cần đọc:** `front-end/src/pages/Cart/`, `pages/Checkout/`, `pages/Address/`, `pages/OrderHistory/` và các service đặt đơn trong `src/services/`.

**Cách review:**
1. Buyer thêm hàng vào giỏ; tăng/giảm số lượng, bỏ mặt hàng và đối chiếu tổng tiền.
2. Thử số lượng vượt tồn kho: hệ thống phải từ chối hoặc báo lỗi rõ ràng.
3. Checkout: chọn địa chỉ, áp voucher hợp lệ rồi thử mã sai; đối chiếu tiền giảm và số tiền cuối.
4. Đặt COD, mở lịch sử đơn, kiểm tra hàng/số lượng/địa chỉ/tổng tiền và gửi mã đơn cho Hùng.
5. Sau khi seller giao/thu tiền, tải lại đơn để đối chiếu trạng thái.
6. Tạo đơn phụ rồi hủy sản phẩm lúc pending; phối hợp Hùng kiểm tra hoàn kho. Thử hủy khi shipping để kiểm tra bị chặn.
7. Thử đơn có hàng từ hai shop: mỗi shop chỉ xử lý phần của mình.

### Mạnh Hùng — Seller

**Công việc:** phụ trách sản phẩm, tồn kho và xử lý phần hàng thuộc shop.

**Code cần đọc:** `front-end/src/pages/DashboardSeller/`, `src/services/productManagement.js`, `src/services/orderLifecycle.js`.

**Cách review:**
1. Vào `/manage-product`, sửa sản phẩm của shop, tải lại kiểm tra dữ liệu đã lưu. Tải ảnh lên Cloudinary, lưu sản phẩm rồi tải lại để kiểm tra ảnh.
2. Vào `/manage-inventory` sửa tồn kho; kiểm tra trạng thái còn/hết hàng ngoài catalog.
3. Vào `/manage-order`, tìm mã đơn Hiếu gửi; đối chiếu sản phẩm, số lượng và tiền thuộc shop.
4. Chuyển pending → shipping; tại `/manage-shipping` cập nhật giao thành công (shipped).
5. Xác nhận thu COD sau khi giao; đối chiếu `/overview` trước và sau thu tiền.
6. Với đơn hai shop, kiểm tra shop mình không sửa hàng của shop kia; một shop thu tiền chưa làm toàn đơn paid nếu shop còn lại chưa thu.

### Gia Anh — Admin, chat và báo cáo

**Công việc:** phụ trách quản trị, trao đổi buyer–seller, báo cáo và tải dữ liệu CSV.

**Code cần đọc:** `front-end/src/pages/DashboardAdmin/`, `pages/Chat/`, `src/services/chatService.js`, `socketService.js`, `salesReport.js`.

**Cách review:**
1. Admin mở quản lý user/shop/voucher; dùng dữ liệu demo riêng để thử thao tác, chuẩn bị voucher cho Hiếu.
2. Nếu thử duyệt shop, dùng shop pending; sau duyệt kiểm tra seller được đăng bán.
3. Phối hợp Phú mở hai phiên buyer–seller, bấm Chat with Seller, gửi/trả lời tin rồi tải lại; nội dung phải đúng cuộc trò chuyện, không tự nhân đôi.
4. Mở báo cáo admin; nhờ Hùng mở báo cáo seller cùng khoảng ngày, đối chiếu đơn vừa thu COD và tiền sau voucher.
5. Tải CSV từ tài khoản seller; kiểm tra dữ liệu thuộc đúng shop.
6. Kiểm tra buyer không truy cập dữ liệu admin; tài khoản ngoài cuộc trò chuyện không được đọc tin nhắn.

## 4. Kịch bản demo chung — khoảng 10–12 phút

| Thứ tự | Người trình bày | Nội dung |
| --- | --- | --- |
| 1 | Hoàng Quân | Giới thiệu bài toán Shopii, ba vai trò, kiến trúc hệ thống và mở trang chủ |
| 2 | Minh Phú | Tìm/lọc/sắp xếp sản phẩm, mở chi tiết, kiểm tra tồn kho rồi đăng nhập buyer |
| 3 | Công Hiếu | Thêm giỏ, chọn địa chỉ, dùng voucher, đặt COD; chỉ ra mã đơn và số tiền phải trả |
| 4 | Mạnh Hùng | Seller mở đúng đơn; chuyển đang giao → đã giao → xác nhận thu COD |
| 5 | Gia Anh | Phối hợp Phú demo chat; giới thiệu admin và đối chiếu báo cáo sau đơn vừa xử lý; Hùng hỗ trợ mở CSV |
| 6 | Hoàng Quân | Quay lại đơn buyer và đối chiếu trạng thái, số tiền với seller/admin |

Luồng chính dùng một shop. Chuẩn bị thêm tình huống hết hàng, voucher sai, hủy đơn, đơn hai shop và sai quyền để review bổ sung. Thống nhất sẵn tài khoản, sản phẩm, voucher và trình tự chuyển vai trước khi trình chiếu.
