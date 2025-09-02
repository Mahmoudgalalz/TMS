import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { PlusIcon, FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { ticketsApi, csvApi } from '../services/api'
import { TicketStatus, TicketSeverity, TicketFilterDto, Ticket } from '@service-ticket/types'

const Tickets = () => {
  const [query, setQuery] = useState<TicketFilterDto>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await csvApi.exportTickets()
      const { fileName } = response.data
      
      // Download the file
      const downloadResponse = await csvApi.downloadCsv(fileName)
      const blob = new Blob([downloadResponse.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['tickets', query],
    queryFn: () => ticketsApi.getTickets(query),
    placeholderData: (previousData) => previousData
  })

  console.log('Tickets query result:', { data, isLoading, error })

  const tickets = (Array.isArray(data?.data) ? data.data : []) as Ticket[]
  console.log('hi')
  const totalPages = data?.pagination?.totalPages || 1

  console.log('Processed tickets:', tickets)

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.DRAFT:
        return 'bg-gray-100 text-gray-800'
      case TicketStatus.REVIEW:
        return 'bg-purple-100 text-purple-800'
      case TicketStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case TicketStatus.OPEN:
        return 'bg-green-100 text-green-800'
      case TicketStatus.CLOSED:
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: TicketSeverity) => {
    switch (severity) {
      case TicketSeverity.LOW:
        return 'text-green-600'
      case TicketSeverity.EASY:
        return 'text-slate-600'
      case TicketSeverity.MEDIUM:
        return 'text-yellow-600'
      case TicketSeverity.HIGH:
        return 'text-orange-600'
      
      case TicketSeverity.VERY_HIGH:
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Tickets</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all service tickets in your system.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <Link
            to="/tickets/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Ticket
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={query.status || ''}
            onChange={(e) =>
              setQuery({ ...query, status: e.target.value ? e.target.value as TicketStatus : undefined })
            }
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            {Object.values(TicketStatus).map((status: string) => (
              <option key={status} value={status}>
                {status.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
          <select
            value={query.severity || ''}
            onChange={(e) =>
              setQuery({ ...query, severity: e.target.value ? e.target.value as TicketSeverity : undefined })
            }
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">All Severities</option>
            {Object.values(TicketSeverity).map((severity: string) => (
              <option key={severity} value={severity}>
                {severity.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
        <p className="text-sm text-yellow-800">
          Debug: Found {tickets.length} tickets. Loading: {isLoading ? 'Yes' : 'No'}
        </p>
        <p className="text-xs text-yellow-600 mt-1">
          Data structure: {JSON.stringify(data, null, 2)}
        </p>
      </div>

      {/* Tickets List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {tickets.length === 0 && !isLoading ? (
          <div className="p-6 text-center text-gray-500">
            No tickets found. {error ? `Error: ${error.message}` : ''}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                to={`/tickets/${ticket.id}`}
                className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-primary-600 truncate">
                        {ticket.title}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className={`font-medium ${getSeverityColor(ticket.severity)}`}>
                          {ticket.severity.toUpperCase()}
                        </span>
                        <span className="mx-2">•</span>
                        <span>#{ticket.ticketNumber}</span>
                        <span className="mx-2">•</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setQuery({ ...query, page: Math.max(1, (query.page || 1) - 1) })}
            disabled={query.page === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {query.page} of {totalPages}
          </span>
          <button
            onClick={() => setQuery({ ...query, page: Math.min(totalPages, (query.page || 1) + 1) })}
            disabled={query.page === totalPages}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default Tickets
