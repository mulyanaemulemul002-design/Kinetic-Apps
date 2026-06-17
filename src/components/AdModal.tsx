import { useState, useEffect, useRef } from 'react'
import { X, Volume2, VolumeX } from 'lucide-react'

interface AdModalProps {
  onComplete: () => void
  onClose?:   () => void
}

const AD_MIN = 15
const AD_MAX = 30

const ADS = [
  {
    brand:    'Google',
    headline: 'Reach more customers with Google Ads',
    body:     'Drive sales, leads, and website traffic with targeted campaigns.',
    cta:      'Get started',
    accent:   '#4285F4',
    bg:       'from-[#001828] via-[#001428] to-[#000e20]',
    logo:     'G',
  },
  {
    brand:    'Meta',
    headline: 'Grow your business on Facebook & Instagram',
    body:     'Connect with 3.2 billion people across Meta platforms worldwide.',
    cta:      'Start advertising',
    accent:   '#0866FF',
    bg:       'from-[#001020] via-[#00101e] to-[#000c18]',
    logo:     'f',
  },
  {
    brand:    'KNTC Ecochain',
    headline: 'Build the next generation of Web3',
    body:     'Deploy smart contracts on KNTC — fast, scalable, and transparent.',
    cta:      'Learn more',
    accent:   '#A8E6FF',
    bg:       'from-[#001828] via-[#001a2e] to-[#000e1e]',
    logo:     'K',
  },
  {
    brand:    'TikTok for Business',
    headline: 'Make ads people actually want to watch',
    body:     'Join 7 million advertisers reaching audiences on TikTok.',
    cta:      'Create now',
    accent:   '#ff2d55',
    bg:       'from-[#160010] via-[#1a0016] to-[#0e000c]',
    logo:     'T',
  },
]

export default function AdModal({ onComplete }: AdModalProps) {
  const duration                  = useRef(Math.floor(Math.random() * (AD_MAX - AD_MIN + 1)) + AD_MIN)
  const [elapsed, setElapsed]     = useState(0)
  const [muted, setMuted]         = useState(true)
  const [adIdx]                   = useState(() => Math.floor(Math.random() * ADS.length))
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasCompleted              = useRef(false)

  const ad        = ADS[adIdx]
  const total     = duration.current
  const remaining = Math.max(total - elapsed, 0)
  const progress  = Math.min(elapsed / total, 1)
  const canSkip   = remaining === 0

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        const next = e + 1
        if (next >= total && !hasCompleted.current) {
          hasCompleted.current = true
          clearInterval(intervalRef.current!)
          setTimeout(() => {
            onComplete()
          }, 400)
        }
        return next
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [total, onComplete])

  function handleSkip() {
    if (!canSkip) return
    clearInterval(intervalRef.current!)
    if (!hasCompleted.current) {
      hasCompleted.current = true
      onComplete()
    }
  }

  const rgb = hexToRgb(ad.accent)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,8,16,0.85)', backdropFilter: 'blur(8px)' }}>

      <div className="w-full max-w-lg rounded-2xl overflow-hidden animate-slide-up"
        style={{ border: '1px solid rgba(168,230,255,0.12)', boxShadow: '0 0 80px rgba(0,0,0,0.8)' }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#020c14]"
          style={{ borderBottom: '1px solid rgba(168,230,255,0.08)' }}>
          <div className="flex items-center gap-2">
            <span className="text-subtle text-xs">Sponsored</span>
            <span className="badge badge-glacier text-[10px]">Ad</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMuted(m => !m)}
              className="p-1.5 rounded-lg text-muted hover:text-white transition-colors"
              style={{ background: 'rgba(168,230,255,0.06)' }}>
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={canSkip ? handleSkip : undefined}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background:  canSkip ? `rgba(${rgb},0.15)` : 'rgba(168,230,255,0.04)',
                border:      canSkip ? `1px solid rgba(${rgb},0.35)` : '1px solid rgba(168,230,255,0.1)',
                color:       canSkip ? ad.accent : '#4a6a7a',
                cursor:      canSkip ? 'pointer' : 'not-allowed',
              }}>
              {canSkip ? (
                <><X className="w-3 h-3" />Close</>
              ) : (
                <>Skip in {remaining}s</>
              )}
            </button>
          </div>
        </div>

        {/* Ad creative */}
        <div className={`relative bg-gradient-to-br ${ad.bg} aspect-video flex flex-col items-center justify-center overflow-hidden px-8`}>

          {/* Background grid */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `linear-gradient(rgba(${rgb},0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(${rgb},0.5) 1px,transparent 1px)`,
              backgroundSize: '36px 36px',
            }} />

          {/* Glow */}
          <div className="absolute w-80 h-80 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle,rgba(${rgb},0.08),transparent)`, filter: 'blur(50px)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

          {/* Brand logo */}
          <div className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 font-black text-xl"
            style={{
              background: `rgba(${rgb},0.15)`,
              border:     `2px solid rgba(${rgb},0.3)`,
              color:      ad.accent,
              boxShadow:  `0 0 20px rgba(${rgb},0.2)`,
            }}>
            {ad.logo}
          </div>

          {/* Text */}
          <div className="relative z-10 text-center">
            <div className="text-subtle text-xs font-semibold uppercase tracking-widest mb-2">{ad.brand}</div>
            <h3 className="text-white text-xl font-black mb-3 leading-tight">{ad.headline}</h3>
            <p className="text-muted text-sm mb-5 max-w-xs mx-auto leading-relaxed">{ad.body}</p>
            <div className="inline-flex items-center px-5 py-2 rounded-full text-sm font-bold"
              style={{ background: `rgba(${rgb},0.15)`, border: `1px solid rgba(${rgb},0.35)`, color: ad.accent }}>
              {ad.cta}
            </div>
          </div>

          {/* Animated bars */}
          <div className="relative z-10 flex items-end justify-center gap-0.5 mt-6 h-5">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="w-0.5 rounded-full"
                style={{
                  height:     `${8 + Math.abs(Math.sin(i * 0.7 + elapsed * 0.6)) * 10}px`,
                  background: ad.accent,
                  opacity:    0.35,
                  transition: 'height 0.25s ease',
                }} />
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-[#030f1a] px-4 py-3">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="flex-1 progress-track">
              <div className="progress-fill transition-all duration-1000 linear"
                style={{ width: `${progress * 100}%` }} />
            </div>
            <span className="text-xs font-mono w-10 text-right"
              style={{ color: canSkip ? '#60ffb0' : '#4a6a7a' }}>
              {canSkip ? 'Done' : `${remaining}s`}
            </span>
          </div>
          <div className="text-subtle text-[10px] text-center">
            Watch the ad — mining starts automatically when the ad ends
          </div>
        </div>
      </div>
    </div>
  )
}

function hexToRgb(hex: string): string {
  if (!hex.startsWith('#')) return '168,230,255'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
