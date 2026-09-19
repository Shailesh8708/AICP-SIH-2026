import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Utensils, Calculator, Dumbbell, Stethoscope, ArrowLeft,
  Sparkles, CheckCircle2, ChevronRight, RefreshCw, Flame, HeartPulse, Scale, ShieldCheck
} from 'lucide-react'
import { GokuAvatar } from '../components/GokuAssistant/GokuAvatar'
import { ROUTES } from '../utils/constants'

export const HealthWellnessShowcase = () => {
  const location = useLocation()
  const path = location.pathname

  // Active tab derived from route or local state
  const getTabFromPath = () => {
    if (path.includes('calorie')) return 'calorie'
    if (path.includes('workout')) return 'workout'
    if (path.includes('health') || path.includes('symptom')) return 'health'
    return 'diet'
  }

  const [activeTab, setActiveTab] = useState(getTabFromPath)

  useEffect(() => {
    setActiveTab(getTabFromPath())
  }, [path])

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-amber-200">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-800 transition"
          >
            <ArrowLeft size={16} /> Back to AICP Portal
          </Link>
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-full px-4 py-1.5 shadow-sm">
            <GokuAvatar size="xs" animated={false} />
            <span className="text-xs font-semibold text-amber-900">
              Guided by <strong className="text-amber-600">Goku AI Navigator</strong>
            </span>
          </div>
        </div>

        {/* Feature Category Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-white border border-amber-200 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab('diet')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition ${
              activeTab === 'diet'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-amber-50'
            }`}
          >
            <Utensils size={18} /> Diet Plan
          </button>
          <button
            onClick={() => setActiveTab('calorie')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition ${
              activeTab === 'calorie'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-amber-50'
            }`}
          >
            <Calculator size={18} /> Calorie Calculator
          </button>
          <button
            onClick={() => setActiveTab('workout')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition ${
              activeTab === 'workout'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-amber-50'
            }`}
          >
            <Dumbbell size={18} /> Workout Plan
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition ${
              activeTab === 'health'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-amber-50'
            }`}
          >
            <Stethoscope size={18} /> Health Checker
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'diet' && <DietPlanModule />}
        {activeTab === 'calorie' && <CalorieCalculatorModule />}
        {activeTab === 'workout' && <WorkoutPlanModule />}
        {activeTab === 'health' && <HealthCheckerModule />}
      </div>
    </div>
  )
}

/* =========================================================================
   DIET PLAN MODULE
   ========================================================================= */
function DietPlanModule() {
  const [goal, setGoal] = useState('gain')

  const plans = {
    gain: {
      title: 'Weight Gain & Muscle Fuel Blueprint',
      subtitle: 'Engineered for caloric surplus, lean muscle synthesis, and sustained physical energy.',
      calories: '2,800 - 3,200 kcal/day',
      macros: { protein: '160g (25%)', carbs: '380g (55%)', fats: '75g (20%)' },
      meals: [
        { time: '07:30 AM', name: 'Power Breakfast', items: 'Oats with peanut butter, banana, whey protein, whole milk, and chia seeds.' },
        { time: '10:30 AM', name: 'Mid-Morning Fuel', items: 'Hard-boiled eggs, almonds, and Greek yogurt with honey.' },
        { time: '01:30 PM', name: 'High-Protein Lunch', items: 'Brown rice, grilled paneer/chicken breast, mixed lentils (dal), and steamed broccoli.' },
        { time: '05:00 PM', name: 'Pre-Workout Snack', items: 'Whole wheat toast with peanut butter and an apple.' },
        { time: '07:30 PM', name: 'Post-Workout Shake', items: 'Whey protein smoothie with berries, oats, and creatine.' },
        { time: '09:00 PM', name: 'Recovery Dinner', items: 'Roti / quinoa with sautéed tofu/salmon, sweet potatoes, and green salad.' },
      ],
    },
    loss: {
      title: 'Lean Definition & Fat Loss Blueprint',
      subtitle: 'Caloric deficit with high protein density to preserve lean muscle while promoting fat oxidation.',
      calories: '1,800 - 2,100 kcal/day',
      macros: { protein: '140g (35%)', carbs: '180g (40%)', fats: '55g (25%)' },
      meals: [
        { time: '08:00 AM', name: 'Lean Breakfast', items: 'Egg white scramble with spinach, tomatoes, and 1 slice sprouted grain toast.' },
        { time: '11:00 AM', name: 'Metabolism Snack', items: 'Green tea with handful of walnuts and fresh blueberries.' },
        { time: '01:30 PM', name: 'Macro-Controlled Lunch', items: 'Grilled chicken/tofu salad with cucumbers, olive oil, and quinoa bowl.' },
        { time: '05:00 PM', name: 'Energy Pick-Me-Up', items: 'Whey isolate shake with iced water and cinnamon.' },
        { time: '08:00 PM', name: 'Clean Dinner', items: 'Stir-fried vegetables with cottage cheese/fish and clear vegetable broth.' },
      ],
    },
    maintenance: {
      title: 'Balanced Vitality & Energy Maintenance',
      subtitle: 'Optimized for balanced vitality, sharp cognitive focus, and long-term metabolic health.',
      calories: '2,200 - 2,500 kcal/day',
      macros: { protein: '120g (25%)', carbs: '280g (50%)', fats: '65g (25%)' },
      meals: [
        { time: '08:00 AM', name: 'Wholesome Breakfast', items: 'Masala oats with vegetables, walnuts, and boiled eggs or sprouts.' },
        { time: '01:00 PM', name: 'Balanced Lunch', items: 'Multigrain roti, fresh curd, dal tadka, and seasonal stir-fry.' },
        { time: '05:00 PM', name: 'Evening Refresh', items: 'Roasted makhana (lotus seeds) and herbal tea.' },
        { time: '08:30 PM', name: 'Nourishing Dinner', items: 'Lentil soup with brown rice and roasted sweet potatoes.' },
      ],
    },
  }

  const current = plans[goal]

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-amber-200 shadow-md space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-amber-600 uppercase">AI Nutrition Blueprint</span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{current.title}</h2>
          <p className="text-sm text-slate-600 mt-1">{current.subtitle}</p>
        </div>
        <div className="flex gap-2 bg-amber-50 p-1.5 rounded-xl border border-amber-200">
          <button
            onClick={() => setGoal('gain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${goal === 'gain' ? 'bg-amber-600 text-white shadow' : 'text-slate-700 hover:bg-amber-100'}`}
          >
            Weight Gain
          </button>
          <button
            onClick={() => setGoal('loss')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${goal === 'loss' ? 'bg-amber-600 text-white shadow' : 'text-slate-700 hover:bg-amber-100'}`}
          >
            Weight Loss
          </button>
          <button
            onClick={() => setGoal('maintenance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${goal === 'maintenance' ? 'bg-amber-600 text-white shadow' : 'text-slate-700 hover:bg-amber-100'}`}
          >
            Maintenance
          </button>
        </div>
      </div>

      {/* Target Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-amber-50/70 p-4 rounded-xl border border-amber-200">
        <div>
          <span className="text-xs text-slate-500 font-medium">Daily Target</span>
          <p className="text-lg font-black text-amber-800">{current.calories}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium">Target Protein</span>
          <p className="text-lg font-black text-slate-800">{current.macros.protein}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium">Target Carbs</span>
          <p className="text-lg font-black text-slate-800">{current.macros.carbs}</p>
        </div>
        <div>
          <span className="text-xs text-slate-500 font-medium">Target Fats</span>
          <p className="text-lg font-black text-slate-800">{current.macros.fats}</p>
        </div>
      </div>

      {/* Meal Breakdown Timeline */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Utensils size={15} className="text-amber-600" /> Daily Meal Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {current.meals.map((meal, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 hover:border-amber-300 transition">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md">{meal.time}</span>
                <span className="text-xs font-bold text-slate-700">{meal.name}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{meal.items}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* =========================================================================
   CALORIE CALCULATOR MODULE
   ========================================================================= */
function CalorieCalculatorModule() {
  const [gender, setGender] = useState('male')
  const [age, setAge] = useState(21)
  const [weight, setWeight] = useState(68)
  const [height, setHeight] = useState(175)
  const [activity, setActivity] = useState('1.375')
  const [targetGoal, setTargetGoal] = useState('surplus')
  const [calculated, setCalculated] = useState(null)

  const calculateCalories = () => {
    // Mifflin-St Jeor Equation
    let bmr = 10 * weight + 6.25 * height - 5 * age
    bmr = gender === 'male' ? bmr + 5 : bmr - 161
    const tdee = Math.round(bmr * parseFloat(activity))

    let target = tdee
    if (targetGoal === 'surplus') target += 400 // weight gain
    if (targetGoal === 'deficit') target -= 450 // fat loss

    const proteinGrams = Math.round(weight * 2.0)
    const fatGrams = Math.round((target * 0.25) / 9)
    const carbGrams = Math.round((target - proteinGrams * 4 - fatGrams * 9) / 4)

    setCalculated({
      bmr: Math.round(bmr),
      tdee,
      target,
      protein: proteinGrams,
      carbs: Math.max(carbGrams, 50),
      fats: fatGrams,
    })
  }

  useEffect(() => {
    calculateCalories()
  }, [gender, age, weight, height, activity, targetGoal])

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-amber-200 shadow-md space-y-6">
      <div>
        <span className="text-xs font-bold tracking-wider text-amber-600 uppercase">Interactive Energy Engine</span>
        <h2 className="text-2xl font-black text-slate-900 mt-1">Calorie & Macro Calculator</h2>
        <p className="text-sm text-slate-600 mt-1">Determine your Basal Metabolic Rate (BMR) and exact daily caloric intake.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <div className="space-y-4 bg-amber-50/50 p-5 rounded-2xl border border-amber-200">
          <div className="flex gap-4">
            <label className="flex-1 text-xs font-bold text-slate-700">
              Gender
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
            <label className="flex-1 text-xs font-bold text-slate-700">
              Age (Years)
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </label>
          </div>

          <div className="flex gap-4">
            <label className="flex-1 text-xs font-bold text-slate-700">
              Weight (kg)
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </label>
            <label className="flex-1 text-xs font-bold text-slate-700">
              Height (cm)
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </label>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Activity Level</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
            >
              <option value="1.2">Sedentary (Little or no exercise)</option>
              <option value="1.375">Lightly Active (Exercise 1-3 days/week)</option>
              <option value="1.55">Moderately Active (Exercise 3-5 days/week)</option>
              <option value="1.725">Very Active (Hard exercise 6-7 days/week)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">Target Goal</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setTargetGoal('surplus')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition ${targetGoal === 'surplus' ? 'bg-amber-600 text-white shadow' : 'bg-white border text-slate-700'}`}
              >
                + Weight Gain
              </button>
              <button
                type="button"
                onClick={() => setTargetGoal('maintain')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition ${targetGoal === 'maintain' ? 'bg-amber-600 text-white shadow' : 'bg-white border text-slate-700'}`}
              >
                Maintain
              </button>
              <button
                type="button"
                onClick={() => setTargetGoal('deficit')}
                className={`py-2 px-2 rounded-lg text-xs font-bold transition ${targetGoal === 'deficit' ? 'bg-amber-600 text-white shadow' : 'bg-white border text-slate-700'}`}
              >
                - Fat Loss
              </button>
            </div>
          </div>
        </div>

        {/* Results Output */}
        {calculated && (
          <div className="flex flex-col justify-between p-6 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white rounded-2xl shadow-lg">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame size={20} className="text-yellow-200" />
                <span className="text-xs uppercase tracking-widest font-bold text-yellow-100">Recommended Daily Intake</span>
              </div>
              <div className="text-4xl font-black">{calculated.target} <span className="text-xl font-normal">kcal/day</span></div>
              <p className="text-xs text-amber-100 mt-1">
                TDEE: {calculated.tdee} kcal • Basal Metabolic Rate: {calculated.bmr} kcal
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4 bg-white/10 p-3 rounded-xl backdrop-blur-sm">
              <div className="text-center">
                <span className="text-[11px] text-yellow-200 uppercase font-semibold">Protein</span>
                <p className="text-lg font-bold">{calculated.protein}g</p>
              </div>
              <div className="text-center border-x border-white/20">
                <span className="text-[11px] text-yellow-200 uppercase font-semibold">Carbs</span>
                <p className="text-lg font-bold">{calculated.carbs}g</p>
              </div>
              <div className="text-center">
                <span className="text-[11px] text-yellow-200 uppercase font-semibold">Fats</span>
                <p className="text-lg font-bold">{calculated.fats}g</p>
              </div>
            </div>

            <p className="text-xs text-amber-100 leading-relaxed">
              💡 <strong>Goku&apos;s Tip:</strong> Consume whole foods with high bioavailability. Drink at least 3 to 4 liters of water daily!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* =========================================================================
   WORKOUT PLAN MODULE
   ========================================================================= */
function WorkoutPlanModule() {
  const [split, setSplit] = useState('ppl')

  const workouts = {
    ppl: {
      name: 'Push / Pull / Legs (Hypertrophy Split)',
      frequency: '3 to 6 days/week',
      description: 'The golden standard split separating pushing, pulling, and leg muscles for optimal muscle protein synthesis.',
      days: [
        { day: 'Day 1: Push (Chest, Shoulders, Triceps)', exercises: ['Barbell Incline Bench: 4 sets x 8-10 reps', 'Dumbbell Shoulder Press: 3 sets x 10-12 reps', 'Cable Chest Flyes: 3 sets x 12-15 reps', 'Tricep Rope Pushdowns: 4 sets x 12 reps'] },
        { day: 'Day 2: Pull (Back, Rear Delts, Biceps)', exercises: ['Deadlifts / Rack Pulls: 3 sets x 6-8 reps', 'Lat Pulldowns / Pullups: 4 sets x 8-10 reps', 'Chest-Supported Row: 3 sets x 10-12 reps', 'Barbell Bicep Curls: 4 sets x 10-12 reps'] },
        { day: 'Day 3: Legs & Core (Quads, Hamstrings, Calves)', exercises: ['Barbell Back Squats: 4 sets x 8 reps', 'Romanian Deadlifts: 3 sets x 10-12 reps', 'Leg Press: 3 sets x 12-15 reps', 'Hanging Knee Raises: 3 sets x 15 reps'] },
      ],
    },
    fullbody: {
      name: 'Full Body 3-Day Foundation',
      frequency: '3 days/week (e.g. Mon / Wed / Fri)',
      description: 'Maximizes frequency for each muscle group while providing plenty of recovery days for busy schedules.',
      days: [
        { day: 'Workout A (Heavy Compound)', exercises: ['Barbell Squats: 3 sets x 5 reps', 'Bench Press: 3 sets x 5 reps', 'Barbell Bent-Over Row: 3 sets x 8 reps', 'Plank: 3 sets x 60 sec'] },
        { day: 'Workout B (Hypertrophy)', exercises: ['Overhead Press: 3 sets x 8 reps', 'Romanian Deadlifts: 3 sets x 10 reps', 'Pull-Ups / Lat Pulldown: 3 sets x 10 reps', 'Dumbbell Lateral Raises: 3 sets x 15 reps'] },
      ],
    },
  }

  const cur = workouts[split]

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-amber-200 shadow-md space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold tracking-wider text-amber-600 uppercase">Structured Training System</span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">{cur.name}</h2>
          <p className="text-sm text-slate-600 mt-1">{cur.description}</p>
        </div>
        <div className="flex gap-2 bg-amber-50 p-1.5 rounded-xl border border-amber-200">
          <button
            onClick={() => setSplit('ppl')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${split === 'ppl' ? 'bg-amber-600 text-white shadow' : 'text-slate-700 hover:bg-amber-100'}`}
          >
            Push Pull Legs
          </button>
          <button
            onClick={() => setSplit('fullbody')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${split === 'fullbody' ? 'bg-amber-600 text-white shadow' : 'text-slate-700 hover:bg-amber-100'}`}
          >
            Full Body 3x
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {cur.days.map((d, i) => (
          <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
              <Dumbbell size={16} className="text-amber-600" /> {d.day}
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              {d.exercises.map((ex, exIdx) => (
                <li key={exIdx} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  <span>{ex}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

/* =========================================================================
   HEALTH & SYMPTOM CHECKER MODULE
   ========================================================================= */
function HealthCheckerModule() {
  const [selectedSymptoms, setSelectedSymptoms] = useState(['fatigue'])

  const symptomsList = [
    { id: 'fatigue', label: 'Persistent Fatigue / Low Energy', advice: 'Ensure 7-8 hours sleep, stay hydrated, and check vitamin D/B12 or iron levels.' },
    { id: 'headache', label: 'Tension / Screen Headache', advice: 'Take frequent 20-20-20 screen breaks, reduce eye strain, and stay hydrated.' },
    { id: 'stress', label: 'Academic / Job Search Stress', advice: 'Practice 4-7-8 breathing drills, take walks, and utilize campus mental health resources.' },
    { id: 'sore_throat', label: 'Mild Sore Throat / Cough', advice: 'Gargle with warm salt water, drink warm herbal tea with honey, and monitor temperature.' },
    { id: 'digestive', label: 'Bloating / Acid Reflux', advice: 'Eat smaller meals, avoid sleeping right after eating, and increase fiber gradually.' },
  ]

  const toggleSymptom = (id) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-amber-200 shadow-md space-y-6">
      <div>
        <span className="text-xs font-bold tracking-wider text-amber-600 uppercase">Self-Care & Triage Check</span>
        <h2 className="text-2xl font-black text-slate-900 mt-1">Health & Symptom Checker</h2>
        <p className="text-sm text-slate-600 mt-1">Select any current symptoms for personalized wellness guidance and self-care tips.</p>
      </div>

      {/* Symptom Selection Chips */}
      <div>
        <span className="text-xs font-bold text-slate-700 uppercase">Select Indicators:</span>
        <div className="flex flex-wrap gap-2 mt-2">
          {symptomsList.map((s) => {
            const active = selectedSymptoms.includes(s.id)
            return (
              <button
                key={s.id}
                onClick={() => toggleSymptom(s.id)}
                className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  active
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <HeartPulse size={14} /> {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Wellness Recommendations */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI Wellness Guidance:</h4>
        <div className="space-y-2.5">
          {selectedSymptoms.map((id) => {
            const item = symptomsList.find((s) => s.id === id)
            if (!item) return null
            return (
              <div key={id} className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 flex items-start gap-3">
                <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-xs text-slate-900">{item.label}</strong>
                  <p className="text-xs text-slate-600 mt-0.5">{item.advice}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Medical Disclaimer */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
        <ShieldCheck size={16} className="text-slate-400 shrink-0" />
        <span>
          <strong>Disclaimer:</strong> This tool provides informational wellness guidance only and is not a substitute for professional medical diagnosis or treatment.
        </span>
      </div>
    </div>
  )
}

