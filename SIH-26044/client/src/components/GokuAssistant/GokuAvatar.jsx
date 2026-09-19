import React from 'react'

export const GokuAvatar = ({ size = 'md', animated = true, status = 'online', className = '' }) => {
  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-9 h-9',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }

  const dim = sizeMap[size] || sizeMap.md

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${dim} ${className}`}>
      {/* Outer Cyber Energy Pulse */}
      {animated && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-300 opacity-75 blur-sm animate-pulse" />
      )}

      {/* Main Avatar Container */}
      <div className="relative w-full h-full rounded-full p-[2px] bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 shadow-lg flex items-center justify-center overflow-hidden">
        {/* SVG AI Goku Icon */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full rounded-full bg-slate-950"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cyber background grid pattern */}
          <defs>
            <linearGradient id="gokuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="auraGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Dark AI Core */}
          <circle cx="50" cy="50" r="48" fill="#090d16" />

          {/* AI Neural Circuit Lines */}
          <path d="M15 50 H30 M70 50 H85 M50 15 V28 M50 72 V85" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="3 3" />
          <circle cx="30" cy="50" r="2.5" fill="#f59e0b" />
          <circle cx="70" cy="50" r="2.5" fill="#f59e0b" />
          <circle cx="50" cy="28" r="2.5" fill="#f59e0b" />
          <circle cx="50" cy="72" r="2.5" fill="#f59e0b" />

          {/* Saiyan Spiky Cyber Hair Silhouette (Goku Iconic Hairstyle) */}
          <path
            d="M50 12 
               C53 5, 59 10, 56 19 
               C65 11, 74 19, 68 28 
               C78 22, 85 33, 76 40 
               C83 38, 85 49, 78 54 
               C74 57, 70 55, 68 53
               C72 65, 55 60, 50 60
               C45 60, 28 65, 32 53
               C30 55, 26 57, 22 54
               C15 49, 17 38, 24 40
               C15 33, 22 22, 32 28
               C26 19, 35 11, 44 19
               C41 10, 47 5, 50 12 Z"
            fill="url(#gokuGrad)"
            filter="url(#glow)"
          />

          {/* Inner Highlight Strands */}
          <path
            d="M48 18 Q 52 26 50 35 M36 28 Q 44 32 46 42 M64 28 Q 56 32 54 42 M28 42 Q 36 44 38 50 M72 42 Q 64 44 62 50"
            stroke="#fef08a"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Futuristic Face Silhouette */}
          <path
            d="M36 46 C36 46, 38 68, 50 75 C62 68, 64 46, 64 46 Z"
            fill="#1e293b"
            stroke="#f59e0b"
            strokeWidth="1.5"
          />

          {/* Cyber Visor / AI Eyes */}
          <path
            d="M40 52 L48 54 L44 57 L39 54 Z"
            fill="#38bdf8"
            filter="url(#glow)"
          />
          <path
            d="M60 52 L52 54 L56 57 L61 54 Z"
            fill="#38bdf8"
            filter="url(#glow)"
          />

          {/* Confident Goku Grin / Scouter Microphone Line */}
          <path
            d="M45 64 Q50 67 55 64"
            stroke="#f59e0b"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Cybernetic Saiyan Scouter / Headset on ear */}
          <rect x="26" y="48" width="6" height="10" rx="3" fill="#ef4444" />
          <line x1="32" y1="53" x2="39" y2="53" stroke="#ef4444" strokeWidth="1.5" />
          <circle cx="29" cy="53" r="1.5" fill="#fef2f2" />

          {/* Kanji / AI Symbol on chest / collar */}
          <path
            d="M45 80 L55 80 M50 77 L50 87 M44 87 L56 87"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Online Status Beacon */}
      {status === 'online' && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm">
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
        </span>
      )}
    </div>
  )
}

