import { Link } from 'react-router-dom'
import { ArrowRight, Pickaxe, Shield, Coins, ChevronDown, Zap } from 'lucide-react'
import { useProtocolStats } from '../hooks/useMining'
import { useMiningEvents } from '../hooks/useMining'
import { useWallet } from '../hooks/useWallet'
import { formatKNTC } from '../lib/chain'
import EventRow from '../components/EventRow'
import WalletButton from '../components/WalletButton'

const features = [
  {
    icon: Pickaxe,
    title: 'Ad-to-Earn Mining',
    desc: 'Watch a short ad and call mine() on-chain. Every session earns exactly 1 KNTC — transparent, fixed, no hidden formulas.',
    color: '#A8E6FF',
    step: '01',
  },
  {
    icon: Shield,
    title: 'Fully On-Chain',
    desc: 'Every mining session is an on-chain event. No database, no middleman — every credit is verifiable on Maculatus Explorer.',
    color: '#60ffb0',
    step: '02',
  },
  {
    icon: Coins,
    title: '10 Billion KNTC Pool',
    desc: '10,000,000,000 KNTC allocated for the mining pool. Accumulate now, claim after TGE activation — tokens are yours the moment you mine.',
    color: '#ffd060',
    step: '03',
  },
]

export default function Home() {
  const { address } = useWallet()
  const { data: protocol } = useProtocolStats()
  const { data: events }   = useMiningEvents()

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-24 px-4 overflow-hidden text-center">

        {/* Multi-layer glow background */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(ellipse,rgba(168,230,255,0.07) 0%,transparent 65%)', filter: 'blur(60px)' }} />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[300px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(ellipse,rgba(90,200,240,0.06) 0%,transparent 70%)', filter: 'blur(80px)' }} />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] rounded-full opacity-30"
            style={{ background: 'radial-gradient(ellipse,rgba(96,255,176,0.04) 0%,transparent 70%)', filter: 'blur(80px)' }} />
        </div>

        <div className="max-w-4xl mx-auto relative">

          {/* Logo mark */}
          <div className="flex justify-center mb-6 animate-fade-in">
            <div className="relative">
              <img
                src="/favicon.png"
                alt="KineticDAO"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover"
                style={{ boxShadow: '0 0 40px rgba(168,230,255,0.35), 0 0 80px rgba(168,230,255,0.12), 0 8px 32px rgba(0,0,0,0.6)' }}
              />
              {/* Live pulse ring */}
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center">
                <span className="absolute inline-flex w-3 h-3 rounded-full bg-[#60ffb0] opacity-70 animate-ping" />
                <span className="relative w-2 h-2 rounded-full bg-[#60ffb0]" />
              </span>
            </div>
          </div>

          {/* Slogan */}
          <p className="text-xs sm:text-sm font-bold tracking-[0.25em] sm:tracking-[0.35em] uppercase mb-3 animate-fade-in"
            style={{ color: 'rgba(168,230,255,0.45)', letterSpacing: '0.3em' }}>
            ONE FOR ALL &nbsp;·&nbsp; ALL FOR ONE
          </p>

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7 animate-fade-in"
            style={{ background: 'rgba(168,230,255,0.07)', border: '1px solid rgba(168,230,255,0.18)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#60ffb0] animate-pulse-glacier" />
            <span className="text-[#A8E6FF] text-xs font-semibold tracking-wide">
              Live on KNTC Ecochain · Maculatus Testnet
            </span>
            <Zap className="w-3 h-3 text-[#A8E6FF]" />
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-5 leading-[1.08] animate-slide-up px-2">
            Watch Ads,{' '}
            <span className="gradient-text">Mine KNTC</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-muted mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up px-2">
            KineticDAO is a decentralized Ad-to-Earn DAO on KNTC Ecochain.
            Watch an ad, call <code className="text-[#A8E6FF] bg-[rgba(168,230,255,0.08)] px-1.5 py-0.5 rounded text-sm font-mono">mine()</code> on-chain,
            earn exactly <strong className="text-white">1 KNTC per session</strong> — claimable after TGE,
            every session recorded permanently on the blockchain.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 animate-slide-up">
            {address ? (
              <Link to="/mine" className="btn-primary text-base px-8 py-3.5">
                <Pickaxe className="w-5 h-5" />
                Start Mining
              </Link>
            ) : (
              <div className="scale-105">
                <WalletButton />
              </div>
            )}
            <Link to="/activity" className="btn-secondary text-base px-8 py-3.5">
              Live Activity <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Live stats */}
          {protocol && (
            <div className="mt-14 animate-fade-in">
              <div className="inline-grid grid-cols-3 gap-px rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(168,230,255,0.08)', background: 'rgba(168,230,255,0.04)' }}>
                {[
                  { v: protocol.totalCycles.toLocaleString(),                          l: 'Sessions'    },
                  { v: protocol.uniqueMiners.toLocaleString(),                          l: 'Miners'      },
                  { v: `${formatKNTC(protocol.totalPointsMinted ?? 0n, 2)} KNTC`,       l: 'Minted'      },
                ].map(({ v, l }, i) => (
                  <div key={l} className={`px-6 py-4 text-center ${i > 0 ? 'border-l border-[rgba(168,230,255,0.06)]' : ''}`}
                    style={{ background: '#082035' }}>
                    <div className="text-xl sm:text-2xl font-black text-white tabular-nums">{v}</div>
                    <div className="text-[10px] sm:text-xs text-subtle mt-0.5 font-semibold uppercase tracking-wider">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-subtle animate-bounce opacity-60">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-12">
            <p className="text-xs font-bold tracking-[0.25em] uppercase mb-2"
              style={{ color: 'rgba(168,230,255,0.35)' }}>Protocol</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">How KineticDAO Works</h2>
            <p className="text-muted text-sm sm:text-base max-w-xl mx-auto">
              Three on-chain steps. No hidden complexity — every rule is in the smart contract.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {features.map((f) => (
              <div key={f.title}
                className="card p-6 group transition-all duration-300 hover:border-[rgba(168,230,255,0.16)] hover:-translate-y-0.5"
                style={{ background: '#082035' }}>
                <div className="flex items-start justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${f.color}14`, border: `1px solid ${f.color}28` }}>
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <span className="font-black text-3xl tabular-nums"
                    style={{ color: 'rgba(168,230,255,0.06)' }}>{f.step}</span>
                </div>
                <h3 className="text-white font-bold mb-2 text-sm sm:text-base">{f.title}</h3>
                <p className="text-muted text-xs sm:text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mining rules quick reference ──────────────────────────────── */}
      <section className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-4"
            style={{ background: 'rgba(8,32,53,0.7)', border: '1px solid rgba(168,230,255,0.08)' }}>
            {[
              { label: 'KNTC per session', value: '1',      color: '#A8E6FF' },
              { label: 'Cooldown',         value: '24h',    color: '#60ffb0' },
              { label: 'Mining pool',      value: '10B',    color: '#ffd060' },
              { label: 'TGE status',       value: 'Soon',   color: '#c084fc' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className="text-2xl sm:text-3xl font-black tabular-nums mb-1" style={{ color }}>{value}</div>
                <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'rgba(168,230,255,0.35)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent activity ──────────────────────────────────────────── */}
      {events && events.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-white">Recent Mining Activity</h2>
              <Link to="/activity" className="btn-ghost text-sm gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="card-glow overflow-hidden">
              <div className="divide-y divide-[rgba(168,230,255,0.05)]">
                {events.slice(0, 5).map(e => (
                  <EventRow key={e.txHash} {...e} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="rounded-3xl p-8 sm:p-12 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(168,230,255,0.07) 0%, #082035 50%, rgba(8,32,53,0.95) 100%)',
              border: '1px solid rgba(168,230,255,0.18)',
              boxShadow: '0 0 80px rgba(168,230,255,0.07), 0 20px 60px rgba(0,0,0,0.5)',
            }}>

            {/* Background logo watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]" aria-hidden>
              <img src="/favicon.png" alt="" className="w-64 h-64 object-cover" />
            </div>

            <div className="relative">
              <img
                src="/favicon.png"
                alt="KineticDAO"
                className="w-14 h-14 rounded-2xl mx-auto mb-6 object-cover"
                style={{ boxShadow: '0 0 28px rgba(168,230,255,0.4), 0 8px 20px rgba(0,0,0,0.6)' }}
              />
              <p className="text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase mb-3"
                style={{ color: 'rgba(168,230,255,0.4)' }}>
                ONE FOR ALL · ALL FOR ONE
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">Ready to Mine?</h2>
              <p className="text-muted text-sm sm:text-base mb-8 max-w-sm mx-auto">
                Connect to Maculatus Testnet and earn 1 KNTC per session.
                One session per day, every session on-chain forever.
              </p>
              {address ? (
                <Link to="/mine" className="btn-primary text-base px-8 py-3.5">
                  <Pickaxe className="w-4 h-4" /> Open Mining
                </Link>
              ) : (
                <WalletButton />
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
