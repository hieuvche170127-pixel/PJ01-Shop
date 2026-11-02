import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  createRoutesFromElements,
  Route,
  ScrollRestoration,
} from "react-router-dom";
import RequireRole from "./components/common/RequireRole";
import Footer from "./components/home/Footer/Footer";
import FooterBottom from "./components/home/Footer/FooterBottom";
import Header from "./components/home/Header/Header";
import HeaderBottom from "./components/home/Header/HeaderBottom";
import SpecialCase from "./components/SpecialCase/SpiecialCase.jsx";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ManagerDashboardSellerLaydout from "./pages/DashboardSeller/ManagerDashboardSellerLaydout";
import ManageProduct from "./pages/DashboardSeller/ManageProduct/ManageProduct";
import ProductDetail from "./pages/DashboardSeller/ManageProduct/ProductDetail";
import ManageStoreProfile from "./pages/DashboardSeller/ManageStoreProfile/ManageStoreProfile";
import ManageInventory from "./pages/DashboardSeller/ManageProduct/ManageInventory";
import ManageOrder from "./pages/DashboardSeller/ManageOrder/ManageOrderHistory";
import ManageDispute from "./pages/DashboardSeller/ManageDispute/ManageDispute";
import ManageReturnRequest from "./pages/DashboardSeller/ManageReturnRequest/ManageReturnRequest";
import ManageShipping from "./pages/DashboardSeller/ManageShipping/ManageShipping";
import Overview from "./pages/DashboardSeller/Overview/Overview";
import OverviewA from "./pages/DashboardAdmin/Overview/Overview";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart } from "./features/cart/cartSlice";

import { Provider } from 'react-redux';
import 'react-toastify/dist/ReactToastify.css';

import SignIn from "./pages/SignIn.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";

import Home from './pages/Home.jsx';
import Cart from "./pages/Cart/Cart";

import Checkout from "./pages/Checkout/Checkout";
import Address from './pages/Address/Address';
import SignUp from './pages/SignUp';
import Payment from './pages/Payment/Payment';
import PaymentResult from './pages/PaymentResult/PaymentResult';
import StoreRegistration from './pages/StoreRegistration';
import OrderHistory from './pages/OrderHistory/OrderHistory';
import OrderDetail from './pages/OrderHistory/OrderDetail';
import MyReviews from './pages/MyReviews/MyReviews';
import WriteReview from './pages/Review/WriteReview';
import AuthProductDetail from './pages/ProductDetail/AuthProductDetail';
import Chat from './pages/Chat/Chat'; // Import the Chat component
import MyDisputes from './pages/Disputes/MyDisputes';
import CreateDisputeForm from './pages/Disputes/CreateDisputeForm';
import Profile from './pages/Profile/Profile'; // Import the Profile component
import ReturnRequestsList from './pages/ReturnRequests/ReturnRequestsList';

import ManageUser from "./pages/DashboardAdmin/ManageUser/ManageUser";
import ManageStore from "./pages/DashboardAdmin/ManageShop/ManageStore";
import ManageProductA from "./pages/DashboardAdmin/ManageProduct/ManageProduct";
import ManageVoucher from "./pages/DashboardAdmin/ManageVoucher/ManageVoucher";
import AdminDashboardLayout from "./pages/DashboardAdmin/ManagerDashboardAdminLaydout";


const Layout = () => {
  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Header />
      <HeaderBottom />
      {/* <SpecialCase /> */}
      <ScrollRestoration />
      <Outlet />
      <Footer />
      <FooterBottom />
    </div>
  );
};
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<ErrorPage />}>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />}></Route> {/* Trang chủ cho buyer */}
        <Route path="/shop" element={<Home />} />
        <Route path="/products/:productId" element={<AuthProductDetail />} />
        <Route path="/cart" element={<Cart />}></Route>
        <Route path="/checkout" element={<Checkout />}></Route>
        <Route path="/address" element={<Address />}></Route>
        <Route path="/payment" element={<Payment />}></Route>
        <Route path="/payment-result" element={<PaymentResult />}></Route>
        <Route path="/profile" element={<Profile />}></Route>
        <Route path="/order-history" element={<OrderHistory />}></Route>
        <Route path="/order-details/:id" element={<OrderDetail />}></Route>
        <Route path="/my-reviews" element={<MyReviews />}></Route>
        <Route path="/write-review/:productId" element={<WriteReview />}></Route>
        <Route path="/auth/product/:productId" element={<AuthProductDetail />}></Route>
        <Route path="/chat" element={<Chat />}></Route>
        <Route path="/disputes" element={<MyDisputes />}></Route>
        <Route path="/create-dispute/:orderItemId" element={<CreateDisputeForm />}></Route>
        <Route path="/return-requests" element={<ReturnRequestsList />}></Route>
      </Route>
      
      <Route path="/" element={<RequireRole role="seller"><ManagerDashboardSellerLaydout /></RequireRole>} errorElement={<ErrorPage />}>
        <Route path="overview" element={<Overview />}></Route>
        <Route path="manage-product" element={<ManageProduct />}></Route>
        <Route path="manage-inventory" element={<ManageInventory />} />
        <Route path="manage-store" element={<ManageStoreProfile />}></Route>
        <Route path="product/:id" element={<ProductDetail />} errorElement={<ErrorPage />} />
        <Route path="manage-order" element={<ManageOrder />}></Route>
        <Route path="manage-shipping" element={<ManageShipping />}></Route>
        <Route path="manage-dispute" element={<ManageDispute />} />
        <Route path="manage-return-request" element={<ManageReturnRequest />} />
      </Route>

       <Route path="/admin" element={<RequireRole role="admin"><AdminDashboardLayout /></RequireRole>}>
        <Route path="/admin" element={<OverviewA />}></Route>
        <Route
          path="/admin/manage-products"
          element={<ManageProductA />}
        ></Route>
        <Route path="/admin/manage-users" element={<ManageUser />}></Route>
        <Route path="/admin/manage-stores" element={<ManageStore />}></Route>
        <Route path="/admin/manage-vouchers" element={<ManageVoucher />}></Route>
      </Route>

      <Route path="/signin" element={<SignIn />}></Route>
      <Route path="/signup" element={<SignUp />}></Route>
      <Route path="/store-registration" element={<StoreRegistration />}></Route>
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />}></Route>
      <Route path="*" element={<ErrorPage />} />
    </Route>
  )
);

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector(state => state.auth);
  useEffect(() => {
    if (token && user?.role === "buyer") dispatch(fetchCart());
  }, [dispatch, token, user?.role]);

  return (
    <div className="font-bodyFont">
      <RouterProvider router={router} />
    </div>
  );
}

export default App;

