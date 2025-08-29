import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

const Login = () => {
  const { user, login, isLoading } = useAuthStore()
  const { addNotification } = useUIStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  if (user) {
    return <Navigate to="/" replace />
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password)
      addNotification({
        type: 'success',
        title: 'Login successful!',
        message: 'Welcome back to the Service Ticket Management System.'
      })
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Login failed',
        message: error.response?.data?.message || 'Please check your credentials and try again.'
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Sign in to your account
          </CardTitle>
          <p className="text-sm text-gray-600">
            Service Ticket Management System
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
