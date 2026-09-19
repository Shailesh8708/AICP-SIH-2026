import { useState, useRef, useEffect, useCallback } from 'react'

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState(null)
  const [duration, setDuration] = useState(0)

  const isSupported = typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  const isListeningRef = useRef(false)

  // Clean up timer and recognition on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch (_e) {
          // ignore abort error on unmount
        }
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Google Chrome or Edge.')
      return
    }

    setError(null)
    setTranscript('')
    setInterimTranscript('')
    setDuration(0)
    isListeningRef.current = true
    setIsListening(true)

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
      isListeningRef.current = true
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let currentInterim = ''

      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i]
        if (item.isFinal) {
          finalTranscript += item[0].transcript + ' '
        } else {
          currentInterim += item[0].transcript
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript.trim())
      }
      setInterimTranscript(currentInterim)
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        setError('Microphone permission was denied. Please allow microphone access in your browser settings.')
      } else if (event.error === 'no-speech') {
        // No speech detected, ignore silently
      } else {
        setError(`Microphone error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start()
        } catch (_e) {
          setIsListening(false)
          isListeningRef.current = false
          if (timerRef.current) clearInterval(timerRef.current)
        }
      } else {
        setIsListening(false)
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }

    try {
      recognition.start()
    } catch (err) {
      setError(`Failed to start speech recognition: ${err.message}`)
      setIsListening(false)
      isListeningRef.current = false
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    isListeningRef.current = false
    setIsListening(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (_e) {
        // ignore
      }
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setDuration(0)
    setError(null)
  }, [])

  const getSpeechMetrics = useCallback(() => {
    const fullText = (transcript + ' ' + interimTranscript).trim()
    const words = fullText.split(/\s+/).filter(Boolean)
    const wordCount = words.length
    const durationSeconds = Math.max(duration, 1)
    const wordsPerMinute = Math.round((wordCount / durationSeconds) * 60)

    return {
      isMicInput: true,
      durationSeconds,
      wordCount,
      wordsPerMinute,
    }
  }, [transcript, interimTranscript, duration])

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    duration,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    getSpeechMetrics,
  }
}

export default useSpeechRecognition

