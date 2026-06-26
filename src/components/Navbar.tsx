import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Activity, Home, Menu, X, Pickaxe, User } from 'lucide-react'
import NetworkBadge from './NetworkBadge'
import WalletButton from './WalletButton'
import { useWalletContext } from '../context/WalletContext'
import { formatAddress } from '../lib/chain'
import clsx from 'clsx'

const baseLinks = [
  { to: '/',         label: 'Home',     icon: Home     },
  { to: '/mine',     label: 'Mine',     icon: Pickaxe  },
  { to: '/activity', label: 'Activity', icon: Activity },
]

export default function Navbar() {
  const { pathname }            = useLocation()
  const [open, setOpen]         = useState(false)
  const { address, walletType } = useWalletContext()

  const links = [
    ...baseLinks,
    ...(address ? [{ to: '/profile', label: 'Profile', icon: User }] : []),
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-[rgba(168,230,255,0.06)] bg-[#001020]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="relative w-8 h-8 shrink-0">
              <img
                src="/favicon.png"
                alt="KineticDAO"
                className="w-8 h-8 rounded-xl object-cover transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(168,230,255,0.5)]"
                style={{ boxShadow: '0 0 12px rgba(168,230,255,0.25)' }}
              />
            </div>
            <span className="font-bold text-white text-[17px] tracking-tight hidden xs:block sm:block">
              Kinetic<span className="gradient-text">DAO</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  pathname === to
                    ? 'text-[#A8E6FF] bg-[rgba(168,230,255,0.1)]'
                    : 'text-[rgba(168,230,255,0.5)] hover:text-[#A8E6FF] hover:bg-[rgba(168,230,255,0.06)]'
                )}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <NetworkBadge />
            {address && walletType === 'embedded' ? (
              <div className="flex items-center gap-2">
                <Link to="/profile"
                  className="address-pill hover:text-[#A8E6FF] transition-colors">
                  {formatAddress(address)}
                </Link>
              </div>
            ) : (
              <WalletButton />
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden btn-ghost p-2">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 pt-2 space-y-1 animate-fade-in">
            {links.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} onClick={() => setOpen(false)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  pathname === to
                    ? 'text-[#A8E6FF] bg-[rgba(168,230,255,0.1)]'
                    : 'text-[rgba(168,230,255,0.5)] hover:text-[#A8E6FF] hover:bg-[rgba(168,230,255,0.06)]'
                )}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-2 px-1">
              <NetworkBadge />
              {address && walletType === 'embedded' ? (
                <div className="address-pill text-center">{formatAddress(address)}</div>
              ) : (
                <WalletButton />
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
