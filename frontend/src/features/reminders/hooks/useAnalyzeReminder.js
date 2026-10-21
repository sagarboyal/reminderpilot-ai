import { useState, useRef, useCallback } from 'react'
import { analyzeMessage } from '../../../api/analyzeApi'

/**
 * Custom hook encapsulating message analysis state and API interactions.
 */
export function useAnalyzeReminder() {
  const [loading, setLoading] = useState(false)
  const [loadingSlow, setLoadingSlow] = useState(false)
  const [extractedData, setExtractedData] = useState(null)
  const [error, setError] = useState(null)
  const slowTimerRef = useRef(null)

  const analyze = useCallback(async (message) => {
    setError(null)
    setExtractedData(null)
    setLoading(true)
    setLoadingSlow(false)

    // Trigger "Still working..." feedback if network/LLM takes > 5 seconds
    slowTimerRef.current = setTimeout(() => {
      setLoadingSlow(true)
    }, 5000)

    try {
      const result = await analyzeMessage(message)
      setExtractedData(result)
      return result
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.')
      return null
    } finally {
      clearTimeout(slowTimerRef.current)
      setLoading(false)
      setLoadingSlow(false)
    }
  }, [])

  const clear = useCallback(() => {
    setExtractedData(null)
    setError(null)
  }, [])

  return {
    loading,
    loadingSlow,
    extractedData,
    error,
    analyze,
    clear
  }
}
