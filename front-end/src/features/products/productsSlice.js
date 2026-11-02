import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [], // Khởi tạo mảng rỗng
  loading: false,
  error: null,
  selectedProduct: null,
  productDetailLoading: false,
  productDetailError: null
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    fetchProductsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchProductsSuccess(state, action) {
      state.products = action.payload;
      state.loading = false;
    },
    fetchProductsFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    fetchProductDetailStart(state) {
      state.productDetailLoading = true;
      state.productDetailError = null;
    },
    fetchProductDetailSuccess(state, action) {
      state.selectedProduct = action.payload;
      state.productDetailLoading = false;
    },
    fetchProductDetailFailure(state, action) {
      state.productDetailLoading = false;
      state.productDetailError = action.payload;
    },
    clearSelectedProduct(state) {
      state.selectedProduct = null;
    }
  }
});

export const { 
  fetchProductsStart, 
  fetchProductsSuccess, 
  fetchProductsFailure,
  fetchProductDetailStart,
  fetchProductDetailSuccess,
  fetchProductDetailFailure,
  clearSelectedProduct
} = productsSlice.actions;

export default productsSlice.reducer;