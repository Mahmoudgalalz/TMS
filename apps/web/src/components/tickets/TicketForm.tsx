import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TicketSeverity, Ticket } from '@service-ticket/types'
import { useTicketsStore } from '../../stores/tickets'
import { useUIStore } from '../../stores/ui'
import { useRolePermissions } from '../../hooks/useRolePermissions'
import { api } from '../../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Save, X } from 'lucide-react'

const ticketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description too long'),
  severity: z.nativeEnum(TicketSeverity),
  dueDate: z.string().optional(),
})

type TicketFormData = z.infer<typeof ticketSchema>

interface TicketFormProps {
  ticketId?: string
  initialData?: Partial<TicketFormData & { ticket?: Ticket }>
}

const TicketForm = ({ ticketId, initialData }: TicketFormProps) => {
  const navigate = useNavigate()
  const { createTicket, updateTicket, loading } = useTicketsStore()
  const { addNotification } = useUIStore()
  const permissions = useRolePermissions()
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [loadingAI, setLoadingAI] = useState(false)
  const [severityChangeReason, setSeverityChangeReason] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: initialData || {
      severity: TicketSeverity.MEDIUM,
    }
  })

  const watchedTitle = watch('title')
  const watchedDescription = watch('description')
  const watchedSeverity = watch('severity')

  // Check if severity change reason is required
  const needsSeverityReason = initialData?.ticket && 
    permissions.requiresSeverityChangeReason(initialData.ticket, watchedSeverity)

  const getAISuggestion = async () => {
    if (!watchedTitle || !watchedDescription || watchedTitle.trim().length < 3 || watchedDescription.trim().length < 10) {
      addNotification({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please provide both a title (min 3 characters) and description (min 10 characters) for AI analysis.'
      })
      return
    }

    setLoadingAI(true)
    try {
      const response = await api.post('/ai/predict-severity', {
        title: watchedTitle,
        description: watchedDescription,
      })

      setAiSuggestion(response.data.severity)
    } catch (error) {
      console.error('AI suggestion failed:', error)
      // Fallback to mock suggestion if API fails
      const suggestions = [TicketSeverity.EASY, TicketSeverity.LOW, TicketSeverity.MEDIUM, TicketSeverity.HIGH, TicketSeverity.VERY_HIGH]
      const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)]
      setAiSuggestion(randomSuggestion)
    } finally {
      setLoadingAI(false)
    }
  }

  const acceptAISuggestion = () => {
    if (aiSuggestion) {
      setValue('severity', aiSuggestion as any)
      setAiSuggestion(null)
    }
  }

  const onSubmit = async (data: TicketFormData) => {
    try {
      // Validate severity change reason if required
      if (needsSeverityReason && !severityChangeReason.trim()) {
        addNotification({
          type: 'error',
          title: 'Missing Information',
          message: 'Please provide a reason for the severity change.'
        })
        return
      }

      const submitData = {
        ...data,
        dueDate: data.dueDate && typeof data.dueDate === 'string' && data.dueDate.trim() ? new Date(data.dueDate) : undefined,
        ...(needsSeverityReason && severityChangeReason.trim() && { reason: severityChangeReason.trim() })
      }

      if (initialData?.ticket) {
        await updateTicket(initialData.ticket.id, submitData)
        addNotification({
          type: 'success',
          title: 'Ticket updated',
          message: 'Your ticket has been updated successfully.'
        })
      } else {
        await createTicket(submitData)
        addNotification({
          type: 'success',
          title: 'Ticket created',
          message: 'Your ticket has been created successfully.'
        })
      }
      
      navigate('/tickets')
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save ticket. Please try again.'
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {ticketId ? 'Edit Ticket' : 'Create New Ticket'}
        </h1>
        <Button variant="outline" onClick={() => navigate('/tickets')}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <Input
                {...register('title')}
                placeholder="Brief description of the issue"
                disabled={initialData?.ticket && !permissions.canEditTicketTitle(initialData.ticket)}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <Textarea
                {...register('description')}
                placeholder="Detailed description of the issue..."
                rows={6}
                className="resize-none"
                disabled={initialData?.ticket && !permissions.canEditTicketDescription(initialData.ticket)}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
              
              {/* AI Button */}
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className='bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-800 border-purple-300'
                  size="sm"
                  onClick={getAISuggestion}
                  disabled={loadingAI || !watchedTitle?.trim() || !watchedDescription?.trim()}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {loadingAI ? 'Analyzing...' : 'AI'}
                </Button>
              </div>

              {aiSuggestion && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-800">
                        AI suggests severity: 
                        <Badge className="ml-2" variant="secondary">
                          {aiSuggestion}
                        </Badge>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={acceptAISuggestion}>
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setAiSuggestion(null)}>
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity *
              </label>
              <Select 
                value={watchedSeverity} 
                onValueChange={(value) => setValue('severity', value as any)} 
                disabled={loadingAI || (initialData?.ticket && !permissions.canEditTicketSeverity(initialData.ticket))}
              >
                <SelectTrigger className={loadingAI ? 'opacity-50 cursor-not-allowed' : ''}>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TicketSeverity.EASY}>Easy</SelectItem>
                  <SelectItem value={TicketSeverity.LOW}>Low</SelectItem>
                  <SelectItem value={TicketSeverity.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TicketSeverity.HIGH}>High</SelectItem>
                  <SelectItem value={TicketSeverity.VERY_HIGH}>Very High</SelectItem>
                </SelectContent>
              </Select>
              {errors.severity && (
                <p className="mt-1 text-sm text-red-600">{errors.severity.message}</p>
              )}
            </div>

            {/* Severity Change Reason - Only for Managers when changing severity */}
            {needsSeverityReason && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Severity Change *
                </label>
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


            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <Input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                {...register('dueDate')}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || loading}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting || loading ? 'Saving...' : (ticketId ? 'Update Ticket' : 'Create Ticket')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default TicketForm
