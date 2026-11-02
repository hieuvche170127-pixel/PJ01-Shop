import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  checkedBrands: [],
  checkedCategorys: [],
  checkedPrices: [],
  checkedColors: [],
}
const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
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
  }
})

export const {
  toggleBrand,
  toggleCategory,
  togglePrice,
  toggleColor,
} = filterSlice.actions;

export default filterSlice.reducer