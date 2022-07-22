import { createSlice } from '@reduxjs/toolkit'

export const budgetSwitch = createSlice({
  name: 'budget',
  initialState: {
    value: false,
  },
  reducers: {
    flip: (state) => {
        state.value = !state.value
    }
  },
})

export const { flip } = budgetSwitch.actions

export default budgetSwitch.reducer