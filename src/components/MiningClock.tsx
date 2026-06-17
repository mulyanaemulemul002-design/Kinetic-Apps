import { useMiningCountdown } from '../hooks/useMining'
import { formatDuration } from '../lib/chain'
import { Pickaxe } from 'lucide-react'

interface MiningClockProps {
  cooldownSeconds: number
  canMine?: boolean
  cycleCount: number
}

const SIZE = 180
const STROKE = 8
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

export default function MiningClock({ cooldownSeconds, cycleCount }: MiningClockProps) {
  const { remaining, progress } = useMiningCountdown(cooldownSeconds)
  const ready = remaining === 0
  const { h, m, s } = formatDuration(remaining)

  const dashOffset = CIRC * (1 - progress)

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Ring */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke="rgba(168,230,255,0.07)" strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none"
            stroke={ready ? '#60ffb0' : '#A8E6FF'}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {ready ? (
            <div className="animate-count-up text-center">
              <Pickaxe className="w-8 h-8 text-[#60ffb0] mx-auto mb-1 animate-pulse-glacier" />
              <div className="text-[#60ffb0] font-bold text-sm">Ready!</div>
            </div>
          ) : (
            <div className="text-center">
              <div className="font-mono font-bold text-white text-2xl tracking-widest leading-none">
                {h}:{m}:{s}
              </div>
              <div className="text-muted text-xs mt-1">next cycle</div>
            </div>
          )}
        </div>

        {!ready && (
          <div className="absolute inset-0 animate-orbit-slow pointer-events-none">
            <div className="absolute top-[4px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#A8E6FF]"
              style={{ boxShadow: '0 0 8px rgba(168,230,255,0.8)' }} />
          </div>
        )}
        {ready && (
          <>
            <div className="absolute inset-0 rounded-full animate-ripple pointer-events-none"
              style={{ border: '2px solid rgba(96,255,176,0.25)' }} />
            <div className="absolute inset-0 rounded-full animate-ripple pointer-events-none"
              style={{ border: '2px solid rgba(96,255,176,0.15)', animationDelay: '0.4s' }} />
          </>
        )}
      </div>

      <div className="flex items-center gap-6 text-center">
        <div>
          <div className="text-xl font-bold text-white tabular-nums">{cycleCount}</div>
          <div className="text-xs text-muted">Cycles Done</div>
        </div>
        <div className="w-px h-8 bg-[rgba(168,230,255,0.08)]" />
        <div>
          <div className="text-xl font-bold text-white">1x</div>
          <div className="text-xs text-muted">Per Day</div>
        </div>
        <div className="w-px h-8 bg-[rgba(168,230,255,0.08)]" />
        <div>
          <div className="text-xl font-bold text-white">24h</div>
          <div className="text-xs text-muted">Cycle</div>
        </div>
      </div>
    </div>
  )
}
