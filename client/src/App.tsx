import { formatCurrency } from '@/lib/utils'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-secondary-700">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Welcome to TumaPay
          </h1>
          <p className="text-xl text-gray-100">
            Cross-Border Payment Platform - Phase 1 Setup Complete
          </p>
        </div>

        {/* Demo Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6">
            <h2 className="text-2xl font-semibold text-white">Multi-Currency Wallet</h2>
            <p className="text-gray-100 mt-2">Manage your international payments</p>
          </div>

          <div className="p-8">
            {/* Balance Display */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-6 rounded-xl border border-primary-200">
                <p className="text-sm text-gray-600 mb-2">KES Balance</p>
                <p className="text-3xl font-bold text-primary-700">
                  {formatCurrency(125000.50, 'KES')}
                </p>
              </div>
              <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 p-6 rounded-xl border border-secondary-200">
                <p className="text-sm text-gray-600 mb-2">USDT Balance</p>
                <p className="text-3xl font-bold text-secondary-700">
                  {formatCurrency(850.25, 'USD')} USDT
                </p>
              </div>
              <div className="bg-gradient-to-br from-accent-50 to-accent-100 p-6 rounded-xl border border-accent-200">
                <p className="text-sm text-gray-600 mb-2">TRY Balance</p>
                <p className="text-3xl font-bold text-accent-600">
                  {formatCurrency(5420.75, 'TRY')}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 mb-8">
              <button className="flex-1 min-w-[150px] bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Deposit
              </button>
              <button className="flex-1 min-w-[150px] bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Transfer
              </button>
              <button className="flex-1 min-w-[150px] bg-accent-500 hover:bg-accent-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Withdraw
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">M-Pesa Integration</h3>
                <p className="text-sm text-gray-600">
                  Seamlessly deposit and withdraw funds using M-Pesa
                </p>
              </div>
              <div className="border-l-4 border-secondary-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">TRON USDT Support</h3>
                <p className="text-sm text-gray-600">
                  Transfer USDT via TRON blockchain with low fees
                </p>
              </div>
              <div className="border-l-4 border-accent-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">Turkish Bank Transfer</h3>
                <p className="text-sm text-gray-600">
                  Direct IBAN transfers to Turkish bank accounts
                </p>
              </div>
              <div className="border-l-4 border-primary-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">Real-time Exchange Rates</h3>
                <p className="text-sm text-gray-600">
                  Get competitive rates for KES, TRY, USD, and USDT
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tech Stack Info */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <div className="inline-flex flex-wrap gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <span className="px-3 py-1 bg-primary-500 text-white text-sm rounded-full">React 18</span>
            <span className="px-3 py-1 bg-secondary-500 text-white text-sm rounded-full">TypeScript</span>
            <span className="px-3 py-1 bg-accent-500 text-white text-sm rounded-full">Vite</span>
            <span className="px-3 py-1 bg-primary-500 text-white text-sm rounded-full">Tailwind CSS</span>
            <span className="px-3 py-1 bg-secondary-500 text-white text-sm rounded-full">React Query</span>
            <span className="px-3 py-1 bg-accent-500 text-white text-sm rounded-full">Zustand</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
