import { configureStore } from '@reduxjs/toolkit'
import budgetSwitchReducer from './storeManagement/budgetSwitch'

export default configureStore({
  reducer: {
      budgetSwitch: budgetSwitchReducer
  },
})