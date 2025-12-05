'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function NewConnector() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destinations: []
  })
  const [loading, setLoading] = useState(false)
  const [createdConnector, setCreatedConnector] = useState(null)
  const [toast, setToast] = useState(null)
  const [copied, setCopied] = useState(false)

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

  const handleNext = () => {
    if (step === 1 && formData.name.trim()) {
      setStep(2)
    } else if (step === 2) {
      handleSubmit()
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.error) {
        setToast({ message: result.error, type: 'error' })
        setLoading(false)
      } else {
        setCreatedConnector(result.data)
        setStep(3)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error:', error)
      setToast({ message: 'Failed to create connector', type: 'error' })
      setLoading(false)
    }
  }

  const copyWebhookUrl = async () => {
    if (createdConnector?.webhook_url) {
      await navigator.clipboard.writeText(createdConnector.webhook_url)
      setCopied(true)
      setToast({ message: 'Webhook URL copied to clipboard!', type: 'success' })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const steps = [
    { number: 1, name: 'Details', description: 'Name your connector' },
    { number: 2, name: 'Destinations', description: 'Choose where to send data' },
    { number: 3, name: 'Complete', description: 'Get your webhook URL' },
  ]

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
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-white mb-3">Create New Connector</h1>
          <p className="text-slate-400">Set up a new form connector in just a few steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-700" />
            <div 
              className="absolute top-6 left-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
            
            {steps.map((s, index) => (
              <div key={s.number} className="relative flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-semibold text-sm transition-all duration-300 z-10 ${
                    step > s.number
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                      : step === s.number
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 animate-pulse-glow'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}
                >
                  {step > s.number ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.number
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className={`text-sm font-medium ${step >= s.number ? 'text-white' : 'text-slate-500'}`}>
                    {s.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="animate-fade-in">
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="bg-slate-800/30 rounded-3xl border border-slate-700/50 p-8">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-2">Connector Details</h2>
                <p className="text-slate-400">Give your connector a name and optional description</p>
              </div>
              
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
                    rows={4}
                    className="w-full px-4 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!formData.name.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-indigo-500/25"
                >
                  Continue
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Destinations */}
          {step === 2 && (
            <div className="bg-slate-800/30 rounded-3xl border border-slate-700/50 p-8">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-2">Choose Destinations</h2>
                <p className="text-slate-400">Select where you want form submissions to be sent</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {destinations.map((dest, index) => (
                  <div key={dest.type} className={`animate-fade-in stagger-${index + 1}`}>
                    <DestinationCard
                      type={dest.type}
                      title={dest.title}
                      description={dest.description}
                      selected={formData.destinations.includes(dest.type)}
                      onClick={() => toggleDestination(dest.type)}
                    />
                  </div>
                ))}
              </div>

              {formData.destinations.length > 0 && (
                <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <p className="text-sm text-indigo-400">
                    <span className="font-semibold">{formData.destinations.length}</span> destination{formData.destinations.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Connector
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && createdConnector && (
            <div className="bg-slate-800/30 rounded-3xl border border-slate-700/50 p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Connector Created!</h2>
                <p className="text-slate-400">Your connector is ready to receive form submissions</p>
              </div>

              <div className="bg-slate-900/50 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-300">Your Webhook URL</h3>
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-medium text-emerald-400">
                    Ready to use
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <code className="flex-1 px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 font-mono break-all">
                    {createdConnector.webhook_url}
                  </code>
                  <button
                    onClick={copyWebhookUrl}
                    className={`flex-shrink-0 px-5 py-3.5 rounded-xl text-sm font-medium transition-all ${
                      copied
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy URL'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Use this URL as your form action or send POST requests to it
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => {
                    setStep(1)
                    setFormData({ name: '', description: '', destinations: [] })
                    setCreatedConnector(null)
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors"
                >
                  Create Another
                </button>
              </div>
            </div>
          )}
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
