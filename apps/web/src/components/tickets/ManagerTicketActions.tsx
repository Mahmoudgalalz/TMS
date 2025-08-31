import { useState } from 'react'
import { Ticket, TicketSeverity, TicketStatus } from '@service-ticket/types'
import { useTicketsStore } from '../../stores/tickets'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle } from 'lucide-react'

interface ManagerTicketActionsProps {
  ticket: Ticket
  onUpdate?: () => void
}

const ManagerTicketActions = ({ ticket, onUpdate }: ManagerTicketActionsProps) => {
  const { updateTicket, approveTicket, loading } = useTicketsStore()
  const { addNotification } = useUIStore()
  const { user } = useAuthStore()
  const [selectedSeverity, setSelectedSeverity] = useState<TicketSeverity>(ticket.severity)
  const [reason, setReason] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Check if Manager can perform actions on this ticket
  const canManage = user?.role === 'manager' && ticket.createdById !== user.id
  const canApprove = canManage && (ticket.status === TicketStatus.DRAFT || ticket.status === TicketStatus.REVIEW)
  const canChangeSeverity = canManage

  const handleSeverityChange = async () => {
    if (!reason.trim()) {
      addNotification({
        type: 'error',
        title: 'Please provide a reason for severity change'
      })
      return
    }

    setIsUpdating(true)
    try {
      await updateTicket(ticket.id, {
        severity: selectedSeverity,
        reason: reason.trim()
      })
      
      addNotification({
        type: 'success',
        title: 'Ticket severity updated successfully'
      })
      setReason('')
      onUpdate?.()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to update ticket severity'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleApprove = async () => {
    setIsUpdating(true)
    try {
      await approveTicket(ticket.id)
      addNotification({
        type: 'success',
        title: 'Ticket approved successfully'
      })
      onUpdate?.()
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Failed to approve ticket'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-amber-600">Manager Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">You cannot manage tickets you created.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Manager Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Status
          </label>
          <Badge variant={ticket.status === TicketStatus.DRAFT ? 'secondary' : 
                        ticket.status === TicketStatus.REVIEW ? 'destructive' : 'default'}>
            {ticket.status}
          </Badge>
        </div>

        {/* Severity Change Section */}
        {canChangeSeverity && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Severity
              </label>
              <Select 
                value={selectedSeverity} 
                onValueChange={(value) => setSelectedSeverity(value as TicketSeverity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TicketSeverity.EASY}>Easy</SelectItem>
                  <SelectItem value={TicketSeverity.LOW}>Low</SelectItem>
                  <SelectItem value={TicketSeverity.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TicketSeverity.HIGH}>High</SelectItem>
                  <SelectItem value={TicketSeverity.VERY_HIGH}>Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedSeverity !== ticket.severity && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Change *
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why you're changing the severity..."
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Changing severity will move the ticket to <strong>Review</strong> status, 
                    requiring the Associate to re-evaluate and resubmit.
                  </p>
                </div>

                <Button
                  onClick={handleSeverityChange}
                  disabled={!reason.trim() || isUpdating || loading}
                  className="w-full"
                >
                  {isUpdating ? 'Updating...' : 'Update Severity'}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Approval Section */}
        {canApprove && (
          <div className="space-y-4 border-t pt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-medium text-green-800">Approve Ticket</h4>
              </div>
              <p className="text-sm text-green-700">
                Approve this ticket as-is to move it to <strong>Pending</strong> status, 
                making it ready for CSV export to external support team.
              </p>
            </div>

            <Button
              onClick={handleApprove}
              disabled={isUpdating || loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? 'Approving...' : 'Approve Ticket'}
            </Button>
          </div>
        )}

        {!canApprove && !canChangeSeverity && (
          <div className="text-center py-4">
            <p className="text-gray-500">No actions available for this ticket status.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ManagerTicketActions
