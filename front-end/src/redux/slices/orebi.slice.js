import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

const initialState = {
  userInfo: {},
  products: [],
  checkedBrands: [],
  checkedCategorys: [],
  checkedPrices: [],
  checkedColors: [],
  allproducts: [],
  wishlish: [],
  cartTotalCount: 0,
  wistlistTotalCount: 0,
};

export const orebiSlice = createSlice({
  name: "orebi",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = state.products.find(
        (item) => item._id === action.payload._id && item.color === action.payload.color
      );
      if (item) {
        item.quantity += action.payload.quantity;
      } else {
        state.products.push(action.payload);
      }
      toast.success("Product added to cart");
    },
    increaseQuantity: (state, action) => {
      const item = state.products.find(
        (item) => item._id === action.payload._id && item.color === action.payload.color
      );
      if (item) {
        item.quantity++;
      }
    },
    drecreaseQuantity: (state, action) => {
      const item = state.products.find(
        (item) => item._id === action.payload._id && item.color === action.payload.color
      );
      if (item.quantity === 1) {
        item.quantity = 1;
      } else {
        item.quantity--;
      }
    },
    deleteItem: (state, action) => {
      state.products = state.products.filter(
        (item) => item._id !== action.payload._id || item.color !== action.payload.color
      );
      toast.success("Product removed from cart");
    },
    deleteItemWL: (state, action) => {
      state.wishlish = state.wishlish.filter(
        (item) => item._id !== action.payload._id || item.color !== action.payload.color
      );
      toast.success("Product removed from Wishlist");
    },
    resetCart: (state) => {
      state.products = [];
    },
    addToWishlist: (state, action) => {
      const item = state.wishlish.find(
        (item) => item._id === action.payload._id && item.color === action.payload.color
      );
      if (item) {
        toast.warning("Product already in wishlist");
      } else {
        state.wishlish.push(action.payload);
        toast.success("Product added to wishlist");
      }
    },
    resetWishlist: (state) => {
      state.wishlish = [];
    },

    calculateCartTotalCount: (state) => {
      state.cartTotalCount = state.products?.reduce((total, item) => total + item.quantity, 0);
    },

    calculateWishlistTotalCount: (state) => {
      state.wistlistTotalCount = state.wishlish?.reduce((total, item) => total + item.quantity, 0);
    },

    toggleBrand: (state, action) => {
      const brand = action.payload;
      const isBrandChecked = state.checkedBrands.some(
        (b) => b._id === brand._id
      );

      if (isBrandChecked) {
        state.checkedBrands = state.checkedBrands.filter(
          (b) => b._id !== brand._id
        );
      } else {
        state.checkedBrands.push(brand);
      }
    },

    toggleCategory: (state, action) => {
      const category = action.payload;
      const isCategoryChecked = state.checkedCategorys.some(
        (b) => b._id === category._id
      );

      if (isCategoryChecked) {
        state.checkedCategorys = state.checkedCategorys.filter(
          (b) => b._id !== category._id
        );
      } else {
        state.checkedCategorys.push(category);
      }
    },
    togglePrice: (state, action) => {
      const price = action.payload;
      const isPriceChecked = state.checkedPrices.some(
        (p) => p._id === price._id
      );
      if (isPriceChecked) {
        state.checkedPrices = state.checkedPrices.filter(
          (p) => p._id !== price._id
        );
      } else {
        state.checkedPrices.push(price);
      }
    },
    toggleColor: (state, action) => {
      const color = action.payload;
      const isColorChecked = state.checkedColors.some(
        (c) => c._id === color._id
      );
      if (isColorChecked) {
        state.checkedColors = state.checkedColors.filter(
          (c) => c._id !== color._id
        );
      } else {
        state.checkedColors.push(color);
      }
    },
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
    },
    resetUserInfo: (state) => {
      state.userInfo = {};
    },
    setProducts: (state, action) => {
      state.allproducts = action.payload;
    },
    resetProducts: (state) => {
      state.allproducts = [];
    }
  },
});

export const {
  addToCart,
  increaseQuantity,
  drecreaseQuantity,
  deleteItem,
  deleteItemWL,
  resetCart,
  toggleBrand,
  toggleCategory,
  togglePrice,
  toggleColor,
  setUserInfo,
  resetUserInfo,
  setProducts,
  resetProducts,
  addToWishlist,
  calculateCartTotalCount,
  calculateWishlistTotalCount,
  resetWishlist
} = orebiSlice.actions;

export default orebiSlice.reducer;
