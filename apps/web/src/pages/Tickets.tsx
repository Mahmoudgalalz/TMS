import { useState } from 'react'
import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { ticketsApi } from '../services/api'
import { TicketStatus, TicketPriority, TicketQuery } from '@service-ticket/types'

const Tickets = () => {
  const [query, setQuery] = useState<TicketQuery>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const { data, isLoading, refetch } = useQuery(
    ['tickets', query],
    () => ticketsApi.getTickets(query),
    { keepPreviousData: true }
  )

  const tickets = data?.data?.items || []
  const totalPages = data?.data?.totalPages || 1

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return 'bg-green-100 text-green-800'
      case TicketStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800'
      case TicketStatus.PENDING:
        return 'bg-orange-100 text-orange-800'
      case TicketStatus.RESOLVED:
        return 'bg-blue-100 text-blue-800'
      case TicketStatus.CLOSED:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case TicketPriority.LOW:
        return 'text-green-600'
      case TicketPriority.MEDIUM:
        return 'text-yellow-600'
      case TicketPriority.HIGH:
        return 'text-orange-600'
      case TicketPriority.URGENT:
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
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
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
            value={query.status?.[0] || ''}
            onChange={(e) =>
              setQuery({ ...query, status: e.target.value ? [e.target.value as TicketStatus] : undefined })
            }
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            {Object.values(TicketStatus).map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
          <select
            value={query.priority?.[0] || ''}
            onChange={(e) =>
              setQuery({ ...query, priority: e.target.value ? [e.target.value as TicketPriority] : undefined })
            }
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">All Priorities</option>
            {Object.values(TicketPriority).map((priority) => (
              <option key={priority} value={priority}>
                {priority.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
                        <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                        <span className="mx-2">•</span>
                        <span>{ticket.category}</span>
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
