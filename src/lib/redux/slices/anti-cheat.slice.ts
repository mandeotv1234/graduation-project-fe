import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import { ViolationType } from '@/lib/constants/violation'
import { ViolationEntry } from '@/lib/types'

interface AntiCheatState {
  violations: ViolationEntry[]
  totalViolations: number
  isFullscreen: boolean
  isWarningVisible: boolean
  isBlurred: boolean
  warningMessage: string
  socketConnected: boolean
}

const initialState: AntiCheatState = {
  violations: [],
  totalViolations: 0,
  isFullscreen: false,
  isWarningVisible: false,
  isBlurred: false,
  warningMessage: '',
  socketConnected: false
}

const antiCheatSlice = createSlice({
  name: 'antiCheat',
  initialState,
  reducers: {
    addViolation(
      state,
      action: PayloadAction<{
        type: ViolationType
        detail: string
        timestamp: string
      }>
    ) {
      const violation: ViolationEntry = {
        ...action.payload,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        synced: false
      }
      state.violations.push(violation)
      state.totalViolations += 1
    },
    markViolationSynced(state, action: PayloadAction<string>) {
      const violation = state.violations.find((v) => v.id === action.payload)
      if (violation) {
        violation.synced = true
      }
    },
    setFullscreen(state, action: PayloadAction<boolean>) {
      state.isFullscreen = action.payload
    },
    showWarning(state, action: PayloadAction<string>) {
      state.isWarningVisible = true
      state.warningMessage = action.payload
    },
    hideWarning(state) {
      state.isWarningVisible = false
      state.warningMessage = ''
    },
    setBlurred(state, action: PayloadAction<boolean>) {
      state.isBlurred = action.payload
    },
    setSocketConnected(state, action: PayloadAction<boolean>) {
      state.socketConnected = action.payload
    },
    resetAntiCheat() {
      return initialState
    }
  }
})

export const {
  addViolation,
  markViolationSynced,
  setFullscreen,
  showWarning,
  hideWarning,
  setBlurred,
  setSocketConnected,
  resetAntiCheat
} = antiCheatSlice.actions

export const antiCheatReducer = antiCheatSlice.reducer
