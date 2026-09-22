import React from "react"

interface PixBoxLogoProps {
  size?: number
  showText?: boolean
  className?: string
  textClassName?: string
}

export function PixBoxIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Main Box Gradient */}
        <linearGradient id="pixbox-grad-main" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Top Face Gradient */}
        <linearGradient id="pixbox-grad-top" x1="8" y1="8" x2="40" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A5B4FC" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>

        {/* Right Face Gradient */}
        <linearGradient id="pixbox-grad-right" x1="24" y1="20" x2="40" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#3730A3" />
        </linearGradient>

        {/* Left Face Gradient */}
        <linearGradient id="pixbox-grad-left" x1="8" y1="20" x2="24" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>

        {/* Pixel Glow Effect */}
        <filter id="pixbox-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Shadow background */}
      <ellipse cx="24" cy="42" rx="14" ry="3.5" fill="#0F172A" fillOpacity="0.15" />

      {/* 3D Box - Left Face */}
      <path
        d="M8 18L24 26V40L8 32V18Z"
        fill="url(#pixbox-grad-left)"
      />

      {/* 3D Box - Right Face */}
      <path
        d="M24 26L40 18V32L24 40V26Z"
        fill="url(#pixbox-grad-right)"
      />

      {/* 3D Box - Top Face */}
      <path
        d="M24 8L40 16L24 24L8 16L24 8Z"
        fill="url(#pixbox-grad-top)"
      />

      {/* Front Center Lock / Vault Seam */}
      <path
        d="M24 26V36"
        stroke="#C7D2FE"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />

      {/* Floating Pixel 1 (Top Right) */}
      <rect
        x="34"
        y="6"
        width="5"
        height="5"
        rx="1.2"
        fill="#38BDF8"
        filter="url(#pixbox-glow)"
      />

      {/* Floating Pixel 2 (Top Left Small) */}
      <rect
        x="10"
        y="8"
        width="3.5"
        height="3.5"
        rx="0.8"
        fill="#C084FC"
        filter="url(#pixbox-glow)"
      />

      {/* Floating Pixel 3 (Center Keyhole Pixel) */}
      <rect
        x="22"
        y="14"
        width="4"
        height="4"
        rx="1"
        fill="#FFFFFF"
      />
    </svg>
  )
}

export function PixBoxLogo({
  size = 36,
  showText = true,
  className = "",
  textClassName = "",
}: PixBoxLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <PixBoxIcon size={size} />
      </div>

      {showText && (
        <div className={`flex items-baseline tracking-tight ${textClassName}`}>
          <span className="font-extrabold text-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
            Pix
          </span>
          <span className="font-extrabold text-2xl text-slate-900 dark:text-white">
            Box
          </span>
        </div>
      )}
    </div>
  )
}
