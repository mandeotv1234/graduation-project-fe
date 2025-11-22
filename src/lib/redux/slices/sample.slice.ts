import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type SampleState = {
  value: number
  text: string
}

const initialState: SampleState = {
  value: 0,
  text: 'Hello from global state'
}

const sampleSlice = createSlice({
  name: 'sample',
  initialState,
  reducers: {
    increment(state) {
      state.value += 1
    },
    decrement(state) {
      state.value -= 1
    },
    setText(state, action: PayloadAction<string>) {
      state.text = action.payload
    }
  }
})

export const { increment, decrement, setText } = sampleSlice.actions
export const sampleReducer = sampleSlice.reducer
