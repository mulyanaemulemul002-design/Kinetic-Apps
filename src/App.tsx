import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WalletProvider } from './context/WalletContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Mine from './pages/Mine'
import Dashboard from './pages/Dashboard'
import ActivityPage from './pages/Activity'
import Profile from './pages/Profile'

export default function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/"          element={<Home />}         />
              <Route path="/mine"      element={<Mine />}         />
              <Route path="/dashboard" element={<Dashboard />}    />
              <Route path="/activity"  element={<ActivityPage />} />
              <Route path="/profile"   element={<Profile />}      />
            </Routes>
          </main>
          <footer className="border-t border-[rgba(168,230,255,0.05)] py-5 px-4 text-center text-xs text-subtle">
            KineticDAO · Ad-to-Earn Mining Protocol · KNTC Ecochain · Maculatus Testnet · Chain ID 10778
          </footer>
        </div>
      </BrowserRouter>
    </WalletProvider>
  )
}
