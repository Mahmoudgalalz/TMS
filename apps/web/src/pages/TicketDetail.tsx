import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TicketStatus, TicketSeverity } from '@service-ticket/types'
import { ticketsApi } from '../services/api'
import { useUIStore } from '../stores/ui'
import { useRolePermissions } from '../hooks/useRolePermissions'
import { useAuthStore } from '../stores/auth'
import ManagerTicketActions from '../components/tickets/ManagerTicketActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  X
} from 'lucide-react'

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addNotification } = useUIStore()
  const permissions = useRolePermissions()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    severity: TicketSeverity.MEDIUM,
    status: TicketStatus.DRAFT
  })
  const [severityChangeReason, setSeverityChangeReason] = useState('')

  // Fetch ticket data
  const { data: ticketData, isLoading, error } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getTicket(id!),
    enabled: !!id,
  })

  const ticket = ticketData?.data

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => ticketsApi.updateTicket(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      setIsEditing(false)
      setSeverityChangeReason('')
      addNotification({
        type: 'success',
        title: 'Ticket Updated',
        message: 'Ticket has been updated successfully.'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.response?.data?.message || 'Failed to update ticket.'
      })
    }
  })

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (data: { reason?: string }) => ticketsApi.approveTicket(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      addNotification({
        type: 'success',
        title: 'Ticket Approved',
        message: 'Ticket has been approved and moved to pending.'
      })
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        title: 'Approval Failed',
        message: error.response?.data?.message || 'Failed to approve ticket.'
      })
    }
  })

  useEffect(() => {
    if (ticket) {
      setEditData({
        title: ticket.title,
        description: ticket.description,
        severity: ticket.severity,
        status: ticket.status
      })
    }
  }, [ticket])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (ticket) {
      setEditData({
        title: ticket.title,
        description: ticket.description,
        severity: ticket.severity,
        status: ticket.status
      })
    }
    setSeverityChangeReason('')
  }

  const handleSave = () => {
    if (!ticket) return

    const needsReason = permissions.requiresSeverityChangeReason(ticket, editData.severity)
    
    if (needsReason && !severityChangeReason.trim()) {
      addNotification({
        type: 'error',
        title: 'Missing Information',
        message: 'Please provide a reason for the severity change.'
      })
      return
    }

    const updateData = {
      ...editData,
      ...(needsReason && severityChangeReason.trim() && { reason: severityChangeReason.trim() })
    }

    updateMutation.mutate(updateData)
  }

  const handleApprove = () => {
    approveMutation.mutate({})
  }

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.DRAFT: return 'bg-gray-100 text-gray-800'
      case TicketStatus.REVIEW: return 'bg-yellow-100 text-yellow-800'
      case TicketStatus.PENDING: return 'bg-blue-100 text-blue-800'
      case TicketStatus.OPEN: return 'bg-green-100 text-green-800'
      case TicketStatus.CLOSED: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: TicketSeverity) => {
    switch (severity) {
      case TicketSeverity.EASY: return 'bg-green-100 text-green-800'
      case TicketSeverity.LOW: return 'bg-blue-100 text-blue-800'
      case TicketSeverity.MEDIUM: return 'bg-yellow-100 text-yellow-800'
      case TicketSeverity.HIGH: return 'bg-orange-100 text-orange-800'
      case TicketSeverity.VERY_HIGH: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading ticket...</div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-lg text-red-600 mb-4">
          {error ? 'Failed to load ticket' : 'Ticket not found'}
        </div>
        <Button onClick={() => navigate('/tickets')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tickets
        </Button>
      </div>
    )
  }

  const canEdit = permissions.canEditTicket(ticket)
  const canApprove = permissions.canApproveTicket(ticket)
  const needsSeverityReason = permissions.requiresSeverityChangeReason(ticket, editData.severity)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            Ticket #{ticket.ticketNumber}
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {canApprove && ticket.status === TicketStatus.DRAFT && (
            <Button 
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </Button>
          )}
          
          {canEdit && !isEditing && (
            <Button onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          
          {isEditing && (
            <>
              <Button 
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Ticket Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full p-2 border rounded"
                  disabled={!permissions.canEditTicketTitle(ticket)}
                />
              ) : (
                ticket.title
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status}
              </Badge>
              <Badge className={getSeverityColor(isEditing ? editData.severity : ticket.severity)}>
                {isEditing ? editData.severity : ticket.severity}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            {isEditing ? (
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={6}
                className="resize-none"
                disabled={!permissions.canEditTicketDescription(ticket)}
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="whitespace-pre-wrap">{ticket.description}</p>
              </div>
            )}
          </div>

          {/* Severity Selection (Edit Mode) */}
          {isEditing && permissions.canEditTicketSeverity(ticket) && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Severity</h3>
              <Select 
                value={editData.severity} 
                onValueChange={(value) => setEditData({ ...editData, severity: value as TicketSeverity })}
              >
                <SelectTrigger className="w-48">
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
          )}

          {/* Severity Change Reason */}
          {isEditing && needsSeverityReason && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Reason for Severity Change *
              </h3>
              <Textarea
                value={severityChangeReason}
                onChange={(e) => setSeverityChangeReason(e.target.value)}
                placeholder="Please explain why you are changing the severity level..."
                rows={3}
                className="resize-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                Managers must provide a reason when changing ticket severity.
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>Created by: {ticket.createdById || 'Unknown'}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
            </div>
            
            {ticket.dueDate && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>Due: {new Date(ticket.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertTriangle className="h-4 w-4" />
              <span>Last updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manager Actions */}
      {user?.role === 'manager' && (
        <ManagerTicketActions 
          ticket={ticket} 
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['ticket', id] })}
        />
      )}
    </div>
  )
}

export default TicketDetail
