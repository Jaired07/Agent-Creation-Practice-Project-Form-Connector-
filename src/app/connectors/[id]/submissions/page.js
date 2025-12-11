'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Toast from '@/components/Toast'

/**
 * Submission History Page
 * 
 * Displays all form submissions for a specific connector with:
 * - Table view with timestamp, preview, destinations status
 * - Expandable rows showing full submission details
 * - Pagination (20 per page)
 * - Date range filters
 * - Destination status filters
 * - Search functionality
 * - CSV export
 */
export default function SubmissionsPage() {
  const params = useParams()
  const router = useRouter()
  const connectorId = params.id

  const [submissions, setSubmissions] = useState([])
  const [connector, setConnector] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [dateFilter, setDateFilter] = useState('all') // '7days', '30days', 'all'
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'success', 'failure'
  const [searchQuery, setSearchQuery] = useState('')
  const [showRawJson, setShowRawJson] = useState({})

  const submissionsPerPage = 20

  useEffect(() => {
    fetchConnector()
    fetchSubmissions()
  }, [connectorId])

  const fetchConnector = async () => {
    try {
      const response = await fetch(`/api/connectors/${connectorId}`)
      const result = await response.json()
      if (result.data) {
        setConnector(result.data)
      }
    } catch (err) {
      console.error('Error fetching connector:', err)
    }
  }

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/submissions?connectorId=${connectorId}`)
      const result = await response.json()
      
      if (result.error) {
        setError(result.error)
      } else {
        setSubmissions(result.data || [])
      }
    } catch (err) {
      setError('Failed to fetch submissions')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatDateShort = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getDateFilteredSubmissions = () => {
    if (dateFilter === 'all') return submissions

    const now = new Date()
    const daysAgo = dateFilter === '7days' ? 7 : 30
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    return submissions.filter(sub => new Date(sub.created_at) >= cutoffDate)
  }

  const getStatusFilteredSubmissions = () => {
    const dateFiltered = getDateFilteredSubmissions()
    
    if (statusFilter === 'all') return dateFiltered

    return dateFiltered.filter(sub => {
      const destinations = sub.destinations_sent || {}
      const destinationTypes = Object.keys(destinations)
      
      if (statusFilter === 'success') {
        return destinationTypes.some(type => destinations[type]?.success === true)
      } else if (statusFilter === 'failure') {
        return destinationTypes.some(type => destinations[type]?.success === false)
      }
      
      return true
    })
  }

  const getSearchFilteredSubmissions = () => {
    const statusFiltered = getStatusFilteredSubmissions()
    
    if (!searchQuery.trim()) return statusFiltered

    const query = searchQuery.toLowerCase()
    return statusFiltered.filter(sub => {
      // Search in form data
      const formData = sub.form_data || {}
      return Object.values(formData).some(value => 
        String(value).toLowerCase().includes(query)
      )
    })
  }

  const filteredSubmissions = getSearchFilteredSubmissions()
  const totalPages = Math.ceil(filteredSubmissions.length / submissionsPerPage)
  const startIndex = (currentPage - 1) * submissionsPerPage
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + submissionsPerPage)

  const getDestinationStatus = (submission) => {
    const destinations = submission.destinations_sent || {}
    const statuses = {}
    
    Object.entries(destinations).forEach(([type, result]) => {
      if (result?.success === true) {
        statuses[type] = 'success'
      } else if (result?.success === false) {
        statuses[type] = 'failure'
      } else {
        statuses[type] = 'pending'
      }
    })
    
    return statuses
  }

  const getPreviewFields = (formData) => {
    const entries = Object.entries(formData || {})
    return entries.slice(0, 3).map(([key, value]) => ({
      key,
      value: String(value).substring(0, 50) // Truncate long values
    }))
  }

  const exportToCSV = () => {
    const csvRows = []
    
    // Header row
    const headers = ['Timestamp', 'Connector Name']
    const allFieldNames = new Set()
    filteredSubmissions.forEach(sub => {
      Object.keys(sub.form_data || {}).forEach(key => allFieldNames.add(key))
    })
    headers.push(...Array.from(allFieldNames))
    headers.push('Destinations Status', 'Errors')
    csvRows.push(headers.join(','))
    
    // Data rows
    filteredSubmissions.forEach(sub => {
      const row = [
        formatDate(sub.created_at),
        connector?.name || '',
      ]
      
      allFieldNames.forEach(fieldName => {
        const value = sub.form_data?.[fieldName] || ''
        // Escape commas and quotes in CSV
        const escapedValue = String(value).replace(/"/g, '""')
        row.push(`"${escapedValue}"`)
      })
      
      const destinations = sub.destinations_sent || {}
      const statusText = Object.entries(destinations)
        .map(([type, result]) => {
          if (result?.success === true) return `${type}: success`
          if (result?.success === false) return `${type}: failed`
          return `${type}: pending`
        })
        .join('; ')
      row.push(`"${statusText}"`)
      
      const errors = Object.entries(destinations)
        .filter(([_, result]) => result?.error)
        .map(([type, result]) => `${type}: ${result.error}`)
        .join('; ')
      row.push(`"${errors || 'none'}"`)
      
      csvRows.push(row.join(','))
    })
    
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `submissions-${connector?.name || 'connector'}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setToast({ message: 'CSV exported successfully!', type: 'success' })
  }

  const destinationIcons = {
    email: '📧',
    slack: '💬',
    sheets: '📊',
    sms: '📱',
    webhook: '🔗',
  }

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Back to Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-slate-700" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {connector?.name || 'Loading...'} - Submissions
                </h1>
                <p className="text-slate-400 mt-1">
                  {loading ? 'Loading...' : `${filteredSubmissions.length} submission${filteredSubmissions.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Filters */}
        <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Date Range</label>
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success Only</option>
                <option value="failure">Failures Only</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search submissions..."
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {/* Export Button */}
            <div className="flex items-end">
              <button
                onClick={exportToCSV}
                disabled={filteredSubmissions.length === 0}
                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Submissions Table */}
        {loading ? (
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-12 text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading submissions...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
            <p className="text-red-400 font-medium mb-2">Error loading submissions</p>
            <p className="text-red-400/70 text-sm mb-4">{error}</p>
            <button
              onClick={fetchSubmissions}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 p-12 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No submissions found</h3>
            <p className="text-slate-400">
              {searchQuery || dateFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No submissions have been received yet for this connector'}
            </p>
          </div>
        ) : (
          <div className="bg-slate-800/30 rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Preview</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Destinations</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {paginatedSubmissions.map((submission, index) => {
                    const isExpanded = expandedRow === submission.id
                    const statuses = getDestinationStatus(submission)
                    const previewFields = getPreviewFields(submission.form_data)

                    return (
                      <>
                        <tr
                          key={submission.id}
                          className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-800/50' : ''}`}
                          onClick={() => setExpandedRow(isExpanded ? null : submission.id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white">{formatDateShort(submission.created_at)}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-300 space-y-1">
                              {previewFields.map((field, idx) => (
                                <div key={idx}>
                                  <span className="text-slate-500">{field.key}:</span>{' '}
                                  <span className="text-white">{field.value}{field.value.length >= 50 ? '...' : ''}</span>
                                </div>
                              ))}
                              {Object.keys(submission.form_data || {}).length > 3 && (
                                <div className="text-xs text-slate-500">
                                  +{Object.keys(submission.form_data || {}).length - 3} more fields
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(statuses).map(([type, status]) => (
                                <span
                                  key={type}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                                    status === 'success'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : status === 'failure'
                                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}
                                  title={status === 'success' ? 'Success' : status === 'failure' ? 'Failed' : 'Pending'}
                                >
                                  {status === 'success' ? '✅' : status === 'failure' ? '❌' : '⏳'}
                                  {destinationIcons[type] || '📋'} {type}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedRow(isExpanded ? null : submission.id)
                              }}
                              className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                              {isExpanded ? 'Hide Details' : 'View Details'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${submission.id}-expanded`} className="bg-slate-900/30">
                            <td colSpan={4} className="px-6 py-6">
                              <div className="space-y-6">
                                {/* Form Data */}
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-3">Form Data</h4>
                                  <div className="bg-slate-900/50 rounded-xl p-4 space-y-2">
                                    {Object.entries(submission.form_data || {}).map(([key, value]) => (
                                      <div key={key} className="flex border-b border-slate-700/50 pb-2 last:border-0">
                                        <div className="w-1/4 text-sm font-medium text-slate-400">{key}</div>
                                        <div className="flex-1 text-sm text-white">{String(value || '(empty)')}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Destinations Status */}
                                <div>
                                  <h4 className="text-sm font-semibold text-white mb-3">Destinations Status</h4>
                                  <div className="bg-slate-900/50 rounded-xl p-4 space-y-3">
                                    {Object.entries(submission.destinations_sent || {}).map(([type, result]) => (
                                      <div key={type} className="flex items-start gap-3">
                                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                          result?.success === true
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : result?.success === false
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'bg-amber-500/20 text-amber-400'
                                        }`}>
                                          {result?.success === true ? '✅' : result?.success === false ? '❌' : '⏳'}
                                        </div>
                                        <div className="flex-1">
                                          <div className="text-sm font-medium text-white capitalize">{type}</div>
                                          {result?.error && (
                                            <div className="text-xs text-red-400 mt-1">{result.error}</div>
                                          )}
                                          {result?.timestamp && (
                                            <div className="text-xs text-slate-500 mt-1">
                                              Processed: {formatDate(result.timestamp)}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Raw JSON */}
                                <div>
                                  <button
                                    onClick={() => setShowRawJson(prev => ({
                                      ...prev,
                                      [submission.id]: !prev[submission.id]
                                    }))}
                                    className="text-sm text-slate-400 hover:text-white font-medium mb-2"
                                  >
                                    {showRawJson[submission.id] ? 'Hide' : 'Show'} Raw JSON
                                  </button>
                                  {showRawJson[submission.id] && (
                                    <pre className="bg-slate-900/50 rounded-xl p-4 overflow-x-auto text-xs text-slate-300">
                                      {JSON.stringify(submission, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Showing {startIndex + 1} to {Math.min(startIndex + submissionsPerPage, filteredSubmissions.length)} of {filteredSubmissions.length} submissions
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-slate-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

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

