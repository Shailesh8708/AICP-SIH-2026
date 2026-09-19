import React, { useEffect, useRef, useState } from 'react'
import {
  Send,
  Sparkles,
  CheckCircle2,
  Mic,
  MicOff,
  Award,
  Volume2,
  Lightbulb,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  LogOut,
  AlertTriangle,
} from 'lucide-react'
import { Button, Alert } from '../../../components/common'
import { careerAgentAPI } from '../../../services/careerAgentAPI'
import { useSpeechRecognition } from '../../../utils/useSpeechRecognition'

const STAGES = ['personal', 'education', 'skills', 'experience', 'projects', 'achievements', 'certifications', 'preferences', 'complete']
const STAGE_LABELS = {
  personal: 'Personal Info',
  education: 'Education',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  achievements: 'Achievements',
  certifications: 'Certifications',
  preferences: 'Career Goals',
  complete: 'Complete',
}

export const AIInterview = ({ onComplete }) => {
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [showRestartModal, setShowRestartModal] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [error, setError] = useState('')
  const [validationNotice, setValidationNotice] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [currentStage, setCurrentStage] = useState('personal')
  const [usedMicForCurrentAnswer, setUsedMicForCurrentAnswer] = useState(false)

  const bottomRef = useRef(null)
  const activeRequestRef = useRef(0)

  // Speech Recognition Hook
  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    duration: speechDuration,
    isSupported: speechSupported,
    startListening,
    stopListening,
    resetTranscript,
    getSpeechMetrics,
  } = useSpeechRecognition()

  // Sync speech recognition transcript with input field
  useEffect(() => {
    if (transcript || interimTranscript) {
      setUsedMicForCurrentAnswer(true)
      const combined = (transcript + (interimTranscript ? ` ${interimTranscript}` : '')).trim()
      if (combined) {
        setInput(combined)
      }
    }
  }, [transcript, interimTranscript])

  // Check for existing session on mount
  useEffect(() => {
    careerAgentAPI.getSession()
      .then((res) => {
        const s = res?.data?.session
        if (s && s.status === 'active') {
          setSession(s)
          setMessages(s.messages || [])
          setCurrentStage(s.currentStage || 'personal')
        } else if (s && s.status === 'completed') {
          setSession(s)
          setIsComplete(true)
          setMessages(s.messages || [])
          setCurrentStage('complete')
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, validationNotice])

  const toggleMic = () => {
    if (isListening) {
      stopListening()
    } else {
      setValidationNotice('')
      setUsedMicForCurrentAnswer(true)
      startListening()
    }
  }

  const startInterview = async () => {
    setStarting(true)
    setError('')
    setValidationNotice('')
    try {
      const res = await careerAgentAPI.startInterview()
      const s = res?.data?.session
      setSession(s)
      setMessages(s?.messages || [])
      setCurrentStage(s?.currentStage || 'personal')
      setIsComplete(false)
    } catch (err) {
      setError(err?.message || 'Could not start interview. Please try again.')
    } finally {
      setStarting(false)
    }
  }

  const confirmRestart = async () => {
    if (restarting) return
    setRestarting(true)
    setShowRestartModal(false)

    // Invalidate any in-flight message requests
    activeRequestRef.current += 1
    setLoading(false)

    // Stop microphone if currently active
    if (isListening) {
      stopListening()
    }
    resetTranscript()
    setInput('')
    setUsedMicForCurrentAnswer(false)
    setValidationNotice('')
    setError('')

    try {
      const res = await careerAgentAPI.startInterview()
      const s = res?.data?.session
      setSession(s)
      setMessages(s?.messages || [])
      setCurrentStage(s?.currentStage || 'personal')
      setIsComplete(false)
    } catch (err) {
      setError(err?.message || 'Could not restart interview. Please try again.')
    } finally {
      setRestarting(false)
    }
  }

  const confirmExit = async () => {
    if (exiting) return
    setExiting(true)
    setShowExitModal(false)

    // Invalidate any in-flight message requests
    activeRequestRef.current += 1
    setLoading(false)

    // Stop microphone if currently active
    if (isListening) {
      stopListening()
    }
    resetTranscript()
    setInput('')
    setUsedMicForCurrentAnswer(false)
    setValidationNotice('')
    setError('')

    try {
      await careerAgentAPI.exitInterview()
    } catch (_err) {
      // Non-blocking exit fallback
    } finally {
      setSession(null)
      setMessages([])
      setCurrentStage('personal')
      setIsComplete(false)
      setExiting(false)
    }
  }

  const sendMessage = async () => {
    const textToSend = input.trim()
    if (!textToSend || !session?._id) return

    if (isListening) {
      stopListening()
    }

    setLoading(true)
    setError('')
    setValidationNotice('')

    const requestId = ++activeRequestRef.current
    const enteredViaMic = usedMicForCurrentAnswer
    const speechMetrics = enteredViaMic ? getSpeechMetrics() : null

    try {
      const res = await careerAgentAPI.sendMessage(session._id, textToSend, enteredViaMic, speechMetrics)
      if (activeRequestRef.current !== requestId) return // Ignore stale response if restarted or exited

      const data = res?.data || {}

      if (data.validationError) {
        // Validation check caught low-effort or invalid input
        setValidationNotice(data.feedback || data.message || 'Please provide a more detailed and valid answer.')
        return
      }

      const { message, currentStage: nextStage, isComplete: done, evaluation, evaluations } = data

      // Update messages with evaluation attached to user answer
      const userMessage = {
        role: 'user',
        content: textToSend,
        stage: currentStage,
        evaluation,
        enteredViaMic,
      }

      const assistantMessage = message
        ? { role: 'assistant', content: message, stage: nextStage }
        : null

      setMessages((prev) => (assistantMessage ? [...prev, userMessage, assistantMessage] : [...prev, userMessage]))

      if (evaluations) {
        setSession((prev) => ({ ...prev, evaluations }))
      }

      if (nextStage) setCurrentStage(nextStage)
      if (done) {
        setIsComplete(true)
        onComplete?.()
      }

      // Reset input and speech states
      setInput('')
      setUsedMicForCurrentAnswer(false)
      resetTranscript()
    } catch (err) {
      if (activeRequestRef.current === requestId) {
        setError(err?.message || 'Message could not be sent. Please try again.')
      }
    } finally {
      if (activeRequestRef.current === requestId) {
        setLoading(false)
      }
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const stageIndex = STAGES.indexOf(currentStage)
  const evaluationsList = session?.evaluations || []
  const avgScore = evaluationsList.length > 0
    ? Math.round(evaluationsList.reduce((acc, ev) => acc + (ev.score || 0), 0) / evaluationsList.length)
    : 80

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // ─── COMPLETE VIEW ───
  if (isComplete) {
    return (
      <div className="career-interview-complete-wrapper">
        <div className="career-interview-complete">
          <CheckCircle2 size={52} color="#2da96d" />
          <h2>Interview Round {session?.sessionRound || 1} Complete!</h2>
          <p>
            Your answers have been evaluated and your profile has been updated.
            Review your ratings, voice delivery metrics, and the AI-recommended exemplar answers below before moving forward.
          </p>
        </div>

        {/* Hero Scorecard */}
        <div className="interview-scorecard-hero">
          <div className="scorecard-metric-card">
            <span>Overall Score</span>
            <strong>{avgScore}</strong>
            <small>/100 Proficiency</small>
          </div>
          <div className="scorecard-metric-card">
            <span>Interview Round</span>
            <strong>#{session?.sessionRound || 1}</strong>
            <small>Round Progression</small>
          </div>
          <div className="scorecard-metric-card">
            <span>Questions Evaluated</span>
            <strong>{evaluationsList.length}</strong>
            <small>Structured Responses</small>
          </div>
          <div className="scorecard-metric-card">
            <span>Performance Tier</span>
            <strong style={{ fontSize: '1.4rem', color: avgScore >= 80 ? '#15803d' : '#0369a1' }}>
              {avgScore >= 85 ? 'Exceptional' : avgScore >= 70 ? 'Solid' : 'Developing'}
            </strong>
            <small>Recruiter Benchmark</small>
          </div>
        </div>

        {/* Model Answers and Feedback Section */}
        {evaluationsList.length > 0 && (
          <div className="model-answers-section">
            <h3>
              <Sparkles size={18} color="#6655ee" />
              AI Suggested Best Answers & Performance Breakdown
            </h3>
            {evaluationsList.map((ev, idx) => (
              <div key={idx} className="model-answer-card">
                <div className="model-qa-question">
                  <span>
                    Q{idx + 1}: {ev.question}
                  </span>
                  <span className={`eval-score-pill tier-${(ev.ratingTier || 'good').toLowerCase().replace(/\s+/g, '-')}`}>
                    <Award size={12} /> {ev.score}/100 • {ev.ratingTier}
                  </span>
                </div>

                <div className="model-qa-candidate">
                  <span className="eval-bullet-title">Your Submitted Answer:</span>
                  <p>{ev.answer}</p>
                  {ev.feedback && <p className="eval-feedback-text">💡 <em>{ev.feedback}</em></p>}
                </div>

                {/* Speech metrics if used mic */}
                {ev.speechAnalysis && (
                  <div className="speech-analysis-panel">
                    <div className="speech-meta-row">
                      <span className="speech-tag">
                        🎯 Pacing: <strong>{ev.speechAnalysis.pacingWPM} WPM</strong> ({ev.speechAnalysis.pacingStatus})
                      </span>
                      <span className="speech-tag">
                        🗣️ Tone: <strong>{ev.speechAnalysis.tone}</strong>
                      </span>
                      {ev.speechAnalysis.fillerWordsCount > 0 && (
                        <span className="speech-tag filler">
                          ⚠️ Fillers: <strong>{ev.speechAnalysis.fillerWordsCount}</strong> ({ev.speechAnalysis.fillerWordsList?.slice(0, 3).join(', ')})
                        </span>
                      )}
                    </div>
                    {ev.speechAnalysis.grammaticalIssues?.length > 0 ? (
                      <div className="grammar-issues-list">
                        <span className="grammar-label">Grammar Notes:</span>
                        <ul>
                          {ev.speechAnalysis.grammaticalIssues.map((iss, gIdx) => (
                            <li key={gIdx}>• {iss.issue}: <em>{iss.detail}</em> {iss.suggestion && `(${iss.suggestion})`}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="grammar-good">
                        ✓ Grammar & Syntax: Clear delivery with accurate sentence structure.
                      </div>
                    )}
                  </div>
                )}

                {/* AI Recommended Model Answer */}
                {ev.modelAnswer && (
                  <div className="model-qa-recommended">
                    <div className="model-qa-recommended-header">
                      <Sparkles size={14} /> AI Recommended Best Answer:
                    </div>
                    <p>{ev.modelAnswer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="interview-complete-actions">
          <Button variant="nav" onClick={startInterview} loading={starting}>
            <RefreshCw size={15} /> Retake Interview / Start Round {(session?.sessionRound || 1) + 1} (New Questions)
          </Button>
          <Button variant="outline" onClick={onComplete}>
            <Sparkles size={15} /> View Career Dashboard
          </Button>
        </div>
      </div>
    )
  }

  // ─── START SCREEN ───
  if (!session) {
    return (
      <div className="career-interview-start">
        <span className="section-label">AI CAREER INTERVIEW</span>
        <h2>Let the AI evaluate and build your career profile</h2>
        <p>
          Answer questions stage by stage using your keyboard or microphone.
          The AI will validate your answers, check grammar and voice delivery in real time, rate your responses, and present model answers upon completion.
        </p>
        <ul className="interview-stages-preview">
          {STAGES.filter((s) => s !== 'complete').map((stage) => (
            <li key={stage}><span className="stage-dot" /> {STAGE_LABELS[stage]}</li>
          ))}
        </ul>
        {error && <Alert type="error" message={error} />}
        <Button variant="nav" onClick={startInterview} loading={starting}>
          <Sparkles size={15} /> Start AI Interview
        </Button>
      </div>
    )
  }

  // ─── ACTIVE INTERVIEW CHAT ───
  return (
    <div className="career-interview">
      {/* Active Interview Controls Header */}
      <div className="interview-header-actions">
        <div className="interview-header-info">
          <span className="interview-round-badge">
            <Sparkles size={13} /> Round {session?.sessionRound || 1} • Question {stageIndex + 1} of {STAGES.length - 1}
          </span>
        </div>
        <div className="interview-action-buttons">
          <button
            type="button"
            className="interview-control-btn restart"
            onClick={() => setShowRestartModal(true)}
            disabled={loading || restarting || exiting}
            title="Restart interview from Question 1"
          >
            <RotateCcw size={14} /> Restart Interview
          </button>
          <button
            type="button"
            className="interview-control-btn exit"
            onClick={() => setShowExitModal(true)}
            disabled={loading || restarting || exiting}
            title="Exit ongoing interview without saving progress"
          >
            <LogOut size={14} /> Exit Interview
          </button>
        </div>
      </div>

      {/* Stage progress */}
      <div className="interview-progress">
        {STAGES.filter((s) => s !== 'complete').map((stage, i) => (
          <div key={stage} className={`interview-stage-step ${i < stageIndex ? 'done' : i === stageIndex ? 'active' : ''}`}>
            <span>{i + 1}</span>
            <small>{STAGE_LABELS[stage]}</small>
          </div>
        ))}
      </div>

      {/* Chat messages */}
      <div className="interview-chat">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            {msg.role === 'assistant' && <span className="chat-avatar ai"><Sparkles size={14} /></span>}
            <div className="chat-bubble">
              <div className="chat-bubble-text">{msg.content}</div>

              {/* Answer Evaluation Pill & Speech Feedback */}
              {msg.role === 'user' && msg.evaluation && (
                <div className="chat-answer-evaluation">
                  <div className="eval-score-row">
                    <span className={`eval-score-pill tier-${(msg.evaluation.ratingTier || 'good').toLowerCase().replace(/\s+/g, '-')}`}>
                      <Award size={12} /> Score: {msg.evaluation.score}/100 • {msg.evaluation.ratingTier}
                    </span>
                    {msg.enteredViaMic && (
                      <span className="eval-mic-badge">
                        <Volume2 size={11} /> Voice Answer
                      </span>
                    )}
                  </div>

                  {msg.evaluation.feedback && (
                    <p className="eval-feedback-text">{msg.evaluation.feedback}</p>
                  )}

                  {msg.evaluation.strengths?.length > 0 && (
                    <div className="eval-bullet-list strengths">
                      <span className="eval-bullet-title">Strengths:</span>
                      <ul>
                        {msg.evaluation.strengths.map((st, idx) => (
                          <li key={idx}><CheckCircle2 size={12} color="#2da96d" /> {st}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {msg.evaluation.improvements?.length > 0 && (
                    <div className="eval-bullet-list improvements">
                      <span className="eval-bullet-title">Suggestions:</span>
                      <ul>
                        {msg.evaluation.improvements.map((imp, idx) => (
                          <li key={idx}><Lightbulb size={12} color="#b45309" /> {imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Speech & Grammar Analysis */}
                  {msg.evaluation.speechAnalysis && (
                    <div className="speech-analysis-panel">
                      <div className="speech-meta-row">
                        <span className="speech-tag">
                          🎯 Pacing: <strong>{msg.evaluation.speechAnalysis.pacingWPM} WPM</strong> ({msg.evaluation.speechAnalysis.pacingStatus})
                        </span>
                        <span className="speech-tag">
                          🗣️ Tone: <strong>{msg.evaluation.speechAnalysis.tone}</strong>
                        </span>
                        {msg.evaluation.speechAnalysis.fillerWordsCount > 0 && (
                          <span className="speech-tag filler">
                            ⚠️ Fillers: <strong>{msg.evaluation.speechAnalysis.fillerWordsCount}</strong> ({msg.evaluation.speechAnalysis.fillerWordsList?.slice(0, 3).join(', ')})
                          </span>
                        )}
                      </div>
                      {msg.evaluation.speechAnalysis.grammaticalIssues?.length > 0 ? (
                        <div className="grammar-issues-list">
                          <span className="grammar-label">Grammar Notes:</span>
                          <ul>
                            {msg.evaluation.speechAnalysis.grammaticalIssues.map((iss, gIdx) => (
                              <li key={gIdx}>• {iss.issue}: <em>{iss.detail}</em> {iss.suggestion && `(${iss.suggestion})`}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="grammar-good">
                          ✓ Grammar: Accurate grammar and clear articulation.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {msg.role === 'user' && <span className="chat-avatar user">You</span>}
          </div>
        ))}

        {loading && (
          <div className="chat-message assistant">
            <span className="chat-avatar ai"><Sparkles size={14} /></span>
            <div className="chat-bubble typing"><span /><span /><span /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Validation notice banner if input was rejected */}
      {validationNotice && (
        <div className="validation-notice-banner">
          <AlertCircle size={17} />
          <div>
            <strong>Input Quality Check Notice:</strong> {validationNotice}
          </div>
        </div>
      )}

      {/* Speech listening status indicator */}
      {isListening && (
        <div className="mic-live-banner">
          <div className="mic-pulse-dot" />
          <span>Listening to your microphone... ({formatTimer(speechDuration)}) — Speak clearly. Click mic or Send when done.</span>
        </div>
      )}

      {speechError && <Alert type="warning" message={speechError} />}
      {error && <Alert type="error" message={error} />}

      {/* Input row with Mic, Textarea, and Send */}
      <div className="interview-input-row">
        {speechSupported && (
          <button
            type="button"
            className={`interview-mic-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleMic}
            title={isListening ? 'Stop recording microphone' : 'Speak answer using microphone'}
            disabled={loading || restarting || exiting}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            if (validationNotice) setValidationNotice('')
          }}
          onKeyDown={handleKey}
          placeholder={isListening ? 'Listening... Speak now...' : 'Type or speak your answer here… (Enter to send)'}
          rows={3}
          disabled={loading || restarting || exiting}
          className="interview-textarea"
        />

        <Button variant="nav" onClick={sendMessage} disabled={!input.trim() || loading || restarting || exiting} loading={loading}>
          <Send size={16} />
        </Button>
      </div>

      {/* Restart Interview Confirmation Dialog */}
      {showRestartModal && (
        <div className="interview-modal-overlay" onClick={() => !restarting && setShowRestartModal(false)}>
          <div className="interview-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="interview-modal-header">
              <div className="interview-modal-icon restart">
                <RotateCcw size={18} />
              </div>
              <h3>Restart Interview?</h3>
            </div>
            <p className="interview-modal-body">
              Your current interview progress will be discarded and the interview will start again from Question 1.
            </p>
            <div className="interview-modal-actions">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowRestartModal(false)}
                disabled={restarting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="nav"
                size="sm"
                onClick={confirmRestart}
                loading={restarting}
                disabled={restarting}
              >
                Restart
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Interview Confirmation Dialog */}
      {showExitModal && (
        <div className="interview-modal-overlay" onClick={() => !exiting && setShowExitModal(false)}>
          <div className="interview-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="interview-modal-header">
              <div className="interview-modal-icon exit">
                <AlertTriangle size={18} />
              </div>
              <h3>Exit Interview?</h3>
            </div>
            <p className="interview-modal-body">
              Your current interview is still in progress. Are you sure you want to exit? Your current progress will not be submitted as a completed interview.
            </p>
            <div className="interview-modal-actions">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowExitModal(false)}
                disabled={exiting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={confirmExit}
                loading={exiting}
                disabled={exiting}
              >
                Exit Interview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIInterview
