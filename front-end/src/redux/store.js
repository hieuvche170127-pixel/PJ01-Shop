// store.js (updated)
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from '../features/auth/authSlice';
import productsReducer from '../features/products/productsSlice';
import cartReducer from '../features/cart/cartSlice';
import addressReducer from '../features/address/addressSlice';
import voucherReducer from '../features/voucher/voucherSlice';
import orderReducer from '../features/order/orderSlice';
import paymentReducer from '../features/payment/paymentSlice'; 
import reviewReducer from '../features/review/reviewSlice';
import chatReducer from '../features/chat/chatSlice';
import disputeReducer from '../features/dispute/disputeSlice';
import profileReducer from '../features/profile/profileSlice';
import returnRequestReducer from '../features/returnRequest/returnRequestSlice';

const persistConfig = {
  key: 'root',
  storage,
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

const initialCartState = {
  items: [],
  loading: false,
  error: null
};

const cartReducerWithInitial = (state = initialCartState, action) => {
  return cartReducer(state, action);
};

const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    products: productsReducer,
    cart: cartReducerWithInitial,
    address: addressReducer,
    voucher: voucherReducer,
    order: orderReducer,
    payment: paymentReducer,
    review: reviewReducer,
    chat: chatReducer,
    dispute: disputeReducer,
    profile: profileReducer,
    returnRequest: returnRequestReducer,
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

const persistor = persistStore(store);

export default { store, persistor };