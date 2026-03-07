import { configureStore } from '@reduxjs/toolkit'

import { sampleReducer } from '@/lib/redux/slices/sample.slice'

export const store = configureStore({
  reducer: {
    sample: sampleReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST']
      }
    })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
