'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import DestinationCard from '@/components/DestinationCard'
import Toast from '@/components/Toast'

const destinations = [
  {
    type: 'email',
    title: 'Email',
    description: 'Send form submissions directly to your inbox'
  },
  {
    type: 'sheets',
    title: 'Google Sheets',
    description: 'Automatically save submissions to a spreadsheet'
  },
  {
    type: 'slack',
    title: 'Slack',
    description: 'Get instant notifications in your Slack channel'
  },
  {
    type: 'sms',
    title: 'SMS',
    description: 'Receive text message alerts for new submissions'
  },
  {
    type: 'webhook',
    title: 'Webhook',
    description: 'Send data to any custom endpoint or API'
  }
]

export default function EditConnector() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [connector, setConnector] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destinations: [], // Array of objects: { type, enabled, config }
    is_active: true
  })
  const [destinationConfigs, setDestinationConfigs] = useState({})
  const [showConfigModal, setShowConfigModal] = useState(null) // Destination type to show config for
  const [toast, setToast] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchConnector()
    }
  }, [params.id])

  const fetchConnector = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/connectors/${params.id}`)
      const result = await response.json()
      
      if (result.error) {
        setToast({ message: result.error, type: 'error' })
      } else if (result.data) {
        setConnector(result.data)
        
        // Parse destinations - handle both old format (strings) and new format (objects)
        const destinations = (result.data.destinations || []).map(dest => {
          if (typeof dest === 'string') {
            return { type: dest, enabled: true, config: {} }
          }
          return dest
        })
        
        // Extract configs for editing
        const configs = {}
        destinations.forEach(dest => {
          if (dest.config) {
            configs[dest.type] = dest.config
          }
        })
        
        setFormData({
          name: result.data.name || '',
          description: result.data.description || '',
          destinations: destinations,
          is_active: result.data.is_active !== false
        })
        setDestinationConfigs(configs)
      }
    } catch (error) {
      console.error('Error:', error)
      setToast({ message: 'Failed to load connector', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleDestination = (type) => {
    setFormData(prev => {
      const existingIndex = prev.destinations.findIndex(d => d.type === type)
      let destinations
      
      if (existingIndex >= 0) {
        // Remove destination
        destinations = prev.destinations.filter((_, i) => i !== existingIndex)
        // Remove config
        setDestinationConfigs(prev => {
          const newConfigs = { ...prev }
          delete newConfigs[type]
          return newConfigs
        })
      } else {
        // Add destination with default config
        const newDest = { type, enabled: true, config: destinationConfigs[type] || {} }
        destinations = [...prev.destinations, newDest]
      }
      
      return { ...prev, destinations }
    })
  }

  const updateDestinationConfig = (type, config) => {
    setDestinationConfigs(prev => ({
      ...prev,
      [type]: { ...prev[type], ...config }
    }))
    
    // Also update in formData destinations
    setFormData(prev => ({
      ...prev,
      destinations: prev.destinations.map(dest =>
        dest.type === type ? { ...dest, config: { ...dest.config, ...config } } : dest
      )
    }))
  }

  const getSelectedDestinations = () => {
    return formData.destinations.map(d => d.type)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setToast({ message: 'Name is required', type: 'error' })
      return
    }

    setSaving(true)
    try {
      // Merge destination configs into destinations array
      const destinationsWithConfig = formData.destinations.map(dest => ({
        ...dest,
        config: destinationConfigs[dest.type] || dest.config || {}
      }))

      const payload = {
        name: formData.name,
        description: formData.description,
        destinations: destinationsWithConfig,
        is_active: formData.is_active
      }

      console.log('📤 Updating connector with payload:', JSON.stringify(payload, null, 2))

      const response = await fetch(`/api/connectors/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.error) {
        setToast({ message: result.error, type: 'error' })
      } else {
        setToast({ message: 'Connector updated successfully!', type: 'success' })
        setConnector(result.data)
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (error) {
      console.error('❌ Error:', error)
      setToast({ message: 'Failed to save connector', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/connectors/${params.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.error) {
        setToast({ message: result.error, type: 'error' })
        setDeleting(false)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error:', error)
      setToast({ message: 'Failed to delete connector', type: 'error' })
      setDeleting(false)
    }
  }

  const copyWebhookUrl = async () => {
    if (connector?.webhook_url) {
      await navigator.clipboard.writeText(connector.webhook_url)
      setCopied(true)
      setToast({ message: 'Webhook URL copied!', type: 'success' })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a]">
        <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="skeleton h-6 w-40 rounded-lg" />
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="skeleton h-8 w-64 rounded-lg mb-8" />
          <div className="bg-slate-800/30 rounded-3xl border border-slate-700/50 p-8">
            <div className="skeleton h-6 w-48 rounded-lg mb-6" />
            <div className="space-y-6">
              <div className="skeleton h-12 w-full rounded-xl" />
              <div className="skeleton h-24 w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!connector) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Connector not found</h2>
          <p className="text-slate-400 mb-6">The connector you're looking for doesn't exist</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-medium">Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-medium"
              >
                Delete
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-500">Edit Connector</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-white">{connector.name}</span>
        </nav>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Edit Connector</h1>
          <p className="text-slate-400">Update your connector settings and destinations</p>
        </div>

        {/* Active Status Toggle */}
        <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Active Status</h3>
              <p className="text-sm text-slate-400">
                {formData.is_active 
                  ? 'This connector is active and accepting submissions' 
                  : 'This connector is inactive. Webhook will stop accepting submissions.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => {
                  if (!e.target.checked) {
                    if (!confirm('Are you sure you want to deactivate this connector? The webhook will stop accepting submissions.')) {
                      return
                    }
                  }
                  setFormData(prev => ({ ...prev, is_active: e.target.checked }))
                }}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Webhook URL Card */}
        <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Webhook URL</h3>
            <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-400">
              Active
            </span>
          </div>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm text-slate-300 font-mono truncate">
              {connector.webhook_url}
            </code>
            <button
              onClick={copyWebhookUrl}
              className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Details Section */}
        <div className="bg-slate-800/30 rounded-3xl border border-slate-700/50 p-8 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Connector Details</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Connector Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Contact Form, Newsletter Signup"
                className="w-full px-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                Description <span className="text-slate-500">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what this connector is for..."
                rows={3}
                className="w-full px-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Destinations Section */}
        <div className="bg-slate-800/30 rounded-3xl border border-slate-700/50 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white mb-2">Destinations</h2>
            <p className="text-slate-400 text-sm">Choose where form submissions should be sent</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {destinations.map((dest) => {
              const isSelected = getSelectedDestinations().includes(dest.type)
              const hasConfig = isSelected && destinationConfigs[dest.type] && Object.keys(destinationConfigs[dest.type]).length > 0
              
              return (
                <div key={dest.type} className="relative">
                  <DestinationCard
                    type={dest.type}
                    title={dest.title}
                    description={dest.description}
                    selected={isSelected}
                    onClick={() => toggleDestination(dest.type)}
                  />
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowConfigModal(dest.type)
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      {hasConfig ? '⚙️ Configured' : '⚙️ Configure'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {formData.destinations.length > 0 && (
            <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <p className="text-sm text-indigo-400">
                <span className="font-semibold">{formData.destinations.length}</span> destination{formData.destinations.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>

        {/* Destination Configuration Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfigModal(null)} />
            <div className="relative bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">
                  Configure {destinations.find(d => d.type === showConfigModal)?.title}
                </h3>
                <button
                  onClick={() => setShowConfigModal(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Google Sheets Configuration */}
              {showConfigModal === 'sheets' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-spreadsheetId" className="block text-sm font-medium text-slate-300 mb-2">
                      Spreadsheet ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      id="edit-spreadsheetId"
                      value={destinationConfigs.sheets?.spreadsheetId || ''}
                      onChange={(e) => updateDestinationConfig('sheets', { spreadsheetId: e.target.value })}
                      placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Find this in your Google Sheet URL
                    </p>
                  </div>

                  <div>
                    <label htmlFor="edit-sheetName" className="block text-sm font-medium text-slate-300 mb-2">
                      Sheet Name <span className="text-slate-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="edit-sheetName"
                      value={destinationConfigs.sheets?.sheetName || 'Form Submissions'}
                      onChange={(e) => updateDestinationConfig('sheets', { sheetName: e.target.value || 'Form Submissions' })}
                      placeholder="Form Submissions"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Slack Configuration */}
              {showConfigModal === 'slack' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-slackWebhookUrl" className="block text-sm font-medium text-slate-300 mb-2">
                      Webhook URL <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="url"
                      id="edit-slackWebhookUrl"
                      value={destinationConfigs.slack?.webhookUrl || ''}
                      onChange={(e) => updateDestinationConfig('slack', { webhookUrl: e.target.value })}
                      placeholder="Enter your Slack webhook URL"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      Get your webhook URL from Slack → Apps → Incoming Webhooks
                    </p>
                  </div>
                </div>
              )}

              {/* Email Configuration - placeholder */}
              {showConfigModal === 'email' && (
                <div className="text-center py-8">
                  <p className="text-slate-400">Email configuration will be added soon</p>
                </div>
              )}

              {/* Other destinations - placeholder */}
              {!['sheets', 'slack', 'email'].includes(showConfigModal) && (
                <div className="text-center py-8">
                  <p className="text-slate-400">Configuration for this destination type coming soon</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowConfigModal(null)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Delete Connector</h3>
              <p className="text-slate-400">
                Are you sure you want to delete <span className="text-white font-medium">{connector.name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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

