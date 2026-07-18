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
  isForceSubmitted: boolean
}

const initialState: AntiCheatState = {
  violations: [],
  totalViolations: 0,
  isFullscreen: false,
  isWarningVisible: false,
  isBlurred: false,
  warningMessage: '',
  socketConnected: false,
  isForceSubmitted: false
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
        maxViolations: number
      }>
    ) {
      // Don't track beyond max violations (exam already auto-submitted)
      if (state.totalViolations >= action.payload.maxViolations) return

      const violation: ViolationEntry = {
        type: action.payload.type,
        detail: action.payload.detail,
        timestamp: action.payload.timestamp,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        synced: false
      }
      state.violations.push(violation)
      state.totalViolations = Math.min(
        state.totalViolations + 1,
        action.payload.maxViolations
      )
    },
    markViolationSynced(state, action: PayloadAction<string>) {
      const violation = state.violations.find((v) => v.id === action.payload)
      if (violation) {
        violation.synced = true
      }
    },
    setTotalViolations(state, action: PayloadAction<number>) {
      state.totalViolations = action.payload
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
    setForceSubmitted(state, action: PayloadAction<boolean>) {
      state.isForceSubmitted = action.payload
    },
    resetAntiCheat() {
      return initialState
    }
  }
})

export const {
  addViolation,
  markViolationSynced,
  setTotalViolations,
  setFullscreen,
  showWarning,
  hideWarning,
  setBlurred,
  setSocketConnected,
  setForceSubmitted,
  resetAntiCheat
} = antiCheatSlice.actions

export const antiCheatReducer = antiCheatSlice.reducer
