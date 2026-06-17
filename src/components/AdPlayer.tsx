import { useState, useEffect, useRef } from 'react'
import { Play, Volume2, VolumeX, CheckCircle } from 'lucide-react'

interface AdPlayerProps {
  onComplete: () => void
  disabled?: boolean
}

const AD_DURATION = 15 // seconds

const ADS = [
  {
    title: 'KNTC Ecochain — The Future of Web3',
    subtitle: 'Fast. Scalable. Transparent.',
    tag: 'Ecosystem Sponsor',
    color: 'from-[#001828] to-[#0d2a42]',
  },
  {
    title: 'KineticDAO Mining Pool — Earn Daily',
    subtitle: '300M KNTC allocated for miners like you.',
    tag: 'Protocol Ad',
    color: 'from-[#042030] to-[#082035]',
  },
  {
    title: 'Maculatus Testnet — Build On-Chain',
    subtitle: 'Deploy smart contracts on KNTC infrastructure.',
    tag: 'Developer Tools',
    color: 'from-[#001020] to-[#0d2a42]',
  },
]

export default function AdPlayer({ onComplete, disabled }: AdPlayerProps) {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [muted, setMuted] = useState(true)
  const [adIndex] = useState(() => Math.floor(Math.random() * ADS.length))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const ad = ADS[adIndex]
  const progress = Math.min(elapsed / AD_DURATION, 1)
  const remaining = Math.max(AD_DURATION - elapsed, 0)

  function startAd() {
    if (disabled || phase !== 'idle') return
    setPhase('playing')
    setElapsed(0)
  }

  useEffect(() => {
    if (phase !== 'playing') return
    intervalRef.current = setInterval(() => {
      setElapsed(e => {
        if (e + 1 >= AD_DURATION) {
          clearInterval(intervalRef.current!)
          setPhase('done')
          setTimeout(onComplete, 600)
          return AD_DURATION
        }
        return e + 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [phase, onComplete])

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[rgba(168,230,255,0.12)]"
      style={{ boxShadow: '0 0 40px rgba(168,230,255,0.06)' }}>

      {/* Ad viewport */}
      <div className={`relative bg-gradient-to-br ${ad.color} aspect-video flex items-center justify-center overflow-hidden`}>

        {/* Background grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(168,230,255,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(168,230,255,0.3) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Glow orb */}
        <div className="absolute w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle,#A8E6FF,transparent)', filter: 'blur(40px)' }} />

        {/* Content */}
        {phase === 'idle' && (
          <button onClick={startAd} disabled={disabled}
            className="relative z-10 flex flex-col items-center gap-4 group">
            <div className="w-16 h-16 rounded-full border-2 border-[rgba(168,230,255,0.4)] flex items-center justify-center
              bg-[rgba(168,230,255,0.1)] group-hover:bg-[rgba(168,230,255,0.2)] transition-all duration-300
              group-hover:shadow-[0_0_30px_rgba(168,230,255,0.3)]">
              <Play className="w-7 h-7 text-[#A8E6FF] ml-1" />
            </div>
            <span className="text-[#A8E6FF] text-sm font-semibold opacity-80 group-hover:opacity-100">
              {disabled ? 'Cooldown active' : `Watch ${AD_DURATION}s Ad to Mine`}
            </span>
          </button>
        )}

        {phase === 'playing' && (
          <div className="relative z-10 text-center px-8 animate-fade-in">
            <div className="badge badge-glacier mb-4 mx-auto w-fit">{ad.tag}</div>
            <h3 className="text-white text-xl sm:text-2xl font-bold mb-2">{ad.title}</h3>
            <p className="text-muted text-sm">{ad.subtitle}</p>

            {/* Animated bars (fake waveform) */}
            <div className="flex items-end justify-center gap-1 mt-6 h-8">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="w-1 rounded-full bg-[#A8E6FF] opacity-40"
                  style={{
                    height: `${20 + Math.sin(i * 0.8 + elapsed * 0.5) * 14}px`,
                    transition: 'height 0.3s ease',
                  }} />
              ))}
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="relative z-10 text-center animate-count-up">
            <CheckCircle className="w-12 h-12 text-[#A8E6FF] mx-auto mb-2" />
            <p className="text-[#A8E6FF] font-bold">Ad Complete</p>
          </div>
        )}

        {/* Top-right controls */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {phase === 'playing' && (
            <div className="badge badge-red text-[10px] animate-pulse-glacier">LIVE</div>
          )}
          <button onClick={() => setMuted(!muted)}
            className="p-1.5 rounded-lg bg-[rgba(0,16,32,0.5)] text-muted hover:text-glacier-300 transition-colors">
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-[#042030] px-4 py-3 flex items-center gap-3">
        <div className="flex-1 progress-track">
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="text-xs font-mono text-muted w-10 text-right">
          {phase === 'idle' ? `${AD_DURATION}s` :
           phase === 'done' ? 'Done' :
           `${remaining}s`}
        </span>
      </div>
    </div>
  )
}
