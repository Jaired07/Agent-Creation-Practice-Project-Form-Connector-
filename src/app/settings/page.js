'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Toast from '@/components/Toast'

export default function Settings() {
  const [toast, setToast] = useState(null)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    webhookRetries: true,
    apiKey: 'fc_live_xxxxxxxxxxxxxxxxxxxx',
    baseUrl: 'http://localhost:3000',
  })

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    setToast({ message: 'Setting updated', type: 'success' })
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(settings.apiKey)
    setToast({ message: 'API key copied to clipboard', type: 'success' })
  }

  const regenerateApiKey = () => {
    const newKey = 'fc_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setSettings(prev => ({ ...prev, apiKey: newKey }))
    setToast({ message: 'API key regenerated', type: 'success' })
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      <Sidebar />
      
      <main className="pl-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-slate-400 mt-1">Manage your account and preferences</p>
          </div>
        </header>

        <div className="p-8 max-w-4xl">
          {/* General Settings */}
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-6">General</h2>
            
            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Email Notifications</h3>
                  <p className="text-sm text-slate-400 mt-1">Receive email alerts for failed deliveries</p>
                </div>
                <button
                  onClick={() => handleToggle('emailNotifications')}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    settings.emailNotifications ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Webhook Retries */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Automatic Retries</h3>
                  <p className="text-sm text-slate-400 mt-1">Retry failed webhook deliveries up to 3 times</p>
                </div>
                <button
                  onClick={() => handleToggle('webhookRetries')}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    settings.webhookRetries ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.webhookRetries ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* API Settings */}
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-6">API</h2>
            
            <div className="space-y-6">
              {/* API Key */}
              <div>
                <label className="block text-white font-medium mb-2">API Key</label>
                <div className="flex items-center gap-3">
                  <code className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-400 font-mono">
                    {settings.apiKey.substring(0, 12)}{'•'.repeat(20)}
                  </code>
                  <button
                    onClick={copyApiKey}
                    className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={regenerateApiKey}
                    className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    Regenerate
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Use this key to authenticate API requests</p>
              </div>

              {/* Base URL */}
              <div>
                <label className="block text-white font-medium mb-2">Webhook Base URL</label>
                <input
                  type="text"
                  value={settings.baseUrl}
                  onChange={(e) => setSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <p className="text-xs text-slate-500 mt-2">The base URL used for generating webhook URLs</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-6">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
            <p className="text-sm text-slate-400 mb-6">Irreversible and destructive actions</p>
            
            <div className="flex items-center justify-between p-4 bg-slate-900/30 rounded-xl">
              <div>
                <h3 className="text-white font-medium">Delete Account</h3>
                <p className="text-sm text-slate-400 mt-1">Permanently delete your account and all data</p>
              </div>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium transition-colors">
                Delete Account
              </button>
            </div>
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

