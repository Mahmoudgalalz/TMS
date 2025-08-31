import { useAuthStore } from '@/stores/auth'
import { UserRole, TicketStatus, Ticket } from '@service-ticket/types'

export const useRolePermissions = () => {
  const { user } = useAuthStore()

  const isAssociate = user?.role === UserRole.ASSOCIATE
  const isManager = user?.role === UserRole.MANAGER

  // Associate permissions
  const canCreateTicket = isAssociate || isManager
  
  const canEditTicket = (ticket: Ticket) => {
    if (!user) return false
    
    // Associates can only edit their own tickets
    if (isAssociate) {
      return ticket.createdById === user.id
    }
    
    // Managers can edit any ticket but with restrictions
    if (isManager) {
      return true
    }
    
    return false
  }

  const canEditTicketTitle = (ticket: Ticket) => {
    if (!user) return false
    
    // Associates can edit title/description if ticket is in REVIEW status or they created it
    if (isAssociate) {
      return ticket.createdById === user.id && 
             (ticket.status === TicketStatus.DRAFT || ticket.status === TicketStatus.REVIEW)
    }
    
    // Managers can edit title/description of any ticket
    if (isManager) {
      return true
    }
    
    return false
  }

  const canEditTicketDescription = (ticket: Ticket) => {
    // Same logic as title editing
    return canEditTicketTitle(ticket)
  }

  const canEditTicketSeverity = (ticket: Ticket) => {
    if (!user) return false
    
    // Associates cannot change severity when ticket is in REVIEW status
    if (isAssociate) {
      return ticket.createdById === user.id && ticket.status !== TicketStatus.REVIEW
    }
    
    // Managers can change severity of any ticket (except their own in certain cases)
    if (isManager) {
      return true
    }
    
    return false
  }

  const canReviewTicket = (ticket: Ticket) => {
    if (!user || !isManager) return false
    
    // Managers cannot review tickets they created
    if (ticket.createdById === user.id) return false
    
    // Managers can only review tickets in DRAFT status
    return ticket.status === TicketStatus.DRAFT
  }

  const canApproveTicket = (ticket: Ticket) => {
    if (!user || !isManager) return false
    
    // Managers cannot approve tickets they created
    if (ticket.createdById === user.id) return false
    
    // Managers can only approve tickets in DRAFT status
    return ticket.status === TicketStatus.DRAFT
  }

  const canChangeTicketStatus = (ticket: Ticket) => {
    if (!user) return false
    
    // Associates cannot change status directly (except through editing in REVIEW)
    if (isAssociate) {
      return false
    }
    
    // Managers can change status with restrictions
    if (isManager) {
      return canReviewTicket(ticket)
    }
    
    return false
  }

  const canDeleteTicket = (ticket: Ticket) => {
    // Only Managers can delete tickets
    return isManager
  }

  const canViewTicketHistory = (ticket: Ticket) => {
    // Both roles can view history
    return isAssociate || isManager
  }

  const getAvailableStatuses = (ticket: Ticket) => {
    if (!user) return []
    
    const currentStatus = ticket.status
    
    if (isAssociate) {
      // Associates have limited status options
      if (currentStatus === TicketStatus.REVIEW && ticket.createdById === user.id) {
        return [TicketStatus.DRAFT] // Can reset to draft when editing
      }
      return []
    }
    
    if (isManager) {
      // Managers can transition from DRAFT to PENDING or REVIEW
      if (currentStatus === TicketStatus.DRAFT && ticket.createdById !== user.id) {
        return [TicketStatus.PENDING, TicketStatus.REVIEW]
      }
      return []
    }
    
    return []
  }

  const requiresSeverityChangeReason = (ticket: Ticket, newSeverity: string) => {
    // Managers must provide reason when changing severity
    return isManager && ticket.severity !== newSeverity
  }

  return {
    isAssociate,
    isManager,
    canCreateTicket,
    canEditTicket,
    canEditTicketTitle,
    canEditTicketDescription,
    canEditTicketSeverity,
    canReviewTicket,
    canApproveTicket,
    canChangeTicketStatus,
    canDeleteTicket,
    canViewTicketHistory,
    getAvailableStatuses,
    requiresSeverityChangeReason,
  }
}
