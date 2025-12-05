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
    destinations: []
  })
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
        setFormData({
          name: result.data.name || '',
          description: result.data.description || '',
          destinations: result.data.destinations || []
        })
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
      const destinations = prev.destinations.includes(type)
        ? prev.destinations.filter(d => d !== type)
        : [...prev.destinations, type]
      return { ...prev, destinations }
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setToast({ message: 'Name is required', type: 'error' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/connectors/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.error) {
        setToast({ message: result.error, type: 'error' })
      } else {
        setToast({ message: 'Connector saved successfully!', type: 'success' })
        setConnector(result.data)
      }
    } catch (error) {
      console.error('Error:', error)
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
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Edit Connector</h1>
          <p className="text-slate-400">Update your connector settings and destinations</p>
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
            {destinations.map((dest) => (
              <DestinationCard
                key={dest.type}
                type={dest.type}
                title={dest.title}
                description={dest.description}
                selected={formData.destinations.includes(dest.type)}
                onClick={() => toggleDestination(dest.type)}
              />
            ))}
          </div>

          {formData.destinations.length > 0 && (
            <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <p className="text-sm text-indigo-400">
                <span className="font-semibold">{formData.destinations.length}</span> destination{formData.destinations.length !== 1 ? 's' : ''} selected
              </p>
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

