import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTicketsStore } from '../stores/tickets'
import { TicketStatus, Ticket } from '@service-ticket/types'

export default function ImportedTickets() {
  const { tickets, fetchTickets, loading } = useTicketsStore()
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open')

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Filter tickets that were imported (Open or Closed status)
  const importedTickets = tickets.filter(ticket => 
    ticket.status === TicketStatus.OPEN || ticket.status === TicketStatus.CLOSED
  )

  const openTickets = importedTickets.filter(ticket => ticket.status === TicketStatus.OPEN)
  const closedTickets = importedTickets.filter(ticket => ticket.status === TicketStatus.CLOSED)

  const currentTickets = activeTab === 'open' ? openTickets : closedTickets

  const getStatusBadge = (status: TicketStatus) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (status) {
      case TicketStatus.OPEN:
        return `${baseClasses} bg-green-100 text-green-800`
      case TicketStatus.CLOSED:
        return `${baseClasses} bg-gray-100 text-gray-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getSeverityBadge = (severity: string) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full'
    switch (severity?.toLowerCase()) {
      case 'critical':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'high':
        return `${baseClasses} bg-orange-100 text-orange-800`
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'low':
        return `${baseClasses} bg-blue-100 text-blue-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Imported Tickets</h1>
        <div className="text-sm text-gray-600">
          Total Imported: {importedTickets.length} tickets
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('open')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'open'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Open Tickets ({openTickets.length})
          </button>
          <button
            onClick={() => setActiveTab('closed')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'closed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Closed Tickets ({closedTickets.length})
          </button>
        </nav>
      </div>

      {/* Tickets List */}
      {currentTickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            No {activeTab} imported tickets found
          </div>
          <p className="text-gray-400 mt-2">
            Tickets with {activeTab} status from CSV imports will appear here
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {currentTickets.map((ticket: Ticket) => (
              <li key={ticket.id}>
                <Link
                  to={`/tickets/${ticket.id}`}
                  className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <span className="text-sm font-medium text-blue-600">
                          #{ticket.ticketNumber}
                        </span>
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {ticket.title}
                          </p>
                          <span className={getStatusBadge(ticket.status as TicketStatus)}>
                            {ticket.status}
                          </span>
                          <span className={getSeverityBadge(ticket.severity)}>
                            {ticket.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-1">
                          {ticket.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="text-sm text-gray-500">
                        {ticket.dueDate && (
                          <div>Due: {new Date(ticket.dueDate).toLocaleDateString()}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          Updated: {new Date(ticket.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary Stats */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Import Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Open Tickets:</span>
            <span className="ml-2 font-medium text-green-600">{openTickets.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Closed Tickets:</span>
            <span className="ml-2 font-medium text-gray-600">{closedTickets.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
