import { useEffect, useState } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNativeApp } from '@/lib/native-platform';
import './launch-experience.css';

// Mounted above the router so navigation and returning from another app never
// replay the introduction. The app loads underneath it during a fresh launch.
export default function LaunchExperience({ children }) {
  const [launching, setLaunching] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('app-is-launching', launching);
    return () => document.documentElement.classList.remove('app-is-launching');
  }, [launching]);

  useEffect(() => {
    let cancelled = false;
    let secondFrame;
    let finishTimer;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(async () => {
        // Paint the matching black web surface before revealing it from iOS.
        // A native timeout also releases the static splash if the bridge fails.
        if (isNativeApp()) {
          try {
            await SplashScreen.hide({ fadeOutDuration: 0 });
          } catch {
            // The native splash also auto-hides; the introduction must not block.
          }
        }
        if (cancelled) return;
        setPlaying(true);
        finishTimer = window.setTimeout(() => setLaunching(false), reducedMotion ? 250 : 1800);
      });
    });
    // Independent of the native bridge or animation events: always release the UI.
    const fallbackTimer = window.setTimeout(() => setLaunching(false), 4000);

    return () => {
      cancelled = true;
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
      clearTimeout(finishTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <>
      <div {...(launching ? { inert: '', 'aria-hidden': true } : {})}>{children}</div>
      {launching && (
        <div
          className={`app-launch${playing ? ' app-launch--playing' : ''}`}
          role="status"
          aria-label="Opening Boiler Transport"
        >
          <div className="app-launch__brand" aria-hidden="true">
            <svg className="app-launch__mark" viewBox="0 0 240 240" fill="none">
              <defs>
                <linearGradient
                  id="launch-gold"
                  x1="40"
                  y1="40"
                  x2="200"
                  y2="210"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#E8D6A8" />
                  <stop offset="1" stopColor="#B99756" />
                </linearGradient>
              </defs>
              <g
                stroke="url(#launch-gold)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  className="app-launch__route"
                  pathLength="1"
                  d="M109 207 C37 207 32 176 85 169 L165 161 Q187 159 192 143"
                />
                <circle className="app-launch__origin" cx="109" cy="207" r="7" fill="#080808" />
                <g className="app-launch__bus">
                  <path d="M58 130 V64 Q58 44 78 44 H128 Q148 44 148 64 V130 Q148 140 138 140 H68 Q58 140 58 130Z" />
                  <path d="M66 67 H140 V106 H66Z" strokeWidth="3" />
                  <path d="M88 55 H118 M88 127 H118" strokeWidth="3" />
                  <path d="M58 78 H49 V94 M148 78 H157 V94 M69 141 V149 M137 141 V149" />
                  <path d="M71 119 H78 M128 119 H135" stroke="#F7F2E6" strokeWidth="4" />
                </g>
                <g className="app-launch__pin">
                  <path
                    d="M192 145 S170 119 170 106 A22 22 0 1 1 214 106 C214 120 192 145 192 145Z"
                    fill="#080808"
                  />
                  <circle cx="192" cy="106" r="7" strokeWidth="3" />
                </g>
              </g>
            </svg>
            <div className="app-launch__wordmark">
              <div className="app-launch__name">Boiler Transport</div>
              <div className="app-launch__tagline">YOUR CAMPUS. CONNECTED.</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
