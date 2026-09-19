import React, { useState } from "react";
import { AICP_LOGO_DATA_URI } from "../assets/logoDataUri";

export const AICPLogoSVG = ({ size = 36, className = "" }) => (
  <svg
    viewBox="0 0 280 280"
    width={size}
    height={size}
    className={`aicp-logo-svg ${className}`.trim()}
    style={{
      display: "block",
      flexShrink: 0,
      width: "100%",
      height: "100%",
      borderRadius: "22%",
    }}
    role="img"
    aria-label="AICP Logo"
  >
    <defs>
      <linearGradient id="aicpSvgBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#204d80" />
        <stop offset="40%" stopColor="#163c68" />
        <stop offset="100%" stopColor="#0a223f" />
      </linearGradient>
      <radialGradient id="aicpSvgGlow" cx="20%" cy="18%" r="65%">
        <stop offset="0%" stopColor="#4288d0" stopOpacity="0.45" />
        <stop offset="60%" stopColor="#1c4e85" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#0a223f" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="280" height="280" rx="62" ry="62" fill="url(#aicpSvgBg)" />
    <rect width="280" height="280" rx="62" ry="62" fill="url(#aicpSvgGlow)" />
    <line
      x1="137.5"
      y1="68"
      x2="137.5"
      y2="206"
      stroke="#091a2e"
      strokeWidth="1.4"
      strokeLinecap="round"
      opacity="0.9"
    />
    <polygon points="137.5,75 137.5,123 93,204 58,204" fill="#f57c1f" />
    <polygon points="137.5,75 137.5,123 182,204 217,204" fill="#2e965b" />
    <line
      x1="227"
      y1="147"
      x2="234"
      y2="196"
      stroke="#f57c1f"
      strokeWidth="4.2"
      strokeLinecap="round"
    />
    <circle cx="234" cy="200" r="8" fill="#f57c1f" />
    <rect x="44" y="141" width="187" height="15" rx="7.5" fill="#ffffff" />
  </svg>
);

export const AICPLogo = ({
  compact = false,
  showBadge = true,
  size,
  showText = true,
  className = "",
}) => {
  const [imgError, setImgError] = useState(false);
  const markSize = size ? size : compact ? 54 : 72;

  return (
    <span
      className={`aicp-logo ${compact ? "compact" : ""} warm-logo ${className}`.trim()}
    >
      <span
        className="aicp-logo-mark warm-mark"
        style={{
          width: `${markSize}px`,
          height: `${markSize}px`,
          minWidth: `${markSize}px`,
          minHeight: `${markSize}px`,
        }}
        role="img"
        aria-label="AICP Official Logo"
      >
        {!imgError ? (
          <img
            src={AICP_LOGO_DATA_URI}
            alt="AICP"
            className="aicp-logo-img"
            width={markSize}
            height={markSize}
            loading="eager"
            onError={() => setImgError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : (
          <AICPLogoSVG size={markSize} />
        )}
      </span>
      {showText && (
        <span className="aicp-logo-type">
          <strong className="warm-brand-text">
            AICP<span className="warm-dot">.</span>
          </strong>
          {showBadge && (
            <span className="aicp-official-badge">
              <span className="aicp-official-dot" />
              <span className="aicp-official-label">Official</span>
            </span>
          )}
          {!compact && (
            <small className="warm-sub-text">
              CAREER INTELLIGENCE &amp; TALENT PLATFORM
            </small>
          )}
        </span>
      )}
    </span>
  );
};
