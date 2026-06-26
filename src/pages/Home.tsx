import { Link } from 'react-router-dom'
import { ArrowRight, Pickaxe, Shield, Coins, ChevronDown, Zap } from 'lucide-react'
import { useProtocolStats } from '../hooks/useMining'
import { useMiningEvents } from '../hooks/useMining'
import { useWallet } from '../hooks/useWallet'
import { formatPoints } from '../lib/chain'
import EventRow from '../components/EventRow'
import WalletButton from '../components/WalletButton'

const features = [
  {
    icon: Pickaxe,
    title: 'Ad-to-Earn Mining',
    desc: 'Watch a 15-second ad and start a 24-hour mining session — earn exactly 1 KNTC per session, recorded on-chain.',
    color: '#A8E6FF',
  },
  {
    icon: Shield,
    title: 'Fully On-Chain',
    desc: 'Every mining session is recorded as an on-chain event. No database, no middleman — pure blockchain transparency.',
    color: '#60ffb0',
  },
  {
    icon: Coins,
    title: '875B Point Pool',
    desc: '875 billion credits allocated for miners. Rank-based halving auto-activates at 500B (Rank 2) and 750B (Rank 3) global points.',
    color: '#ffd060',
  },
]

export default function Home() {
  const { address } = useWallet()
  const { data: protocol } = useProtocolStats()
  const { data: events } = useMiningEvents()

  return (
    <div className="min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden text-center">
        {/* Glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-100"
            style={{ background: 'radial-gradient(ellipse,rgba(168,230,255,0.05) 0%,transparent 70%)', filter: 'blur(40px)' }} />
        </div>

        <div className="max-w-4xl mx-auto relative">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 animate-fade-in"
            style={{ background: 'rgba(168,230,255,0.08)', border: '1px solid rgba(168,230,255,0.2)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-[#60ffb0] animate-pulse-glacier" />
            <span className="text-[#A8E6FF] text-xs font-semibold tracking-wide">
              Live on KNTC Ecochain · Maculatus Testnet
            </span>
            <Zap className="w-3 h-3 text-[#A8E6FF]" />
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white mb-6 leading-[1.1] animate-slide-up">
            Watch Ads,{' '}
            <span className="gradient-text">Mine KNTC</span>
          </h1>

          <p className="text-xl text-muted mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up">
            KineticDAO is a decentralized Ad-to-Earn protocol. Every ad you watch starts a
            24-hour mining session — points accumulate linearly on-chain, claimable as real KNTC after TGE.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up">
            {address ? (
              <Link to="/mine" className="btn-primary text-base px-8 py-3.5">
                <Pickaxe className="w-5 h-5" />
                Start Mining
              </Link>
            ) : (
              <div className="scale-110">
                <WalletButton />
              </div>
            )}
            <Link to="/activity" className="btn-secondary text-base px-8 py-3.5">
              View Live Activity <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Live counters */}
          {protocol && (
            <div className="mt-16 grid grid-cols-3 gap-6 max-w-sm mx-auto animate-fade-in">
              {[
                { v: protocol.totalCycles.toString(),               l: 'Sessions'       },
                { v: protocol.uniqueMiners.toString(),              l: 'Miners'         },
                { v: `${formatPoints(protocol.totalPointsMinted ?? 0n)} pts`, l: 'Points Minted' },
              ].map(({ v, l }) => (
                <div key={l} className="text-center">
                  <div className="text-2xl font-black text-white tabular-nums">{v}</div>
                  <div className="text-subtle text-xs mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-subtle animate-bounce">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">How KineticDAO Works</h2>
            <p className="text-muted">Transparent, on-chain Ad-to-Earn in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={f.title} className="card p-6 hover:border-[rgba(168,230,255,0.14)] transition-all group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `rgba(${hexToRgb(f.color)},0.1)`, border: `1px solid rgba(${hexToRgb(f.color)},0.2)` }}>
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <div className="text-subtle text-xs font-mono">Step {i + 1}</div>
                </div>
                <h3 className="text-white font-bold mb-2">{f.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent activity ──────────────────────────────────────────── */}
      {events && events.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">Recent Mining Activity</h2>
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
      <section className="py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="card-accent p-12"
            style={{ boxShadow: '0 0 80px rgba(168,230,255,0.08)' }}>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#5ac8f0,#A8E6FF)', boxShadow: '0 0 24px rgba(168,230,255,0.4)' }}>
              <Pickaxe className="w-7 h-7 text-[#001020]" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">Ready to Mine?</h2>
            <p className="text-muted mb-8">
              Connect to Maculatus Testnet and start earning KNTC tokens for every ad you watch — twice a day, every day.
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
      </section>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
