import { useEffect, useState } from 'react'
import { useTicketsStore } from '../stores/tickets'
import { TicketStatus } from '@service-ticket/types'
import { Ticket, Clock, TrendingUp, BarChart3 } from 'lucide-react'

interface DashboardStats {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  avgResolutionTime: number
  ticketsByPriority: Record<string, number>
  ticketsByCategory: Record<string, number>
  recentActivity: Array<{
    id: string
    description: string
    userName: string
    timestamp: string
  }>
}

const Dashboard = () => {
  const { tickets, fetchTickets, loading } = useTicketsStore()
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    avgResolutionTime: 0,
    ticketsByPriority: {},
    ticketsByCategory: {},
    recentActivity: []
  })

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    if (tickets.length > 0) {
      const totalTickets = tickets.length
      const draftTickets = tickets.filter(t => t.status === TicketStatus.DRAFT).length
      const reviewTickets = tickets.filter(t => t.status === TicketStatus.REVIEW).length
      const pendingTickets = tickets.filter(t => t.status === TicketStatus.PENDING).length
      const openTickets = tickets.filter(t => t.status === TicketStatus.OPEN).length
      const closedTickets = tickets.filter(t => t.status === TicketStatus.CLOSED).length
      
      const severityCounts = tickets.reduce((acc, ticket) => {
        const severity = ticket.severity
        acc[severity] = (acc[severity] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Mock recent activity from tickets
      const recentActivity = tickets
        .slice(0, 5)
        .map(ticket => ({
          id: ticket.id,
          description: `Ticket "${ticket.title}" was ${ticket.status}`,
          userName: 'System',
          timestamp: new Date(ticket.updatedAt).toISOString() || new Date(ticket.createdAt).toISOString()
        }))

      setStats({
        totalTickets,
        openTickets,
        inProgressTickets: pendingTickets, // Map pending to in-progress for display
        resolvedTickets: closedTickets, // Map closed to resolved for display
        avgResolutionTime: 2.5, // Mock average
        ticketsByPriority: severityCounts,
        ticketsByCategory: {},
        recentActivity
      })
    }
  }, [tickets])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your service ticket management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Ticket className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Tickets
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalTickets}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Open Tickets
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.openTickets}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    In Progress
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.inProgressTickets}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Resolved
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.resolvedTickets}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, activityIdx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {activityIdx !== stats.recentActivity.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                            <span className="text-white text-xs font-medium">
                              {activity.userName.charAt(0)}
                            </span>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-500">
                              {activity.description}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-center py-4 text-gray-500">
                  No recent activity
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
