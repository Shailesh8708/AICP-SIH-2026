import React from 'react'

/**
 * High-fidelity, official vector logos for AICP MNC & Learning Partners.
 * Supports both full horizontal brand lockups (for cards) and compact icon marks (for buttons/chips).
 */
export const CompanyLogo = ({
  company = '',
  size = 48,
  variant = 'full', // 'full' | 'icon'
  className = '',
  style = {},
  showName = false,
}) => {
  const norm = (String(company || '')).toLowerCase().trim()
  const isIcon = variant === 'icon'

  // Dimensions helper
  const s = typeof size === 'number' ? `${size}px` : size

  const getLogoContent = () => {
    // 1. NVIDIA / NVIDIA DLI
    if (norm.includes('nvidia')) {
      if (isIcon) {
        return (
          <svg
            viewBox="0 0 16 16"
            width={s}
            height={s}
            fill="#76B900"
            aria-label="NVIDIA"
            style={{ display: 'block' }}
          >
            {/* Official NVIDIA Claw Spiral */}
            <path d="M1.635 7.146S3.08 5.012 5.97 4.791v-.774C2.77 4.273 0 6.983 0 6.983s1.57 4.536 5.97 4.952v-.824c-3.23-.406-4.335-3.965-4.335-3.965M5.97 9.475v.753c-2.44-.435-3.118-2.972-3.118-2.972S4.023 5.958 5.97 5.747v.828h-.004c-1.021-.123-1.82.83-1.82.83s.448 1.607 1.824 2.07M6 2l-.03 2.017A7 7 0 0 1 6.252 4c3.637-.123 6.007 2.983 6.007 2.983s-2.722 3.31-5.557 3.31q-.39-.002-.732-.065v.883q.292.039.61.04c2.638 0 4.546-1.348 6.394-2.943.307.246 1.561.842 1.819 1.104-1.757 1.47-5.852 2.657-8.173 2.657a7 7 0 0 1-.65-.034V14H16l.03-12zm-.03 3.747v-.956a6 6 0 0 1 .282-.015c2.616-.082 4.332 2.248 4.332 2.248S8.73 9.598 6.743 9.598c-.286 0-.542-.046-.773-.123v-2.9c1.018.123 1.223.572 1.835 1.593L9.167 7.02s-.994-1.304-2.67-1.304a5 5 0 0 0-.527.031" />
          </svg>
        )
      }
      return (
        <svg
          viewBox="0 0 88 28"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.42)}px` : '28px'}
          fill="none"
          aria-label="NVIDIA"
          style={{ display: 'block' }}
        >
          {/* Official NVIDIA Green Claw Spiral */}
          <g transform="translate(1, 1) scale(1.62)" fill="#76B900">
            <path d="M1.635 7.146S3.08 5.012 5.97 4.791v-.774C2.77 4.273 0 6.983 0 6.983s1.57 4.536 5.97 4.952v-.824c-3.23-.406-4.335-3.965-4.335-3.965M5.97 9.475v.753c-2.44-.435-3.118-2.972-3.118-2.972S4.023 5.958 5.97 5.747v.828h-.004c-1.021-.123-1.82.83-1.82.83s.448 1.607 1.824 2.07M6 2l-.03 2.017A7 7 0 0 1 6.252 4c3.637-.123 6.007 2.983 6.007 2.983s-2.722 3.31-5.557 3.31q-.39-.002-.732-.065v.883q.292.039.61.04c2.638 0 4.546-1.348 6.394-2.943.307.246 1.561.842 1.819 1.104-1.757 1.47-5.852 2.657-8.173 2.657a7 7 0 0 1-.65-.034V14H16l.03-12zm-.03 3.747v-.956a6 6 0 0 1 .282-.015c2.616-.082 4.332 2.248 4.332 2.248S8.73 9.598 6.743 9.598c-.286 0-.542-.046-.773-.123v-2.9c1.018.123 1.223.572 1.835 1.593L9.167 7.02s-.994-1.304-2.67-1.304a5 5 0 0 0-.527.031" />
          </g>
          {/* Bold Official NVIDIA Wordmark */}
          <text
            x="32"
            y="19"
            fontSize="15"
            fontWeight="900"
            fill="#111827"
            fontFamily="Arial, Helvetica, sans-serif"
            letterSpacing="1.2"
          >
            NVIDIA
          </text>
        </svg>
      )
    }

    // 2. TCS / TCS iON
    if (norm.includes('tcs') || norm.includes('ion')) {
      if (isIcon) {
        return (
          <svg
            viewBox="0 0 32 26"
            width={s}
            height={typeof size === 'number' ? `${Math.round(size * 0.82)}px` : s}
            fill="none"
            aria-label="TCS iON"
            style={{ display: 'block' }}
          >
            <rect width="32" height="26" rx="5" fill="#002855" />
            <text x="16" y="11" textAnchor="middle" fontSize="9" fontWeight="900" fill="#FFFFFF" fontFamily="system-ui, sans-serif">
              tcs
            </text>
            <text x="16" y="21" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#00B4D8" fontFamily="system-ui, sans-serif">
              i<tspan fill="#FF7900" fontWeight="900">ON</tspan>
            </text>
          </svg>
        )
      }
      return (
        <svg
          viewBox="0 0 88 28"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.38)}px` : '28px'}
          fill="none"
          aria-label="TCS iON"
          style={{ display: 'block' }}
        >
          <rect width="88" height="28" rx="6" fill="#002855" />
          <text
            x="6"
            y="19"
            fontSize="15"
            fontWeight="900"
            fill="#FFFFFF"
            fontFamily="system-ui, sans-serif"
            letterSpacing="0.5"
          >
            tcs
          </text>
          <line x1="34" y1="5" x2="34" y2="23" stroke="#2A5C99" strokeWidth="1.5" />
          <text
            x="39"
            y="19"
            fontSize="15"
            fontWeight="900"
            fill="#38BDF8"
            fontFamily="system-ui, sans-serif"
          >
            i<tspan fill="#FF7900" fontWeight="900">ON</tspan>
          </text>
        </svg>
      )
    }

    // 3. IBM / IBM SkillsBuild
    if (norm.includes('ibm')) {
      return (
        <svg
          viewBox="0 0 1000 401.15"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.40)}px` : '32px'}
          fill="#0F62FE"
          aria-label="IBM"
          style={{ display: 'block' }}
        >
          <g id="I">
            <rect y="373.17" width="194.43" height="27.932" />
            <rect y="319.83" width="194.43" height="27.932" />
            <rect x="55.468" y="266.54" width="83.399" height="27.932" />
            <rect x="55.468" y="213.25" width="83.399" height="27.932" />
            <rect x="55.468" y="159.96" width="83.399" height="27.932" />
            <rect x="55.468" y="106.58" width="83.399" height="27.932" />
            <rect y="53.288" width="194.43" height="27.932" />
            <rect width="194.43" height="27.932" />
          </g>
          <g id="B">
            <path d="m222.17 400.85 207.11 0.297c27.734 0 52.793-10.697 71.513-27.932h-278.62z" />
            <path d="m222.17 347.76h299.03c5.051-8.617 8.815-18.027 11.094-27.932h-310.12z" />
            <rect x="277.73" y="266.54" width="83.3" height="27.932" />
            <path d="m444.43 266.54v27.932h90.927c0-9.608-1.288-19.017-3.764-27.932z" />
            <path d="m497.92 213.25h-220.19v27.932h243.46c-6.34-10.698-14.165-20.107-23.277-27.932z" />
            <path d="m277.73 159.96v27.932h220.19c9.311-7.825 17.135-17.235 23.277-27.932z" />
            <rect x="277.73" y="106.58" width="83.3" height="27.932" />
            <path d="m444.43 134.51h87.163c2.476-8.914 3.764-18.324 3.764-27.932h-90.927z" />
            <path d="m521.2 53.288h-299.03v27.932h310.12c-2.575-9.905-6.339-19.314-11.093-27.932z" />
            <path d="m429.28 0h-207.11v27.932h278.53c-18.621-17.235-43.878-27.932-71.414-27.932z" />
          </g>
          <g id="M">
            <polygon points="555.57 81.22 742.67 81.22 733.06 53.288 555.57 53.288" />
            <polygon points="555.57 27.932 724.25 27.932 714.64 0 555.57 0" />
            <polygon points="861.03 401.17 861.03 373.24 1000 373.24 1000 401.17" />
            <polygon points="861.03 347.76 861.03 319.83 1000 319.83 1000 347.76" />
            <polygon points="777.73 182.54 769.91 159.96 694.43 159.96 611.03 159.96 611.03 187.89 694.43 187.89 694.43 162.24 703.25 187.89 852.22 187.89 861.03 162.24 861.03 187.89 944.43 187.89 944.43 159.96 861.03 159.96 785.56 159.96" />
            <polygon points="944.43 106.58 803.98 106.58 794.37 134.51 944.43 134.51" />
            <polygon points="1000 27.932 1000 0 840.93 0 831.32 27.932" />
            <polygon points="768.13 373.22 777.73 400.85 787.34 373.22" />
            <polygon points="749.5 319.83 759.31 347.76 796.16 347.76 806.06 319.83" />
            <polygon points="730.78 266.54 740.59 294.47 814.88 294.47 824.68 266.54" />
            <polygon points="721.97 241.18 833.6 241.18 843.11 213.25 712.36 213.25" />
            <polygon points="611.03 134.51 761.09 134.51 751.49 106.58 611.03 106.58" />
            <polygon points="1000 53.288 822.4 53.288 812.9 81.22 1000 81.22" />
            <rect x="555.57" y="373.22" width="138.97" height="27.932" />
            <rect x="555.57" y="319.83" width="138.97" height="27.932" />
            <rect x="611.03" y="266.54" width="83.399" height="27.932" />
            <rect x="611.03" y="213.25" width="83.399" height="27.932" />
            <rect x="861.03" y="213.25" width="83.399" height="27.932" />
            <rect x="861.03" y="266.54" width="83.399" height="27.932" />
          </g>
        </svg>
      )
    }

    // 4. Cisco / Cisco Networking Academy / NetAcad
    if (norm.includes('cisco') || norm.includes('netacad')) {
      return (
        <svg
          viewBox="0 0 46 26"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.65)}px` : s}
          fill="#049fd9"
          aria-label="Cisco"
          style={{ display: 'block' }}
        >
          {/* 9 bold bridge wave bars */}
          <rect x="3" y="9" width="2.8" height="8" rx="1.4" />
          <rect x="7.4" y="5" width="2.8" height="12" rx="1.4" />
          <rect x="11.8" y="1" width="2.8" height="16" rx="1.4" />
          <rect x="16.2" y="5" width="2.8" height="12" rx="1.4" />
          <rect x="20.6" y="9" width="2.8" height="8" rx="1.4" />
          <rect x="25" y="5" width="2.8" height="12" rx="1.4" />
          <rect x="29.4" y="1" width="2.8" height="16" rx="1.4" />
          <rect x="33.8" y="5" width="2.8" height="12" rx="1.4" />
          <rect x="38.2" y="9" width="2.8" height="8" rx="1.4" />
          <text
            x="22"
            y="25"
            textAnchor="middle"
            fontSize="8"
            fontWeight="900"
            fill="#049fd9"
            letterSpacing="1.5"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            CISCO
          </text>
        </svg>
      )
    }

    // 5. Coursera
    if (norm.includes('coursera')) {
      if (isIcon) {
        return (
          <svg
            viewBox="0 0 28 28"
            width={s}
            height={s}
            fill="none"
            aria-label="Coursera"
            style={{ display: 'block' }}
          >
            <path
              d="M14 2.5C7.65 2.5 2.5 7.65 2.5 14S7.65 25.5 14 25.5c4.95 0 9.2-3.1 10.9-7.5l-4.5-1.95c-1.15 2.85-3.8 4.75-6.4 4.75-4.05 0-7.3-3.25-7.3-7.3s3.25-7.3 7.3-7.3c2.6 0 5.25 1.9 6.4 4.75l4.5-1.95C23.2 5.6 18.95 2.5 14 2.5z"
              fill="#0056D2"
            />
          </svg>
        )
      }
      return (
        <svg
          viewBox="0 0 94 28"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.36)}px` : '28px'}
          fill="none"
          aria-label="Coursera"
          style={{ display: 'block' }}
        >
          <path
            d="M14 2C7.37 2 2 7.37 2 14s5.37 12 12 12c5.15 0 9.58-3.23 11.35-7.82l-4.68-2.03C19.47 19.12 16.71 21.1 14 21.1c-3.92 0-7.1-3.18-7.1-7.1s3.18-7.1 7.1-7.1c2.71 0 5.47 1.98 6.67 4.95l4.68-2.03C23.58 5.23 19.15 2 14 2z"
            fill="#0056D2"
          />
          <text
            x="32"
            y="19"
            fontSize="15"
            fontWeight="800"
            fill="#0056D2"
            fontFamily="Arial, Helvetica, sans-serif"
            letterSpacing="0.5"
          >
            coursera
          </text>
        </svg>
      )
    }

    // 6. Oracle / Oracle University
    if (norm.includes('oracle')) {
      return (
        <svg
          viewBox="0 0 64 26"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.48)}px` : s}
          fill="none"
          aria-label="Oracle"
          style={{ display: 'block' }}
        >
          <rect x="2" y="2" width="60" height="22" rx="11" fill="#C74634" />
          <rect x="8" y="6" width="48" height="14" rx="7" fill="#FFFFFF" />
          <text
            x="32"
            y="16.5"
            textAnchor="middle"
            fontSize="9"
            fontWeight="900"
            fill="#C74634"
            fontFamily="Arial, Helvetica, sans-serif"
            letterSpacing="1.2"
          >
            ORACLE
          </text>
        </svg>
      )
    }

    // 7. Microsoft / Microsoft Learn
    if (norm.includes('microsoft') || norm.includes('azure')) {
      if (isIcon) {
        return (
          <svg
            viewBox="0 0 26 26"
            width={s}
            height={s}
            fill="none"
            aria-label="Microsoft"
            style={{ display: 'block' }}
          >
            <rect x="1.5" y="1.5" width="10.8" height="10.8" fill="#F25022" rx="1" />
            <rect x="13.7" y="1.5" width="10.8" height="10.8" fill="#7FBA00" rx="1" />
            <rect x="1.5" y="13.7" width="10.8" height="10.8" fill="#00A4EF" rx="1" />
            <rect x="13.7" y="13.7" width="10.8" height="10.8" fill="#FFB900" rx="1" />
          </svg>
        )
      }
      return (
        <svg
          viewBox="0 0 96 28"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.36)}px` : '28px'}
          fill="none"
          aria-label="Microsoft"
          style={{ display: 'block' }}
        >
          <rect x="2" y="3" width="10" height="10" fill="#F25022" rx="0.5" />
          <rect x="13.5" y="3" width="10" height="10" fill="#7FBA00" rx="0.5" />
          <rect x="2" y="14.5" width="10" height="10" fill="#00A4EF" rx="0.5" />
          <rect x="13.5" y="14.5" width="10" height="10" fill="#FFB900" rx="0.5" />
          <text
            x="30"
            y="19"
            fontSize="14"
            fontWeight="700"
            fill="#4F4F4F"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="0.2"
          >
            Microsoft
          </text>
        </svg>
      )
    }

    // 8. AWS / Amazon Web Services / Skill Builder
    if (norm.includes('aws') || norm.includes('amazon')) {
      return (
        <svg
          viewBox="0 0 48 30"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.65)}px` : s}
          fill="none"
          aria-label="AWS"
          style={{ display: 'block' }}
        >
          <text
            x="24"
            y="17"
            textAnchor="middle"
            fontSize="17"
            fontWeight="900"
            fill="#232F3E"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-0.5"
          >
            aws
          </text>
          <path
            d="M8 21.5c8 5 24 5 32 0"
            stroke="#FF9900"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M37 19.5l4.5 4-2 4"
            fill="#FF9900"
          />
        </svg>
      )
    }

    // 9. Google Cloud / Google / GCP / Skills Boost
    if (norm.includes('google') || norm.includes('gcp')) {
      if (isIcon) {
        return (
          <svg
            viewBox="0 0 30 26"
            width={s}
            height={s}
            fill="none"
            aria-label="Google Cloud"
            style={{ display: 'block' }}
          >
            <path
              d="M23.5 12.5C22.6 8.5 19 5.5 14.8 5.5 11.2 5.5 8.2 7.5 6.6 10.5 2.9 10.9 0 14 0 17.8c0 4.2 3.4 7.6 7.6 7.6H24c3.3 0 6-2.7 6-6 0-3.1-2.4-5.6-5.5-5.9z"
              fill="#4285F4"
            />
            <circle cx="15" cy="15.5" r="4.2" fill="#FBBC05" />
            <path d="M15 19.7A4.2 4.2 0 0 0 19.2 15.5H10.8A4.2 4.2 0 0 0 15 19.7z" fill="#34A853" />
            <path d="M10.8 15.5a4.2 4.2 0 0 1 4.2-4.2v8.4a4.2 4.2 0 0 1-4.2-4.2z" fill="#EA4335" />
          </svg>
        )
      }
      return (
        <svg
          viewBox="0 0 108 28"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.32)}px` : '28px'}
          fill="none"
          aria-label="Google Cloud"
          style={{ display: 'block' }}
        >
          <g transform="translate(1, 1) scale(0.95)">
            <path
              d="M23.5 12.5C22.6 8.5 19 5.5 14.8 5.5 11.2 5.5 8.2 7.5 6.6 10.5 2.9 10.9 0 14 0 17.8c0 4.2 3.4 7.6 7.6 7.6H24c3.3 0 6-2.7 6-6 0-3.1-2.4-5.6-5.5-5.9z"
              fill="#4285F4"
            />
            <circle cx="15" cy="15.5" r="4.2" fill="#FBBC05" />
            <path d="M15 19.7A4.2 4.2 0 0 0 19.2 15.5H10.8A4.2 4.2 0 0 0 15 19.7z" fill="#34A853" />
            <path d="M10.8 15.5a4.2 4.2 0 0 1 4.2-4.2v8.4a4.2 4.2 0 0 1-4.2-4.2z" fill="#EA4335" />
          </g>
          <text
            x="32"
            y="18"
            fontSize="12.5"
            fontWeight="700"
            fill="#5F6368"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            Google <tspan fontWeight="800" fill="#1A73E8">Cloud</tspan>
          </text>
        </svg>
      )
    }

    // 10. Salesforce / Trailhead
    if (norm.includes('salesforce') || norm.includes('trailhead')) {
      if (isIcon) {
        return (
          <svg
            viewBox="0 0 34 26"
            width={s}
            height={typeof size === 'number' ? `${Math.round(size * 0.78)}px` : s}
            fill="none"
            aria-label="Salesforce"
            style={{ display: 'block' }}
          >
            <path
              d="M14.5 4a7.5 7.5 0 0 1 7.2 5.2 6.5 6.5 0 0 1 5.3 6.3 6.5 6.5 0 0 1-6.5 6.5H8a7 7 0 0 1-7-7 7 7 0 0 1 4.5-6.5A7.5 7.5 0 0 1 14.5 4z"
              fill="#00A1E0"
            />
            <text x="15.5" y="17" fontSize="8" fontWeight="900" fontStyle="italic" fill="#FFFFFF" textAnchor="middle" fontFamily="Georgia, serif">
              f
            </text>
          </svg>
        )
      }
      return (
        <svg
          viewBox="0 0 98 28"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.35)}px` : '28px'}
          fill="none"
          aria-label="Salesforce"
          style={{ display: 'block' }}
        >
          <path
            d="M14.5 4a7.5 7.5 0 0 1 7.2 5.2 6.5 6.5 0 0 1 5.3 6.3 6.5 6.5 0 0 1-6.5 6.5H8a7 7 0 0 1-7-7 7 7 0 0 1 4.5-6.5A7.5 7.5 0 0 1 14.5 4z"
            fill="#00A1E0"
          />
          <text x="15.5" y="17" fontSize="8" fontWeight="900" fontStyle="italic" fill="#FFFFFF" textAnchor="middle" fontFamily="Georgia, serif">
            f
          </text>
          <text
            x="32"
            y="19"
            fontSize="13"
            fontWeight="800"
            fill="#00A1E0"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="0.2"
          >
            salesforce
          </text>
        </svg>
      )
    }

    // 11. GitHub / GitHub Skills
    if (norm.includes('github')) {
      if (isIcon) {
        return (
          <svg
            viewBox="0 0 26 26"
            width={s}
            height={s}
            fill="#24292f"
            aria-label="GitHub"
            style={{ display: 'block' }}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M13 2C6.93 2 2 6.93 2 13c0 4.86 3.15 8.98 7.51 10.43.55.1.75-.24.75-.53 0-.26-.01-.95-.01-1.87-3.05.66-3.7-1.47-3.7-1.47-.5-1.27-1.22-1.61-1.22-1.61-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.19.92.1-.71.38-1.2.7-1.47-2.44-.28-5-1.22-5-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.91 0 0 .92-.3 3.02 1.13a10.5 10.5 0 015.5 0c2.1-1.43 3.02-1.13 3.02-1.13.6 1.51.22 2.63.11 2.91.7.77 1.13 1.75 1.13 2.95 0 4.22-2.57 5.15-5.02 5.42.39.34.74 1.01.74 2.04 0 1.47-.01 2.66-.01 3.02 0 .29.2.64.76.53A11.01 11.01 0 0024 13c0-6.07-4.93-11-11-11z"
            />
          </svg>
        )
      }
      return (
        <svg
          viewBox="0 0 88 28"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.38)}px` : '28px'}
          fill="#24292f"
          aria-label="GitHub"
          style={{ display: 'block' }}
        >
          <g transform="translate(1, 2) scale(0.92)">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M13 2C6.93 2 2 6.93 2 13c0 4.86 3.15 8.98 7.51 10.43.55.1.75-.24.75-.53 0-.26-.01-.95-.01-1.87-3.05.66-3.7-1.47-3.7-1.47-.5-1.27-1.22-1.61-1.22-1.61-1-.68.08-.67.08-.67 1.1.08 1.68 1.13 1.68 1.13.98 1.68 2.57 1.2 3.19.92.1-.71.38-1.2.7-1.47-2.44-.28-5-1.22-5-5.43 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.91 0 0 .92-.3 3.02 1.13a10.5 10.5 0 015.5 0c2.1-1.43 3.02-1.13 3.02-1.13.6 1.51.22 2.63.11 2.91.7.77 1.13 1.75 1.13 2.95 0 4.22-2.57 5.15-5.02 5.42.39.34.74 1.01.74 2.04 0 1.47-.01 2.66-.01 3.02 0 .29.2.64.76.53A11.01 11.01 0 0024 13c0-6.07-4.93-11-11-11z"
            />
          </g>
          <text
            x="30"
            y="19"
            fontSize="15"
            fontWeight="800"
            fill="#24292f"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            GitHub
          </text>
        </svg>
      )
    }

    // 12. SWAYAM / NPTEL / IIT
    if (norm.includes('swayam') || norm.includes('nptel') || norm.includes('iit')) {
      return (
        <svg
          viewBox="0 0 54 26"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.55)}px` : s}
          fill="none"
          aria-label="SWAYAM NPTEL"
          style={{ display: 'block' }}
        >
          <rect width="54" height="26" rx="5" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.2" />
          <rect x="2" y="2" width="50" height="7" fill="#FF6600" rx="3" />
          <rect x="2" y="17" width="50" height="7" fill="#138808" rx="3" />
          <circle cx="27" cy="13" r="3.8" stroke="#000080" strokeWidth="1.2" fill="#FFFFFF" />
          <circle cx="27" cy="13" r="1.3" fill="#000080" />
          <text
            x="27"
            y="7.2"
            textAnchor="middle"
            fontSize="5"
            fontWeight="900"
            fill="#FFFFFF"
            letterSpacing="0.8"
          >
            SWAYAM
          </text>
          <text
            x="27"
            y="22.5"
            textAnchor="middle"
            fontSize="5"
            fontWeight="900"
            fill="#FFFFFF"
            letterSpacing="0.8"
          >
            NPTEL
          </text>
        </svg>
      )
    }

    // 13. Infosys / Infosys Springboard
    if (norm.includes('infosys') || norm.includes('springboard')) {
      return (
        <svg
          viewBox="0 0 68 26"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.45)}px` : s}
          fill="none"
          aria-label="Infosys"
          style={{ display: 'block' }}
        >
          <rect width="68" height="26" rx="6" fill="#007CC3" />
          <text
            x="34"
            y="18"
            textAnchor="middle"
            fontSize="15"
            fontWeight="900"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="0.5"
          >
            Infosys
          </text>
        </svg>
      )
    }

    // 14. Scaler / Scaler Academy
    if (norm.includes('scaler')) {
      if (isIcon) {
        return (
          <svg
            viewBox="0 0 28 28"
            width={s}
            height={s}
            fill="none"
            aria-label="Scaler"
            style={{ display: 'block' }}
          >
            <rect width="28" height="28" rx="6" fill="#111827" />
            <path d="M7 21L16 7h4.5L11.5 21H7z" fill="#ED1B24" />
            <path d="M15 21l6-9.5h-3.8L13 21H15z" fill="#FF4D4D" />
          </svg>
        )
      }
      return (
        <svg
          viewBox="0 0 88 28"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.38)}px` : '28px'}
          fill="none"
          aria-label="Scaler"
          style={{ display: 'block' }}
        >
          <rect width="88" height="28" rx="6" fill="#111827" />
          <path d="M9 21L16 7h3.8L12.8 21H9z" fill="#ED1B24" />
          <path d="M15.5 21l4.8-8.5h-3.2L14 21h1.5z" fill="#FF4D4D" />
          <text
            x="30"
            y="19"
            fontSize="14"
            fontWeight="900"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="1.2"
          >
            SCALER
          </text>
        </svg>
      )
    }

    // 15. Forage (Virtual Job Simulations & Fortune 500 Experiences)
    if (norm.includes('forage')) {
      if (isIcon) {
        return (
          <svg
            viewBox="0 0 28 28"
            width={s}
            height={s}
            fill="none"
            aria-label="Forage"
            style={{ display: 'block' }}
          >
            <rect width="28" height="28" rx="6" fill="#02302A" />
            <path d="M6 7h6.5l6 7-6 7H6l6-7-6-7z" fill="#00BFA5" />
            <path d="M13 7h4l5 7-5 7h-4l5-7-5-7z" fill="#1DE9B6" opacity="0.9" />
          </svg>
        )
      }
      return (
        <svg
          viewBox="0 0 92 28"
          width={s}
          height={typeof size === 'number' ? `${Math.round(size * 0.36)}px` : '28px'}
          fill="none"
          aria-label="Forage"
          style={{ display: 'block' }}
        >
          <rect width="92" height="28" rx="6" fill="#02302A" />
          <path d="M7 7h6l5.5 7-5.5 7H7l5.5-7L7 7z" fill="#00BFA5" />
          <path d="M13.5 7h3.5l4.5 7-4.5 7h-3.5l4.5-7-4.5-7z" fill="#1DE9B6" opacity="0.9" />
          <text
            x="32"
            y="19"
            fontSize="13.5"
            fontWeight="900"
            fill="#FFFFFF"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="1"
          >
            FORAGE
          </text>
        </svg>
      )
    }

    // Fallback: Corporate monogram
    const initial = (norm.charAt(0) || 'C').toUpperCase()
    return (
      <div
        style={{
          width: s,
          height: typeof size === 'number' ? `${Math.round(size * 0.6)}px` : s,
          borderRadius: '7px',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: typeof size === 'number' ? `${Math.round(size * 0.4)}px` : '13px',
          textTransform: 'uppercase',
          boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
          padding: '0 10px',
        }}
      >
        {company || initial}
      </div>
    )
  }

  return (
    <span
      className={`aicp-company-logo-wrap ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
      title={company}
    >
      {getLogoContent()}
      {showName && (
        <span style={{ marginLeft: '8px', fontWeight: 600 }}>{company}</span>
      )}
    </span>
  )
}

export default CompanyLogo
