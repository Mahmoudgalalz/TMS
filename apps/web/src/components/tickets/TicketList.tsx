import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTicketsStore } from '../../stores/tickets'
import { useAuthStore } from '../../stores/auth'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Filter, Plus, Eye } from 'lucide-react'
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils'

const TicketList = () => {
  const { tickets, loading, fetchTickets, filters, setFilters } = useTicketsStore()
  const { user } = useAuthStore()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ ...filters, search: searchTerm })
    fetchTickets({ ...filters, search: searchTerm })
  }

  const filteredTickets = tickets.filter(ticket => {
    if (user?.role === 'associate') {
      return ticket.createdById === user.id
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <Link to="/tickets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button type="submit">Search</Button>
            <Button variant="outline" type="button">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tickets Grid */}
      <div className="grid gap-4">
        {filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-gray-500">No tickets found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {ticket.title}
                      </h3>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                      <Badge className={getPriorityColor(ticket.severity)}>
                        {ticket.severity}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>#{ticket.ticketNumber}</span>
                      <span>Created {formatDate(ticket.createdAt)}</span>
                      {ticket.dueDate && (
                        <span>Due {formatDate(ticket.dueDate)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link to={`/tickets/${ticket.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export default TicketList
