'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

export default function Activity() {
  const [filter, setFilter] = useState('all')

  // Mock activity data
  const activities = [
    {
      id: 1,
      type: 'submission',
      connector: 'Contact Form',
      destination: 'email',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: 2,
      type: 'submission',
      connector: 'Newsletter Signup',
      destination: 'sheets',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 3,
      type: 'submission',
      connector: 'Contact Form',
      destination: 'slack',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 4,
      type: 'error',
      connector: 'Feedback Form',
      destination: 'webhook',
      status: 'failed',
      error: 'Webhook endpoint returned 500',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
    {
      id: 5,
      type: 'submission',
      connector: 'Contact Form',
      destination: 'sms',
      status: 'success',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
  ]

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000 / 60)
    
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m ago`
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
    return date.toLocaleDateString()
  }

  const destinationColors = {
    email: 'from-rose-500 to-pink-600',
    sheets: 'from-emerald-500 to-green-600',
    slack: 'from-purple-500 to-violet-600',
    sms: 'from-amber-500 to-orange-600',
    webhook: 'from-cyan-500 to-blue-600',
  }

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.status === filter)

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Sidebar />
      
      <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Activity</h1>
                <p className="text-slate-400 mt-1">Monitor form submissions and delivery status</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-xl">
                {['all', 'success', 'failed'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Activity List */}
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
            {filteredActivities.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No activity yet</h3>
                <p className="text-slate-400">Form submissions will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {filteredActivities.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className={`flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors animate-fade-in stagger-${Math.min(index + 1, 5)}`}
                  >
                    {/* Status indicator */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activity.status === 'success' 
                        ? 'bg-emerald-500/10' 
                        : 'bg-red-500/10'
                    }`}>
                      {activity.status === 'success' ? (
                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{activity.connector}</span>
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${destinationColors[activity.destination]}`}>
                          {activity.destination}
                        </span>
                      </div>
                      {activity.error && (
                        <p className="text-sm text-red-400">{activity.error}</p>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-sm text-slate-500">{formatTime(activity.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info banner */}
          <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-indigo-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-indigo-300 font-medium">Activity Logging</p>
                <p className="text-sm text-indigo-400/70 mt-1">
                  This shows sample activity data. Real activity will appear here once you start receiving form submissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

