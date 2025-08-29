import { useEffect, useState } from 'react'
import { useTicketsStore } from '../stores/tickets'
import { TicketStatus, TicketSeverity } from '@service-ticket/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, PieChart, TrendingUp, Clock } from 'lucide-react'

interface AnalyticsData {
  statusDistribution: Record<string, number>
  severityDistribution: Record<string, number>
  monthlyTrends: Array<{ month: string; created: number; resolved: number }>
  avgResolutionTime: number
  topCategories: Array<{ category: string; count: number }>
}

const Analytics = () => {
  const { tickets, fetchTickets, loading } = useTicketsStore()
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    statusDistribution: {},
    severityDistribution: {},
    monthlyTrends: [],
    avgResolutionTime: 0,
    topCategories: []
  })

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  useEffect(() => {
    if (tickets.length > 0) {
      // Calculate status distribution
      const statusDistribution = tickets.reduce((acc, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Calculate severity distribution
      const severityDistribution = tickets.reduce((acc, ticket) => {
        acc[ticket.severity] = (acc[ticket.severity] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      // Mock monthly trends (in real app, this would come from API)
      const monthlyTrends = [
        { month: 'Jan', created: 15, resolved: 12 },
        { month: 'Feb', created: 22, resolved: 18 },
        { month: 'Mar', created: 18, resolved: 20 },
        { month: 'Apr', created: 25, resolved: 22 },
        { month: 'May', created: 30, resolved: 28 },
        { month: 'Jun', created: 28, resolved: 25 }
      ]

      // Mock top categories
      const topCategories = [
        { category: 'Technical Issues', count: 45 },
        { category: 'Account Problems', count: 32 },
        { category: 'Feature Requests', count: 28 },
        { category: 'Bug Reports', count: 22 },
        { category: 'General Inquiry', count: 18 }
      ]

      setAnalytics({
        statusDistribution,
        severityDistribution,
        monthlyTrends,
        avgResolutionTime: 2.3,
        topCategories
      })
    }
  }, [tickets])

  const getStatusColor = (status: string) => {
    switch (status) {
      case TicketStatus.OPEN:
        return 'bg-blue-100 text-blue-800'
      case TicketStatus.IN_PROGRESS:
        return 'bg-yellow-100 text-yellow-800'
      case TicketStatus.RESOLVED:
        return 'bg-green-100 text-green-800'
      case TicketStatus.CLOSED:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case TicketSeverity.LOW:
        return 'bg-green-100 text-green-800'
      case TicketSeverity.EASY:
        return 'bg-green-100 text-green-800'
      case TicketSeverity.MEDIUM:
        return 'bg-yellow-100 text-yellow-800'
      case TicketSeverity.HIGH:
        return 'bg-orange-100 text-orange-800'
      case TicketSeverity.VERY_HIGH:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Insights and metrics for your service tickets.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.avgResolutionTime} days</div>
            <p className="text-xs text-muted-foreground">
              -8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2/5</div>
            <p className="text-xs text-muted-foreground">
              +0.3 from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.statusDistribution).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(status)}>
                      {status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(count / tickets.length) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analytics.severityDistribution).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getSeverityColor(severity)}>
                      {severity}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{
                          width: `${(count / tickets.length) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Ticket Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.monthlyTrends.map((trend) => (
              <div key={trend.month} className="flex items-center justify-between">
                <div className="font-medium">{trend.month}</div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">Created: {trend.created}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Resolved: {trend.resolved}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topCategories.map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium">{category.category}</span>
                </div>
                <span className="text-sm text-gray-500">{category.count} tickets</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analytics
