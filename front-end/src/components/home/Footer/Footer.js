import React from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Footer = () => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  let accountLinks = [["Sign In", "/signin"], ["Sign Up", "/signup"], ["Forgot password?", "/forgot-password"]];
  if (isAuthenticated) {
    accountLinks = [["Profile", "/profile"], ["Chat", "/chat"]];
    if (user?.role === "buyer") accountLinks.push(["Orders", "/order-history"], ["Addresses", "/address"]);
    if (user?.role === "seller") accountLinks.push(["Seller Dashboard", "/overview"], ["Manage Products", "/manage-product"]);
    if (user?.role === "admin") accountLinks.push(["Admin Dashboard", "/admin"], ["Manage Stores", "/admin/manage-stores"]);
  }
  const renderLinks = links => <ul className="space-y-3">{links.map(([label, to]) => <li key={to}><Link className="text-gray-600 hover:text-[#0F52BA] hover:underline underline-offset-4" to={to}>{label}</Link></li>)}</ul>;
  return (
    <footer className="bg-[#F5F5F3] border-t border-gray-200 mt-12">
      <div className="max-w-container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-6 py-12">
        <section>
          <h2 className="text-xl font-bold text-[#0F52BA] mb-4">SHOPII</h2>
          <p className="text-gray-600 leading-7">Khám phá sản phẩm công nghệ, so sánh giá và trao đổi trực tiếp với người bán trước khi đặt hàng.</p>
        </section>
        <nav aria-label="Footer shopping">
          <h2 className="font-semibold text-lg mb-4">Khám phá</h2>
          {renderLinks([["Home", "/"], ["Shop", "/shop"], ...(!isAuthenticated || user?.role === "buyer" ? [["Cart", isAuthenticated ? "/cart" : "/signin"]] : [])])}
        </nav>
        <nav aria-label="Footer account">
          <h2 className="font-semibold text-lg mb-4">Tài khoản</h2>
          {renderLinks(accountLinks)}
        </nav>
        <section>
          <h2 className="font-semibold text-lg mb-4">Mua hàng trên Shopii</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-600">
            <li>Chọn sản phẩm còn hàng.</li>
            <li>Kiểm tra giỏ hàng và địa chỉ nhận.</li>
            <li>Đặt COD và theo dõi đơn hàng.</li>
          </ol>
          <p className="mt-4 text-sm text-gray-500">Website demo môn SDN302. Đơn hàng và thanh toán được mô phỏng.</p>
        </section>
      </div>
    </footer>
  );
};
export default Footer;
