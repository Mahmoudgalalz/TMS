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

  // Helper function to get severity level for comparison
  const getSeverityLevel = (severity: TicketSeverity): number => {
    const levels = {
      [TicketSeverity.EASY]: 1,
      [TicketSeverity.LOW]: 2,
      [TicketSeverity.MEDIUM]: 3,
      [TicketSeverity.HIGH]: 4,
      [TicketSeverity.VERY_HIGH]: 5,
    }
    return levels[severity] || 3
  }

  // Get the impact of severity change
  const getSeverityChangeImpact = () => {
    const currentLevel = getSeverityLevel(ticket.severity)
    const newLevel = getSeverityLevel(selectedSeverity)
    
    if (newLevel < currentLevel) {
      return { type: 'lowered', newStatus: 'Pending', color: 'text-green-700' }
    } else if (newLevel > currentLevel) {
      return { type: 'increased', newStatus: 'Review', color: 'text-orange-700' }
    }
    return { type: 'same', newStatus: 'No change', color: 'text-gray-600' }
  }

  // Check if Manager can perform actions on this ticket
  const canManage = user?.role === 'manager' && ticket.createdById !== user.id && ticket.status === TicketStatus.DRAFT
  const canApprove = canManage && ticket.status === TicketStatus.DRAFT
  const canChangeSeverity = canManage && ticket.status === TicketStatus.DRAFT

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
    let message = 'You cannot manage tickets you created.'
    
    if (user?.role === 'manager' && ticket.createdById !== user.id && ticket.status !== TicketStatus.DRAFT) {
      message = `Managers can only modify tickets in DRAFT status. This ticket is currently ${ticket.status}.`
    }
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-amber-600">Manager Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">{message}</p>
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

                {(() => {
                  const impact = getSeverityChangeImpact()
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-2">Severity Change Impact:</p>
                        {impact.type !== 'same' ? (
                          <div className="bg-white rounded p-3 border border-blue-300">
                            <p className="font-medium">
                              Severity {impact.type}: <span className={`font-semibold ${impact.color}`}>{ticket.severity}</span> → <span className={`font-semibold ${impact.color}`}>{selectedSeverity}</span>
                            </p>
                            <p className="text-sm mt-1">
                              Ticket status will change to: <span className={`font-semibold ${impact.color}`}>{impact.newStatus}</span>
                            </p>
                          </div>
                        ) : (
                          <div className="text-gray-600">
                            <p>No severity change - status will remain the same</p>
                          </div>
                        )}
                        <div className="mt-3 text-xs">
                          <p><strong>Rules:</strong></p>
                          <ul className="list-disc list-inside space-y-1 mt-1">
                            <li>Lowering severity → Pending status</li>
                            <li>Increasing severity → Review status (high-priority)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )
                })()}

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
