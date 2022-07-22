import { configureStore } from '@reduxjs/toolkit'
import budgetSwitchReducer from './storeManagement/budgetSwitch'
import fabFourSwitchReducer from './storeManagement/fabFourSwitch'

export default configureStore({
  reducer: {
      budgetSwitch: budgetSwitchReducer,
      fabFourSwitch: fabFourSwitchReducer
  },
})