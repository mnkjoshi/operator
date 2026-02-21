export type BrowserActionStatus = 'ok' | 'error' | 'blocked'

export interface BrowserState {
  sessionId: string | null
  url: string
  screenshotBase64: string | null
  updatedAtMs: number | null
  lastAction: string | null
  lastActionStatus: BrowserActionStatus | null
  isBusy: boolean
}
