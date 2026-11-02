import { API_ORIGIN } from '../../../utils/apiUrl';
import { productImageFallback } from '../../../utils/productImage';
import { resolveProductImage } from '../../../utils/productImage';
import { formatVND } from '../../../utils/currency';
import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaShoppingCart, FaExchangeAlt } from "react-icons/fa";
import { FiUser, FiShoppingBag, FiMessageSquare, FiLogOut } from "react-icons/fi";
import { IoStorefrontOutline } from "react-icons/io5";
import { MdOutlineHistory, MdOutlineRateReview, MdOutlineLocalShipping } from "react-icons/md";
import { RiUserSettingsLine, RiHomeSmileLine, RiShieldLine } from "react-icons/ri";
import Flex from "../../designLayouts/Flex";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import Image from "../../designLayouts/Image";
import {
  resetUserInfo,
  setUserInfo,
  setProducts,
  calculateCartTotalCount,
} from "../../../redux/orebiSlice";

const HeaderBottom = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const ref = useRef();

  // Get authentication info from Redux store
  const authState = useSelector(state => state.auth);
  const isAuthenticated = authState?.isAuthenticated || false;
  const user = authState?.user || null;

  // Get data from Redux store with safe checks
  const orebiReducer = useSelector((state) => state.orebiReducer) || {};
  const products = orebiReducer.products || [];
  
  // Get chat unread count
  const chatState = useSelector((state) => state.chat);
  const chatNotifications = chatState?.conversations?.reduce((count, conv) => count + (conv.unreadCount || 0), 0) || 0;
  
  // Get cart information from Redux store
  const cartState = useSelector((state) => state.cart) || {};
  const cartItems = cartState.items || [];
  
  // Calculate total items in cart
  const cartTotalCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const [showUser, setShowUser] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [userName, setUserName] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('accessToken'));
  
  const API_BASE_URL = API_ORIGIN;

  // Fetch user data function
  const fetchUserData = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsLoggedIn(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserName(response.data.fullname || response.data.username);
      dispatch(setUserInfo(response.data));
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      if (error.response && error.response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('accessToken');
        setIsLoggedIn(false);
      }
    }
  }, [API_BASE_URL, dispatch]);

  // Effect to check login status whenever component renders
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  }, []);

  // Effect to load data when component mounts
  useEffect(() => {
    
    if (isLoggedIn) {
      fetchUserData();
    }
  }, [isLoggedIn, fetchUserData, dispatch]);

  // Handle clicks outside user menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setShowUser(false);
      }
    };

    document.body.addEventListener("click", handleClickOutside);
    return () => document.body.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredProducts([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      axios.get(API_BASE_URL + '/api/products', { signal: controller.signal, params: { q: searchQuery, limit: 6 } })
        .then(({ data }) => setFilteredProducts(data.data.map(p => ({ ...p, name: p.title }))))
        .catch(() => { if (!controller.signal.aborted) setFilteredProducts([]); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery, API_BASE_URL]);
  const submitSearch = () => { navigate('/shop?q=' + encodeURIComponent(searchQuery.trim())); setSearchQuery(''); };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`${API_BASE_URL}/api/logout`, null, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      localStorage.removeItem('accessToken');
      dispatch(resetUserInfo());
      setIsLoggedIn(false);
      setUserName(null);
      navigate('/signin');
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear the token on the client side even if the API call fails
      localStorage.removeItem('accessToken');
      setIsLoggedIn(false);
      setUserName(null);
      navigate('/signin');
    }
  };

  const getProductImage = (item) => resolveProductImage(item.image, API_BASE_URL);

  return (
    <div className="w-full bg-gradient-to-r from-[#1a237e] to-[#2962ff] relative shadow-xl">
      <div className="max-w-container mx-auto">
        <Flex className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full px-4 pb-4 lg:pb-0 h-full lg:h-20">
          {/* Brand Name */}
          <div className="flex h-14 items-center gap-2">
            <Link to="/">
              <div className="flex items-center">
                <IoStorefrontOutline className="text-3xl text-white mr-2" />
                <p className="text-[24px] font-bold text-white tracking-wider hover:text-gray-100 transition-colors">
                  SHOPII
                </p>
              </div>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:w-[600px] h-[50px] text-base bg-white flex items-center gap-2 justify-between px-6 rounded-xl shadow-lg">
            <input
              className="flex-1 h-full outline-none placeholder:text-[#9e9e9e] placeholder:text-[14px]"
              type="text"
              onChange={handleSearch}
              onKeyDown={event => { if (event.key === 'Enter') submitSearch(); }}
              value={searchQuery}
              placeholder="Search products..."
            />
            <button aria-label="Search products" onClick={submitSearch}><FaSearch className="w-5 h-5 text-[#2962ff] cursor-pointer" /></button>
            
            {searchQuery && filteredProducts.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full mx-auto max-h-96 bg-white top-16 absolute left-0 z-50 overflow-y-auto shadow-2xl scrollbar-thin scrollbar-thumb-gray-300 cursor-pointer rounded-lg"
              >
                {filteredProducts.map((item) => (
                  <div
                    onClick={() => {
                      navigate(`/products/${item._id}`, { state: { item } });
                      setSearchQuery("");
                    }}
                    key={item._id}
                    className="max-w-[600px] h-28 bg-gray-50 mb-2 flex items-center gap-3 p-3 hover:bg-blue-50 transition-colors border-b border-gray-100"
                  >
                    <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        className="w-full h-full object-contain p-1" 
                        src={getProductImage(item)} 
                        alt={item.name} 
                        onError={productImageFallback}
                      />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <p className="font-semibold text-lg truncate text-[#2962ff]">{item.name}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {item.description || "No description available"}
                      </p>
                      <p className="text-sm font-medium">
                        Price:{" "}
                        <span className="text-[#2962ff] font-semibold">
                          {formatVND(item.price)}
                        </span>
                      </p>
                      {item.category && (
                        <p className="text-xs text-gray-500">
                          Category: {item.category}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* User Actions */}
          <div className="flex gap-8 mt-2 lg:mt-0 items-center pr-6 cursor-pointer relative">
            {/* Chat icon */}
            {isAuthenticated && (
              <Link to="/chat" className="text-white hover:text-gray-200 transition-colors">
                <div className="flex flex-col items-center relative group">
                  <div className="bg-white/10 rounded-full p-2 group-hover:bg-white/20 transition-all">
                    <FiMessageSquare className="text-xl" />
                  </div>
                  {chatNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 text-xs w-5 h-5 flex items-center justify-center rounded-full bg-[#ff3d71] text-white font-bold">
                      {chatNotifications}
                    </span>
                  )}
                  <span className="text-xs mt-1 font-medium">Chat</span>
                </div>
              </Link>
            )}
            
            {/* User dropdown */}
            <div 
              ref={ref}
              onClick={() => setShowUser(!showUser)} 
              className="text-white hover:text-gray-200 transition-colors"
            >
              <div className="flex flex-col items-center group">
                <div className="bg-white/10 rounded-full p-2 group-hover:bg-white/20 transition-all">
                  <FiUser className="text-xl" />
                </div>
                <span className="text-xs mt-1 font-medium">Account</span>
              </div>
              
              {showUser && (
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-16 right-0 z-50 bg-white w-64 text-[#262626] rounded-lg shadow-2xl p-4"
                >
                  {isAuthenticated ? (
                    // Logged in: Show account menu
                    <>
                      {userName && (
                        <div className="text-[#2962ff] font-medium py-2 border-b border-gray-200 mb-2 flex items-center">
                          <FiUser className="mr-2 text-lg" />
                          Hello, {userName}
                        </div>
                      )}
                      <Link to="/order-history" onClick={() => setShowUser(false)}>
                        <div className="py-2 hover:bg-blue-50 px-3 rounded transition-colors flex items-center gap-3">
                          <MdOutlineHistory className="text-[#2962ff] text-lg" />
                          Order History
                        </div>
                      </Link>
                      <Link to="/profile" onClick={() => setShowUser(false)}>
                        <div className="py-2 hover:bg-blue-50 px-3 rounded transition-colors flex items-center gap-3">
                          <RiUserSettingsLine className="text-[#2962ff] text-lg" />
                          Profile
                        </div>
                      </Link>
                      <Link to="/address" onClick={() => setShowUser(false)}>
                        <div className="py-2 hover:bg-blue-50 px-3 rounded transition-colors flex items-center gap-3">
                          <RiHomeSmileLine className="text-[#2962ff] text-lg" />
                          Addresses
                        </div>
                      </Link>
                      <Link to="/my-reviews" onClick={() => setShowUser(false)}>
                        <div className="py-2 hover:bg-blue-50 px-3 rounded transition-colors flex items-center gap-3">
                          <MdOutlineRateReview className="text-[#2962ff] text-lg" />
                          Reviews
                        </div>
                      </Link>
                      <Link to="/disputes" onClick={() => setShowUser(false)}>
                        <div className="py-2 hover:bg-blue-50 px-3 rounded transition-colors flex items-center gap-3">
                          <RiShieldLine className="text-[#2962ff] text-lg" />
                          Disputes
                        </div>
                      </Link>
                      <Link to="/return-requests" onClick={() => setShowUser(false)}>
                        <div className="py-2 hover:bg-blue-50 px-3 rounded transition-colors flex items-center gap-3">
                          <FaExchangeAlt className="text-[#2962ff] text-lg" />
                          Return Requests
                        </div>
                      </Link>
                      <div 
                        onClick={handleLogout}
                        className="py-2 mt-2 hover:bg-red-50 px-3 rounded transition-colors flex items-center gap-3 border-t border-gray-200 pt-3 text-red-600"
                      >
                        <FiLogOut className="text-lg" />
                        Logout
                      </div>
                    </>
                  ) : (
                    // Not logged in: Show Sign In and Sign Up
                    <>
                      <Link to="/signin" onClick={() => setShowUser(false)}>
                        <div className="py-3 bg-[#2962ff] hover:bg-[#1a237e] text-white px-3 rounded-lg transition-colors text-center font-medium">
                          Sign In
                        </div>
                      </Link>
                      <Link to="/signup" onClick={() => setShowUser(false)}>
                        <div className="py-3 border border-[#2962ff] text-[#2962ff] hover:bg-blue-50 px-3 rounded-lg transition-colors mt-3 text-center font-medium">
                          Sign Up
                        </div>
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </div>
            
            {/* Shopping Cart */}
            <Link to="/cart" className="relative text-white hover:text-gray-200 transition-colors">
              <div className="flex flex-col items-center group">
                <div className="relative bg-white/10 rounded-full p-2 group-hover:bg-white/20 transition-all">
                  <FiShoppingBag className="text-xl" />
                  {/* Cart items counter */}
                  {cartTotalCount > 0 && (
                    <span className="absolute -top-1 -right-1 text-xs w-5 h-5 flex items-center justify-center rounded-full bg-[#ff3d71] text-white font-bold">
                      {cartTotalCount}
                    </span>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">Cart</span>
              </div>
            </Link>
          </div>
        </Flex>
      </div>
    </div>
  );
};

export default HeaderBottom;