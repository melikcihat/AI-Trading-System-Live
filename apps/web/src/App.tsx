import { useState } from 'react'
import HealthBadge from './components/HealthBadge'
import SignalCard from './components/SignalCard'
import RiskPreview from './components/RiskPreview'
import BacktestCard from './components/BacktestCard'
import BacktestCompareCard from './components/BacktestCompareCard'
import GridSearchCard from './components/GridSearchCard'
import WalkForwardCard from './components/WalkForwardCard'
import PerformanceDashboard from './components/PerformanceDashboard'
import TradeJournalCard from './components/TradeJournalCard'
import EmergencyControls from './components/EmergencyControls'
import ProductionStatus from './components/ProductionStatus'
import GoLiveCard from './components/GoLiveCard'
import FlipPlanCard from './components/FlipPlanCard'
import MicroChecklistCard from './components/MicroChecklistCard'
import LiveTradingCard from './components/LiveTradingCard'
import StrategyCard from './components/StrategyCard'
import StrategyProfilesCard from './components/StrategyProfilesCard'
import MultiSignalCard from './components/MultiSignalCard'
import SettingsCard from './components/SettingsCard'

export default function App() {
  const [activeTab, setActiveTab] = useState<'trading' | 'backtest' | 'compare' | 'grid' | 'walkforward' | 'performance' | 'journal' | 'emergency' | 'production' | 'golive' | 'flip' | 'micro' | 'live' | 'strategy' | 'profiles' | 'multi' | 'settings'>('trading')

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="container-page flex items-center justify-between py-3">
          <h1 className="font-semibold">HubAI-lite</h1>
          <div className="flex items-center gap-4">
            <div className="flex bg-zinc-100 rounded-xl p-1 overflow-x-auto">
              <button 
                onClick={() => setActiveTab('trading')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'trading' ? 'bg-white shadow' : ''}`}
              >
                Trading
              </button>
              <button 
                onClick={() => setActiveTab('backtest')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'backtest' ? 'bg-white shadow' : ''}`}
              >
                Backtest
              </button>
              <button 
                onClick={() => setActiveTab('compare')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'compare' ? 'bg-white shadow' : ''}`}
              >
                Compare
              </button>
              <button 
                onClick={() => setActiveTab('grid')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'grid' ? 'bg-white shadow' : ''}`}
              >
                Grid
              </button>
              <button 
                onClick={() => setActiveTab('walkforward')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'walkforward' ? 'bg-white shadow' : ''}`}
              >
                Walk-Forward
              </button>
              <button 
                onClick={() => setActiveTab('performance')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'performance' ? 'bg-white shadow' : ''}`}
              >
                Performance
              </button>
              <button 
                onClick={() => setActiveTab('journal')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'journal' ? 'bg-white shadow' : ''}`}
              >
                Journal
              </button>
              <button 
                onClick={() => setActiveTab('emergency')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'emergency' ? 'bg-white shadow' : ''}`}
              >
                Emergency
              </button>
              <button 
                onClick={() => setActiveTab('production')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'production' ? 'bg-white shadow' : ''}`}
              >
                Production
              </button>
              <button 
                onClick={() => setActiveTab('golive')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'golive' ? 'bg-white shadow' : ''}`}
              >
                GO-LIVE
              </button>
              <button 
                onClick={() => setActiveTab('flip')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'flip' ? 'bg-white shadow' : ''}`}
              >
                Flip Plan
              </button>
              <button 
                onClick={() => setActiveTab('micro')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'micro' ? 'bg-white shadow' : ''}`}
              >
                Micro
              </button>
              <button 
                onClick={() => setActiveTab('live')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'live' ? 'bg-white shadow' : ''}`}
              >
                Live
              </button>
              <button 
                onClick={() => setActiveTab('strategy')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'strategy' ? 'bg-white shadow' : ''}`}
              >
                Strategy
              </button>
              <button 
                onClick={() => setActiveTab('profiles')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'profiles' ? 'bg-white shadow' : ''}`}
              >
                Profiles
              </button>
              <button 
                onClick={() => setActiveTab('multi')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'multi' ? 'bg-white shadow' : ''}`}
              >
                Multi
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap ${activeTab === 'settings' ? 'bg-white shadow' : ''}`}
              >
                Settings
              </button>
            </div>
            <HealthBadge />
          </div>
        </div>
      </header>

      <main className="container-page">
        {activeTab === 'trading' ? (
          <div className="grid gap-6 md:grid-cols-2 py-6">
            <SignalCard />
            <RiskPreview />
          </div>
        ) : activeTab === 'backtest' ? (
          <div className="py-6">
            <BacktestCard />
          </div>
        ) : activeTab === 'compare' ? (
          <div className="py-6">
            <BacktestCompareCard />
          </div>
        ) : activeTab === 'grid' ? (
          <div className="py-6">
            <GridSearchCard />
          </div>
        ) : activeTab === 'walkforward' ? (
          <div className="py-6">
            <WalkForwardCard />
          </div>
        ) : activeTab === 'performance' ? (
          <div className="py-6">
            <PerformanceDashboard />
          </div>
        ) : activeTab === 'journal' ? (
          <div className="py-6">
            <TradeJournalCard />
          </div>
        ) : activeTab === 'emergency' ? (
          <div className="py-6">
            <EmergencyControls />
          </div>
        ) : activeTab === 'production' ? (
          <div className="py-6">
            <ProductionStatus />
          </div>
        ) : activeTab === 'golive' ? (
          <div className="py-6">
            <GoLiveCard />
          </div>
        ) : activeTab === 'flip' ? (
          <div className="py-6">
            <FlipPlanCard />
          </div>
        ) : activeTab === 'micro' ? (
          <div className="py-6">
            <MicroChecklistCard />
          </div>
        ) : activeTab === 'live' ? (
          <div className="py-6">
            <LiveTradingCard />
          </div>
        ) : activeTab === 'strategy' ? (
          <div className="py-6">
            <StrategyCard />
          </div>
        ) : activeTab === 'profiles' ? (
          <div className="py-6">
            <StrategyProfilesCard />
          </div>
        ) : activeTab === 'multi' ? (
          <div className="py-6">
            <MultiSignalCard />
          </div>
        ) : (
          <div className="py-6">
            <SettingsCard />
          </div>
        )}
      </main>
    </div>
  )
}
