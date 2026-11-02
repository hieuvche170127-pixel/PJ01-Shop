const initialState = {
  cart: null,
  loading: true,
  error: null,
};

const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_CART_SUCCESS':
      return { ...state, cart: action.payload, loading: false };
    case 'FETCH_CART_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'UPDATE_CART_SUCCESS':
      return { ...state, cart: action.payload };
    case 'UPDATE_CART_ERROR':
      return { ...state, error: action.payload };
    case 'DELETE_CART_SUCCESS':
      return { ...state, cart: action.payload };
    case 'DELETE_CART_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export default cartReducer;
