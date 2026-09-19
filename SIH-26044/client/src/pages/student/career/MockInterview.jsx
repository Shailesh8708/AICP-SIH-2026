import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  ChevronRight,
  CheckCircle2,
  BookOpen,
  Lightbulb,
  BarChart3,
  TrendingUp,
  RefreshCw,
  Mic,
  MicOff,
  Award,
  Volume2,
  AlertCircle,
} from 'lucide-react'
import { Button, Alert, Input } from '../../../components/common'
import { careerAgentAPI } from '../../../services/careerAgentAPI'
import { useSpeechRecognition } from '../../../utils/useSpeechRecognition'

const ROLES = [
  'Software Developer',
  'AI/ML Engineer',
  'Data Analyst',
  'Full Stack Developer',
  'Data Scientist',
  'DevOps Engineer',
  'Cybersecurity Analyst',
  'Backend Developer',
]
const DIFFICULTIES = ['easy', 'medium', 'hard']

const CATEGORY_COLORS = {
  HR: '#6655ee',
  Technical: '#267ee7',
  Behavioral: '#2da96d',
  Situational: '#e87829',
  'Project-Based': '#9b59b6',
}

const ScoreBar = ({ label, score, color = '#6655ee' }) => (
  <div className="mock-score-row">
    <span>{label}</span>
    <div className="mock-score-bar-wrap">
      <div className="mock-score-bar-fill" style={{ width: `${score || 0}%`, background: color }} />
    </div>
    <strong>{score ?? '—'}</strong>
  </div>
)

export const MockInterview = () => {
  const [targetRole, setTargetRole] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [jobDescription, setJobDescription] = useState('')
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [currentQ, setCurrentQ] = useState(0)
  const [phase, setPhase] = useState('setup') // setup | interview | result
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showTip, setShowTip] = useState(false)
  // Track all questions asked across sessions for this page visit
  const [sessionHistory, setSessionHistory] = useState([])

  // Speech & live evaluation states
  const [micUsedByQ, setMicUsedByQ] = useState({})
  const [speechMetricsByQ, setSpeechMetricsByQ] = useState({})
  const [liveEvaluations, setLiveEvaluations] = useState({})
  const [checkingAnswer, setCheckingAnswer] = useState(false)
  const [validationWarning, setValidationWarning] = useState('')

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

  // Sync speech recognition into current question answer
  useEffect(() => {
    if ((transcript || interimTranscript) && questions[currentQ]) {
      const qId = questions[currentQ].id
      const combined = (transcript + (interimTranscript ? ` ${interimTranscript}` : '')).trim()
      if (combined) {
        setAnswers((prev) => ({ ...prev, [qId]: combined }))
        setMicUsedByQ((prev) => ({ ...prev, [qId]: true }))
        setSpeechMetricsByQ((prev) => ({ ...prev, [qId]: getSpeechMetrics() }))
      }
    }
  }, [transcript, interimTranscript, currentQ, questions, getSpeechMetrics])

  const toggleMic = () => {
    if (isListening) {
      stopListening()
    } else {
      setValidationWarning('')
      const qId = questions[currentQ]?.id
      if (qId) {
        setMicUsedByQ((prev) => ({ ...prev, [qId]: true }))
      }
      startListening()
    }
  }

  const start = async (isRetry = false) => {
    if (!targetRole.trim()) return
    setLoading(true)
    setError('')
    setValidationWarning('')
    try {
      const previousQuestions = isRetry
        ? [...sessionHistory, ...questions.map((q) => q.question)]
        : sessionHistory
      const res = await careerAgentAPI.startMockInterview({
        targetRole,
        difficulty,
        jobDescription,
        previousQuestions,
      })
      if (res?.success) {
        const newQuestions = res.data.questions || []
        setQuestions(newQuestions)
        setCurrentQ(0)
        setAnswers({})
        setMicUsedByQ({})
        setSpeechMetricsByQ({})
        setLiveEvaluations({})
        setPhase('interview')
        setResult(null)
      } else {
        setError('Could not start mock interview.')
      }
    } catch (err) {
      setError(err?.message || 'Mock interview unavailable.')
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentAnswer = async () => {
    const q = questions[currentQ]
    if (!q) return
    const text = (answers[q.id] || '').trim()
    if (!text) {
      setValidationWarning('Please enter or record an answer first before checking.')
      return
    }

    if (isListening) stopListening()

    setCheckingAnswer(true)
    setValidationWarning('')
    try {
      const enteredViaMic = Boolean(micUsedByQ[q.id])
      const speechMetrics = speechMetricsByQ[q.id] || (enteredViaMic ? getSpeechMetrics() : null)

      const res = await careerAgentAPI.checkMockAnswer({
        question: q.question,
        answer: text,
        category: q.category,
        enteredViaMic,
        speechMetrics,
      })

      if (res?.data?.isValid === false) {
        setValidationWarning(res.data.reason || 'Please provide a more substantive answer.')
      } else if (res?.data?.evaluation) {
        setLiveEvaluations((prev) => ({
          ...prev,
          [q.id]: res.data.evaluation,
        }))
      }
    } catch (err) {
      setValidationWarning(err?.message || 'Could not evaluate this answer.')
    } finally {
      setCheckingAnswer(false)
    }
  }

  const handleNext = () => {
    if (isListening) stopListening()
    setValidationWarning('')
    resetTranscript()
    setCurrentQ((prev) => Math.min(prev + 1, questions.length - 1))
  }

  const handlePrev = () => {
    if (isListening) stopListening()
    setValidationWarning('')
    resetTranscript()
    setCurrentQ((prev) => Math.max(prev - 1, 0))
  }

  const submit = async () => {
    if (isListening) stopListening()
    setSubmitting(true)
    setError('')
    try {
      const answersArray = questions.map((q) => ({
        questionId: q.id,
        question: q.question,
        answer: answers[q.id] || '',
        category: q.category,
      }))
      const res = await careerAgentAPI.evaluateMockInterview(answersArray, targetRole)
      if (res?.success) {
        // Add these questions to session history for variety on retry
        setSessionHistory((prev) => [...prev, ...questions.map((q) => q.question)])
        setResult(res.data)
        setPhase('result')
      } else {
        setError('Evaluation failed. Please try again.')
      }
    } catch (err) {
      setError(err?.message || 'Evaluation unavailable.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    if (isListening) stopListening()
    setPhase('setup')
    setResult(null)
    setQuestions([])
    setAnswers({})
    setLiveEvaluations({})
    setError('')
  }

  const startNew = () => {
    // Keep role and difficulty, start with fresh questions avoiding session history
    start(true)
  }

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // ─── Setup ───
  if (phase === 'setup') {
    return (
      <div className="career-section">
        <div className="career-section-header">
          <span className="section-label">AI MOCK INTERVIEW</span>
          <h2>Practice before the real thing</h2>
          <p className="career-muted">
            Select a role and difficulty. The AI generates diverse questions across technical, behavioral, situational, HR, and project-based categories.
            Answer via text or microphone. You receive instant quality validation, voice & grammar analysis, scores, and recommended model answers.
          </p>
        </div>
        <div className="mock-setup">
          <label className="career-label">Target Role</label>
          <div className="role-chips">
            {ROLES.map((r) => (
              <button key={r} className={`role-chip ${targetRole === r ? 'active' : ''}`} onClick={() => setTargetRole(r)}>{r}</button>
            ))}
          </div>
          <Input label="Or type a custom role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Product Designer" />
          <label className="career-label">Difficulty</label>
          <div className="role-chips">
            {DIFFICULTIES.map((d) => (
              <button key={d} className={`role-chip ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(d)}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
          <label className="career-label">Job Description (optional — for role-specific questions)</label>
          <textarea
            className="jd-textarea"
            rows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste a job description for more targeted questions…"
          />
          {error && <Alert type="error" message={error} />}
          <Button variant="nav" onClick={() => start(false)} loading={loading} disabled={!targetRole.trim()}>
            <Sparkles size={15} /> Start Mock Interview
          </Button>
        </div>
      </div>
    )
  }

  // ─── Interview ───
  if (phase === 'interview') {
    const q = questions[currentQ]
    const totalAnswered = Object.keys(answers).filter((k) => answers[k]?.trim()).length
    const catColor = CATEGORY_COLORS[q?.category] || '#6655ee'
    const qEval = q ? liveEvaluations[q.id] : null

    return (
      <div className="career-section">
        <div className="mock-progress">
          <span>{currentQ + 1} / {questions.length}</span>
          <div className="mock-progress-bar">
            <div style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
          </div>
          <span className="mock-category" style={{ color: catColor }}>{q?.category}</span>
        </div>

        <div className="mock-question-card">
          <h3>{q?.question}</h3>
          {showTip && (
            <div className="mock-answer-tip">
              <Lightbulb size={14} color="#ec7c45" />
              <span>
                {q?.category === 'Technical'
                  ? 'Explain your reasoning step-by-step. Mention trade-offs and reference real projects.'
                  : q?.category === 'Behavioral' || q?.category === 'Situational'
                    ? 'Use the STAR method: Situation → Task → Action → Result. Be specific with examples.'
                    : q?.category === 'Project-Based'
                      ? 'Describe the project context, your role, the technical decisions made, and the outcome.'
                      : 'Keep answers focused. Use the STAR method. Aim for 60-90 words.'}
              </span>
            </div>
          )}

          {/* Voice listening status banner */}
          {isListening && (
            <div className="mic-live-banner">
              <div className="mic-pulse-dot" />
              <span>Recording answer ({formatTimer(speechDuration)}) — Speak clearly into your mic.</span>
            </div>
          )}

          <textarea
            className="mock-answer-textarea"
            value={answers[q?.id] || ''}
            onChange={(e) => {
              setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
              if (validationWarning) setValidationWarning('')
            }}
            placeholder="Type your answer here or click the microphone button below to speak your response."
            rows={7}
          />

          {validationWarning && (
            <div className="validation-notice-banner">
              <AlertCircle size={15} />
              <span><strong>Quality Notice:</strong> {validationWarning}</span>
            </div>
          )}

          {speechError && <Alert type="warning" message={speechError} />}

          {/* Controls row: Mic, Answering Tip, Check Answer */}
          <div className="mock-input-controls">
            <div className="mock-controls-left">
              {speechSupported && (
                <button
                  type="button"
                  className={`interview-mic-btn ${isListening ? 'listening' : ''}`}
                  onClick={toggleMic}
                  title={isListening ? 'Stop microphone' : 'Speak answer with microphone'}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}

              <Button
                variant="outline"
                onClick={checkCurrentAnswer}
                loading={checkingAnswer}
                disabled={!answers[q?.id]?.trim()}
              >
                <Award size={14} /> Check & Rate Answer
              </Button>
            </div>

            <button className="mock-tip-toggle" onClick={() => setShowTip(!showTip)}>
              <Lightbulb size={13} /> {showTip ? 'Hide tip' : 'Show answering tip'}
            </button>
          </div>

          {/* Live Checked Evaluation */}
          {qEval && (
            <div className="mock-live-eval-box">
              <div className="mock-live-eval-header">
                <span className="eval-score-pill tier-exceptional">
                  <Award size={13} /> Score: {qEval.overallScore || qEval.score}/100
                </span>
                {micUsedByQ[q.id] && (
                  <span className="eval-mic-badge">
                    <Volume2 size={11} /> Voice Evaluated
                  </span>
                )}
              </div>

              {qEval.feedback && (
                <p className="eval-feedback-text"><strong>AI Feedback:</strong> {qEval.feedback}</p>
              )}

              {qEval.improvement && (
                <p className="eval-feedback-text"><strong>Improvement Tip:</strong> {qEval.improvement}</p>
              )}

              {/* Speech Metrics */}
              {qEval.speechAnalysis && (
                <div className="speech-analysis-panel">
                  <div className="speech-meta-row">
                    <span className="speech-tag">
                      🎯 Pacing: <strong>{qEval.speechAnalysis.pacingWPM} WPM</strong> ({qEval.speechAnalysis.pacingStatus})
                    </span>
                    <span className="speech-tag">
                      🗣️ Tone: <strong>{qEval.speechAnalysis.tone}</strong>
                    </span>
                    {qEval.speechAnalysis.fillerWordsCount > 0 && (
                      <span className="speech-tag filler">
                        ⚠️ Fillers: <strong>{qEval.speechAnalysis.fillerWordsCount}</strong> ({qEval.speechAnalysis.fillerWordsList?.slice(0, 3).join(', ')})
                      </span>
                    )}
                  </div>
                  {qEval.speechAnalysis.grammaticalIssues?.length > 0 ? (
                    <div className="grammar-issues-list">
                      <span className="grammar-label">Grammar Notes:</span>
                      <ul>
                        {qEval.speechAnalysis.grammaticalIssues.map((iss, gIdx) => (
                          <li key={gIdx}>• {iss.issue}: <em>{iss.detail}</em> {iss.suggestion && `(${iss.suggestion})`}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="grammar-good">✓ Grammar: Well-articulated answer.</div>
                  )}
                </div>
              )}

              {/* Recommended Model Answer Preview */}
              {qEval.recommendedAnswer && (
                <div className="mock-qa-recommended" style={{ marginTop: '8px' }}>
                  <div className="model-qa-recommended-header">
                    <Sparkles size={13} /> Recommended Model Answer:
                  </div>
                  <p>{qEval.recommendedAnswer}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mock-nav">
          <Button variant="outline" onClick={handlePrev} disabled={currentQ === 0}>← Prev</Button>
          {currentQ < questions.length - 1
            ? <Button variant="nav" onClick={handleNext}>Next <ChevronRight size={15} /></Button>
            : (
              <Button variant="nav" onClick={submit} loading={submitting} disabled={totalAnswered < Math.ceil(questions.length * 0.6)}>
                <CheckCircle2 size={15} /> Submit Answers
              </Button>
            )}
        </div>

        {totalAnswered < Math.ceil(questions.length * 0.6) && currentQ === questions.length - 1 && (
          <p className="career-muted" style={{ textAlign: 'center', fontSize: '11px' }}>
            Please answer at least {Math.ceil(questions.length * 0.6)} questions before submitting.
          </p>
        )}
        {error && <Alert type="error" message={error} />}
      </div>
    )
  }

  // ─── Results ───
  if (phase === 'result' && result) {
    const { questionEvaluations = [], categoryScores = {} } = result

    return (
      <div className="career-section">
        {/* Hero score */}
        <div className="mock-result-hero">
          <span className="section-label">INTERVIEW COMPLETE</span>
          <strong className="mock-overall-score">{result.overallScore}<small>/100</small></strong>
          <p className="career-muted">{result.performanceSummary}</p>
          <p className="career-disclaimer">{result.disclaimer}</p>
        </div>

        {/* Score breakdown */}
        <div className="mock-scores-panel">
          <span className="section-label"><BarChart3 size={12} /> SCORE BREAKDOWN</span>
          <div className="mock-scores-grid">
            <ScoreBar label="Overall" score={result.overallScore} color="#6655ee" />
            <ScoreBar label="Technical" score={result.technicalScore} color="#267ee7" />
            <ScoreBar label="Communication" score={result.communicationScore} color="#2da96d" />
            <ScoreBar label="Relevance" score={result.relevanceScore} color="#e87829" />
            {Object.entries(categoryScores).map(([cat, score]) => (
              <ScoreBar key={cat} label={cat} score={score} color={CATEGORY_COLORS[cat] || '#888'} />
            ))}
          </div>
        </div>

        {/* Strengths & weaknesses */}
        <div className="mock-feedback-grid">
          <div className="mock-feedback-col">
            <span className="section-label">STRENGTHS</span>
            {(result.strengths || []).map((s, i) => (
              <div key={i} className="feedback-item good"><CheckCircle2 size={14} color="#2da96d" /> {s}</div>
            ))}
          </div>
          <div className="mock-feedback-col">
            <span className="section-label">AREAS TO IMPROVE</span>
            {(result.weaknesses || []).map((w, i) => (
              <div key={i} className="feedback-item warn">⚠ {w}</div>
            ))}
          </div>
        </div>

        {/* Communication feedback */}
        {result.communication && (
          <div className="mock-communication">
            <span className="section-label"><TrendingUp size={13} /> COMMUNICATION FEEDBACK</span>
            <p>{result.communication}</p>
          </div>
        )}

        {/* Per-question evaluation & AI Recommended Answers */}
        <div className="mock-suggested-answers">
          <span className="section-label">QUESTION-BY-QUESTION EVALUATION & MODEL ANSWERS</span>
          {(questionEvaluations.length > 0 ? questionEvaluations : questions.map((q) => ({
            question: q.question,
            category: q.category,
            yourAnswer: answers[q.id] || '(No answer)',
            feedback: 'No evaluation available.',
            improvement: 'Practice this question again.',
            recommendedAnswer: '',
            overallScore: null,
          }))).map((item, i) => (
            <details key={i} className="mock-qa-detail" open={i === 0}>
              <summary>
                <span className="mock-category" style={{ color: CATEGORY_COLORS[item.category] || '#6655ee' }}>{item.category}</span>
                {' '}{item.question}
                {item.overallScore != null && (
                  <span className="mock-qa-score">{item.overallScore}/100</span>
                )}
              </summary>
              <div className="mock-qa-body">
                <div className="mock-your-answer">
                  <span className="section-label">YOUR ANSWER</span>
                  <p>{item.yourAnswer || '(No answer provided)'}</p>
                </div>
                <div className="mock-ai-feedback">
                  <span className="section-label"><CheckCircle2 size={12} color="#2da96d" /> AI FEEDBACK</span>
                  <p>{item.feedback}</p>
                </div>
                <div className="mock-improvement">
                  <span className="section-label"><Lightbulb size={12} color="#ec7c45" /> IMPROVEMENT TIP</span>
                  <p>{item.improvement}</p>
                </div>
                {item.recommendedAnswer && (
                  <div className="mock-tip-box" style={{ background: '#f4f2ff', border: '1px solid #d4cff8' }}>
                    <BookOpen size={14} color="#6655ee" />
                    <span><strong>AI Model Recommended Answer: </strong>{item.recommendedAnswer}</span>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>

        {/* Actions */}
        <div className="mock-result-actions">
          <Button variant="nav" onClick={startNew} loading={loading}>
            <RefreshCw size={15} /> Retake Mock Interview (New Questions)
          </Button>
          <Button variant="outline" onClick={reset}>
            Change Role / Difficulty
          </Button>
        </div>
      </div>
    )
  }

  return null
}

export default MockInterview
