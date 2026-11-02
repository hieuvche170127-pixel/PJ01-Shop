import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { toast } from "react-toastify";
import CartService from "../../services/api/CartService";

const userId = null

export const fetchCart = createAsyncThunk('cart/fetchCart', async () => {
  const res = await CartService.getAllProducts(userId)
  return res.items
})

const initialState = {
  status: '',
  cartData: [],
  productQuantity: 0,
  totalCount: 0,
  totalSubAmount: 0,
  tax: 0,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const newProduct = action.payload.product;
      const itemIndex = state.cartData.findIndex(item => item?.productId?._id === newProduct._id);
      if (itemIndex < 0) {
        state.cartData.push({
          productId: newProduct,
          color: newProduct.inStock[0].color,
          quantity: 1,
        });
        state.totalCount += 1;
        toast.success("Add new product successful..");
      } else {
        toast.error("Product already in cart!");
      }
    },
    updateCart: (state, action) => {
      const { productId, color, quantity } = action.payload;
      const findProductInCart = state.cartData.findIndex(
        item => item?.productId?._id === productId && item?.color === color
      );
      if (findProductInCart !== -1) {
        state.cartData[findProductInCart].quantity = quantity;
      }
    },
    deleteCart: (state, action) => {
      const { productId, color } = action.payload;
      state.cartData = state.cartData.filter(item => !(item?.productId?._id === productId && item?.color === color));
    },
    calculateTotalCount: (state, action) => {
      state.totalCount = state.cartData?.reduce((total, item) => total + item.quantity, 0);
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCart.pending, (state, action) => {
        state.status = 'loading'
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.cartData = action.payload
        state.status = 'idle'
      })

  }
})




export const { addToCart, updateCart, deleteCart, calculateTotalCount } = cartSlice.actions

export default cartSlice.reducer