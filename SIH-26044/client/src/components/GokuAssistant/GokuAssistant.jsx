import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Send, X, Sparkles, Volume2, VolumeX, RotateCcw,
  ArrowRight, Compass, CheckCircle2, ChevronRight, MessageSquare, Mic, MicOff
} from 'lucide-react'
import { GokuAvatar } from './GokuAvatar'
import { GOKU_KNOWLEDGE } from './gokuKnowledge'
import { analyzeIntent } from './gokuIntentEngine'
import './gokuAssistant.css'

export const GokuAssistant = ({ user }) => {
  const navigate = useNavigate()

  // Component UI states
  const [isOpen, setIsOpen] = useState(false)
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(false)
  const [hasDismissedWelcome, setHasDismissedWelcome] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  // Redirection state
  const [redirectState, setRedirectState] = useState(null)
  // redirectState format: { targetRoute: string, title: string, progress: number, timerId: any, intervalId: any }

  // Initial welcome message
  const initialMessages = [
    {
      id: 'init-1',
      sender: 'goku',
      text: GOKU_KNOWLEDGE.welcomeGreeting,
      guidance: GOKU_KNOWLEDGE.welcomeSubtext,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]

  const [messages, setMessages] = useState(initialMessages)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Automatically show welcome bubble on load after a brief delay
  useEffect(() => {
    const welcomeTimer = setTimeout(() => {
      if (!hasDismissedWelcome && !isOpen) {
        setShowWelcomeBubble(true)
      }
    }, 1400)

    return () => clearTimeout(welcomeTimer)
  }, [hasDismissedWelcome, isOpen])

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping, isOpen])

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setShowWelcomeBubble(false)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Web Speech synthesis voice helper
  const speakText = (text) => {
    if (!soundEnabled || !window.speechSynthesis) return
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.05
      utterance.pitch = 1.05
      window.speechSynthesis.speak(utterance)
    } catch (e) {
      console.warn('Speech synthesis error:', e)
    }
  }

  // Voice recognition helper (Web Speech API)
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser.')
      return
    }

    if (isListening) {
      setIsListening(false)
      return
    }

    try {
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)
      recognition.onerror = () => setIsListening(false)

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInputText(transcript)
        handleUserQuery(transcript)
      }

      recognition.start()
    } catch (err) {
      console.error(err)
      setIsListening(false)
    }
  }

  // Cancel any ongoing auto-redirection
  const cancelRedirection = () => {
    if (redirectState) {
      clearInterval(redirectState.intervalId)
      clearTimeout(redirectState.timerId)
      setRedirectState(null)
    }
  }

  // Execute redirection immediately
  const executeRedirection = (route) => {
    cancelRedirection()
    setIsOpen(false)
    navigate(route)
  }

  // Handle user query submission
  const handleUserQuery = (queryToProcess) => {
    const query = (queryToProcess || inputText).trim()
    if (!query) return

    cancelRedirection()

    // Add user message
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText('')
    setIsTyping(true)

    // Simulate AI thinking and intent analysis
    setTimeout(() => {
      const analysis = analyzeIntent(query)
      setIsTyping(false)

      const gokuMsgId = `goku-${Date.now()}`
      const gokuMsg = {
        id: gokuMsgId,
        sender: 'goku',
        text: analysis.message,
        guidance: analysis.guidance,
        badge: analysis.badge,
        route: analysis.route,
        actionText: analysis.actionText,
        suggestions: analysis.suggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, gokuMsg])
      speakText(analysis.message)

      // Handle automatic navigation with countdown if intent is a target route
      if (analysis.autoRedirect && analysis.route) {
        const duration = analysis.redirectDelayMs || 2200
        const intervalStep = 50
        let elapsed = 0

        const intervalId = setInterval(() => {
          elapsed += intervalStep
          const progressPercent = Math.min(100, Math.round((elapsed / duration) * 100))
          setRedirectState((prev) => (prev ? { ...prev, progress: progressPercent } : null))
        }, intervalStep)

        const timerId = setTimeout(() => {
          clearInterval(intervalId)
          setRedirectState(null)
          setIsOpen(false)
          navigate(analysis.route)
        }, duration)

        setRedirectState({
          msgId: gokuMsgId,
          targetRoute: analysis.route,
          title: analysis.title,
          progress: 0,
          timerId,
          intervalId,
        })
      }
    }, 450)
  }

  // Reset conversation to initial state
  const resetConversation = () => {
    cancelRedirection()
    setMessages(initialMessages)
    speakText(GOKU_KNOWLEDGE.welcomeGreeting)
  }

  return (
    <div className="goku-floating-container">
      {/* Welcome Speech Bubble on First Load */}
      {!isOpen && showWelcomeBubble && (
        <div className="goku-welcome-bubble">
          <div className="goku-welcome-header">
            <span className="goku-welcome-badge">
              <Sparkles size={11} /> Goku • AI Guide
            </span>
            <button
              className="goku-welcome-close"
              onClick={(e) => {
                e.stopPropagation()
                setShowWelcomeBubble(false)
                setHasDismissedWelcome(true)
              }}
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
          <p className="goku-welcome-text">
            “Hello! I’m <strong>Goku</strong>, your AI assistant. How can I help you today?”
          </p>
          <div
            className="goku-welcome-cta"
            onClick={() => {
              setShowWelcomeBubble(false)
              setIsOpen(true)
            }}
          >
            <span>Ask Goku or Navigate</span> <ArrowRight size={13} />
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          className="goku-trigger-btn"
          onClick={() => {
            setShowWelcomeBubble(false)
            setIsOpen(true)
          }}
          aria-label="Open AI Assistant Goku"
          title="Open Goku AI Virtual Guide"
        >
          <div className="goku-aura-ring" />
          <GokuAvatar size="md" status="online" animated />
        </button>
      )}

      {/* Interactive Chat Panel Modal */}
      {isOpen && (
        <div className="goku-chat-panel">
          {/* Header */}
          <div className="goku-header">
            <div className="goku-header-info">
              <GokuAvatar size="sm" status="online" animated={false} />
              <div className="goku-header-title">
                <h3>
                  Goku <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-semibold">AI GUIDE</span>
                </h3>
                <span>Central Virtual Navigator</span>
              </div>
            </div>

            <div className="goku-header-controls">
              {/* Sound toggle */}
              <button
                className="goku-icon-btn"
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Disable voice response' : 'Enable voice response'}
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>

              {/* Reset history */}
              <button
                className="goku-icon-btn"
                onClick={resetConversation}
                title="Restart conversation"
              >
                <RotateCcw size={15} />
              </button>

              {/* Close panel */}
              <button
                className="goku-icon-btn"
                onClick={() => {
                  cancelRedirection()
                  setIsOpen(false)
                }}
                title="Minimize assistant"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="goku-messages-feed">
            {messages.map((msg) => (
              <React.Fragment key={msg.id}>
                {msg.sender === 'user' ? (
                  <div className="goku-msg-user">
                    {msg.text}
                  </div>
                ) : (
                  <div className="goku-msg-assistant">
                    <GokuAvatar size="xs" animated={false} status="none" className="shrink-0 mt-1" />
                    <div className="goku-msg-card">
                      {msg.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded-md w-fit">
                          {msg.badge}
                        </span>
                      )}
                      <p className="whitespace-pre-line font-medium text-slate-800">{msg.text}</p>
                      {msg.guidance && (
                        <p className="text-xs text-slate-600 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                          {msg.guidance}
                        </p>
                      )}

                      {/* Live Auto-Redirect Countdown Bar */}
                      {redirectState && redirectState.msgId === msg.id && (
                        <div className="goku-redirect-box">
                          <div className="goku-redirect-header">
                            <span>Redirecting to {redirectState.title}...</span>
                            <span>{100 - redirectState.progress}%</span>
                          </div>
                          <div className="goku-progress-track">
                            <div
                              className="goku-progress-bar"
                              style={{ width: `${redirectState.progress}%` }}
                            />
                          </div>
                          <div className="goku-redirect-actions">
                            <button
                              className="goku-btn-go"
                              onClick={() => executeRedirection(redirectState.targetRoute)}
                            >
                              Go there now <ArrowRight size={12} />
                            </button>
                            <button
                              className="goku-btn-cancel"
                              onClick={cancelRedirection}
                            >
                              Cancel redirect
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Manual Action Button if not currently redirecting */}
                      {msg.route && (!redirectState || redirectState.msgId !== msg.id) && (
                        <button
                          className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 px-3 py-1.5 rounded-lg transition w-fit"
                          onClick={() => executeRedirection(msg.route)}
                        >
                          <Compass size={13} /> {msg.actionText || 'Visit Section'} <ChevronRight size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}

            {isTyping && (
              <div className="goku-msg-assistant">
                <GokuAvatar size="xs" animated={false} status="none" className="shrink-0 mt-1" />
                <div className="goku-typing">
                  <div className="goku-dot" />
                  <div className="goku-dot" />
                  <div className="goku-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="goku-chips-scroll">
            {GOKU_KNOWLEDGE.quickChips.map((chip, idx) => (
              <button
                key={idx}
                className="goku-chip"
                onClick={() => handleUserQuery(chip.query)}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            className="goku-input-container"
            onSubmit={(e) => {
              e.preventDefault()
              handleUserQuery()
            }}
          >
            <button
              type="button"
              className={`p-2 rounded-lg border transition ${
                isListening
                  ? 'bg-red-500 text-white border-red-600 animate-pulse'
                  : 'text-slate-500 hover:bg-slate-100 border-transparent'
              }`}
              onClick={toggleListening}
              title={isListening ? 'Listening... click to stop' : 'Use voice input'}
            >
              {isListening ? <Mic size={16} /> : <MicOff size={16} />}
            </button>

            <input
              ref={inputRef}
              type="text"
              className="goku-input-box"
              placeholder="Ask Goku (e.g. 'I want a diet plan', 'Find internships')..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            <button
              type="submit"
              className="goku-send-btn"
              disabled={!inputText.trim() || isTyping}
              title="Send to Goku"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

