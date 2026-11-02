import React from "react";
import { Link } from "react-router-dom";
import { HiOutlineHeart } from "react-icons/hi";
import { BsBag } from "react-icons/bs";
// import { useSelector } from "react-redux"; // Tạm thời bỏ import useSelector

const SpecialCase = () => {
  // Tạm thời comment lại các dòng sử dụng cartTotalCount
  // const cartTotalCount = useSelector((state) => state.cart.cartTotalCount);
  // const wishlistTotalCount = useSelector((state) => state.wishlist.wishlistTotalCount);

  return (
    <div className="fixed top-52 right-2 z-20 hidden md:flex flex-col gap-2">
      <Link to="/wishlist">
        <div className="bg-white w-16 h-[70px] rounded-md flex flex-col gap-1 text-[#33475b] justify-center items-center shadow-testShadow overflow-x-hidden group cursor-pointer relative">
          <div className="flex justify-center items-center">
            <HiOutlineHeart className="text-2xl -translate-x-12 group-hover:translate-x-3 transition-transform duration-200" />
            <HiOutlineHeart className="text-2xl -translate-x-3 group-hover:translate-x-12 transition-transform duration-200" />
          </div>
          <p className="text-xs font-semibold font-titleFont">Wish List</p>
          {/* Tạm thời bỏ hiển thị số lượng
          {wishlistTotalCount > 0 && (
            <span className="absolute top-1 right-2 bg-primeColor text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-semibold">
              {wishlistTotalCount}
            </span>
          )} */}
        </div>
      </Link>
      <Link to="/cart">
        <div className="bg-white w-16 h-[70px] rounded-md flex flex-col gap-1 text-[#33475b] justify-center items-center shadow-testShadow overflow-x-hidden group cursor-pointer relative">
          <div className="flex justify-center items-center">
            <BsBag className="text-2xl -translate-x-12 group-hover:translate-x-3 transition-transform duration-200" />
            <BsBag className="text-2xl -translate-x-3 group-hover:translate-x-12 transition-transform duration-200" />
          </div>
          <p className="text-xs font-semibold font-titleFont">Buy</p>
          {/* Tạm thời bỏ hiển thị số lượng
          {cartTotalCount > 0 && (
            <span className="absolute top-1 right-2 bg-primeColor text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-semibold">
              {cartTotalCount}
            </span>
          )} */}
        </div>
      </Link>
    </div>
  );
};

export default SpecialCase;