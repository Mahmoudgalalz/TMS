import { useState } from 'react'
import { useTicketsStore } from '../stores/tickets'
import { useUIStore } from '../stores/ui'
import { TicketStatus } from '@service-ticket/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileDown, Download } from 'lucide-react'

const CSVExport = () => {
  const { tickets, fetchTickets } = useTicketsStore()
  const { addNotification } = useUIStore()
  const [exportStatus, setExportStatus] = useState<TicketStatus | 'all'>(TicketStatus.OPEN)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Fetch tickets with the selected status filter
      await fetchTickets({ status: exportStatus === 'all' ? undefined : exportStatus })
      
      // Filter tickets based on status
      const filteredTickets = exportStatus === 'all' 
        ? tickets 
        : tickets.filter(ticket => ticket.status === exportStatus)

      if (filteredTickets.length === 0) {
        addNotification({
          type: 'warning',
          title: 'No tickets to export',
          message: `No ${exportStatus} tickets found to export.`
        })
        return
      }

      // Create CSV content
      const headers = ['Ticket Number', 'Title', 'Description', 'Status', 'Severity', 'Category', 'Created Date', 'Due Date']
      const csvContent = [
        headers.join(','),
        ...filteredTickets.map(ticket => [
          ticket.ticketNumber,
          `"${ticket.title.replace(/"/g, '""')}"`,
          `"${ticket.description.replace(/"/g, '""')}"`,
          ticket.status,
          ticket.severity || 'MEDIUM',
          'general',
          new Date(ticket.createdAt).toISOString().split('T')[0],
          ticket.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : ''
        ].join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `tickets-${exportStatus}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      addNotification({
        type: 'success',
        title: 'Export successful',
        message: `Exported ${filteredTickets.length} ${exportStatus} tickets to CSV.`
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export failed',
        message: 'Failed to export tickets. Please try again.'
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Export Tickets</h1>
        <p className="text-gray-600">Export tickets to CSV format for external processing.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileDown className="mr-2 h-5 w-5" />
            CSV Export Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Status Filter
            </label>
            <Select value={exportStatus} onValueChange={(value: any) => setExportStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status to export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TicketStatus.DRAFT}>Draft Tickets Only</SelectItem>
                <SelectItem value={TicketStatus.REVIEW}>Review Tickets Only</SelectItem>
                <SelectItem value={TicketStatus.PENDING}>Pending Tickets Only</SelectItem>
                <SelectItem value={TicketStatus.OPEN}>Open Tickets Only</SelectItem>
                <SelectItem value={TicketStatus.CLOSED}>Closed Tickets Only</SelectItem>
                <SelectItem value="all">All Tickets</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1 text-sm text-gray-500">
              Choose which tickets to include in the export based on their status.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Export Information</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• CSV will include ticket number, title, description, status, priority, and dates</li>
              <li>• File will be downloaded automatically to your default download folder</li>
              <li>• Filename format: tickets-{exportStatus}-YYYY-MM-DD.csv</li>
            </ul>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exporting...' : 'Export to CSV'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CSVExport
