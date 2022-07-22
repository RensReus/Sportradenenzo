import { createSlice } from '@reduxjs/toolkit'

export const fabFourSwitch = createSlice({
  name: 'fabFour',
  initialState: {
    value: false,
  },
  reducers: {
    flip: (state) => {
        state.value = !state.value
    }
  },
})

export const { flip } = fabFourSwitch.actions

export default fabFourSwitch.reducer