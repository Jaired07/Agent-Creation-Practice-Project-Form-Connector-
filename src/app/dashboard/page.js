'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import Sidebar from '@/components/Sidebar'
import ConnectorCard from '@/components/ConnectorCard'
import Toast from '@/components/Toast'

/**
 * Dashboard page component
 * 
 * Displays user's connectors with statistics and management options.
 * Requires authentication - redirects to sign-in if not authenticated.
 * 
 * Features:
 * - Shows total connectors, submissions, and active destinations
 * - Lists all connectors owned by the current user
 * - Allows creating new connectors
 * - User profile button in header
 */
export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [connectors, setConnectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      console.log('🔒 No user found, redirecting to sign-in')
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  useEffect(() => {
    if (user) {
      fetchConnectors()
    }
  }, [user])

  const fetchConnectors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/connectors')
      const result = await response.json()
      
      if (result.error) {
        setError(result.error)
      } else {
        setConnectors(result.data || [])
      }
    } catch (err) {
      setError('Failed to fetch connectors')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalSubmissions = connectors.reduce((sum, connector) => {
    return sum + (connector.submission_count || 0)
  }, 0)

  const totalDestinations = connectors.reduce((sum, c) => sum + (c.destinations?.length || 0), 0)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const stats = [
    {
      name: 'Total Connectors',
      value: loading ? '—' : connectors.length,
      change: '+12%',
      changeType: 'positive',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      color: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-500/10',
    },
    {
      name: 'Total Submissions',
      value: loading ? '—' : totalSubmissions.toLocaleString(),
      change: '+24%',
      changeType: 'positive',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-500/10',
    },
    {
      name: 'Active Destinations',
      value: loading ? '—' : totalDestinations,
      change: '+8%',
      changeType: 'positive',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
      color: 'from-cyan-500 to-blue-600',
      bgColor: 'bg-cyan-500/10',
    },
  ]

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (redirect will happen)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Sidebar />
      
      {/* Main Content */}
      <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-slate-400 mt-1">Monitor and manage your form connectors</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2.5 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </button>
                <button
                  onClick={fetchConnectors}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                {user && (
                  <div className="flex items-center">
                    <UserButton 
                      afterSignOutUrl="/sign-in"
                      appearance={{
                        elements: {
                          avatarBox: "w-10 h-10",
                        },
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div
                key={stat.name}
                className={`relative overflow-hidden bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 animate-fade-in stagger-${index + 1}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">{stat.name}</p>
                    <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <div className={`bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                      {stat.icon}
                    </div>
                  </div>
                </div>
                {/* Decorative gradient */}
                <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${stat.color} rounded-full opacity-10 blur-2xl`} />
              </div>
            ))}
          </div>

          {/* Connectors Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Your Connectors</h2>
                <p className="text-slate-400 text-sm mt-1">
                  {connectors.length > 0 
                    ? `${connectors.length} connector${connectors.length !== 1 ? 's' : ''} configured`
                    : 'No connectors yet'}
                </p>
              </div>
              <Link
                href="/connectors/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Connector
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6">
                    <div className="skeleton h-6 w-1/3 rounded-lg mb-3" />
                    <div className="skeleton h-4 w-2/3 rounded-lg mb-4" />
                    <div className="flex gap-2 mb-4">
                      <div className="skeleton h-6 w-16 rounded-lg" />
                      <div className="skeleton h-6 w-16 rounded-lg" />
                    </div>
                    <div className="skeleton h-12 w-full rounded-xl" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-red-400 font-medium mb-2">Error loading connectors</p>
                <p className="text-red-400/70 text-sm mb-4">{error}</p>
                <button
                  onClick={fetchConnectors}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : connectors.length === 0 ? (
              <div className="relative bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-700/50 p-12 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
                <div className="relative">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No connectors yet</h3>
                  <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                    Create your first connector to start capturing form submissions and routing them to your favorite tools.
                  </p>
                  <Link
                    href="/connectors/new"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your First Connector
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {connectors.map((connector, index) => (
                  <div key={connector.id} className={`animate-fade-in stagger-${Math.min(index + 1, 5)}`}>
                    <ConnectorCard 
                      connector={connector} 
                      onCopy={() => showToast('Webhook URL copied to clipboard!')}
                      onDelete={() => {
                        showToast('Connector deleted successfully!')
                        fetchConnectors()
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
