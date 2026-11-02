import { createSlice } from "@reduxjs/toolkit"

const initialState = {
  //  userId : '6660389839c9c42c124688a3'
  userId: null
}
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
  }
})



export default userSlice.reducer