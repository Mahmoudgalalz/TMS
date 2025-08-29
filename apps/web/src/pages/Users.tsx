import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import { UserRole } from '@service-ticket/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users as UsersIcon, UserPlus, Search, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface User {
  id: string
  username: string
  email: string
  role: UserRole
  createdAt: string
  lastLogin?: string
  isActive: boolean
}

const Users = () => {
  const { user: currentUser } = useAuthStore()
  const { addNotification } = useUIStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [showAddUser, setShowAddUser] = useState(false)

  // Mock users data
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        username: 'john.doe',
        email: 'john.doe@company.com',
        role: UserRole.MANAGER,
        createdAt: '2024-01-15T10:00:00Z',
        lastLogin: '2024-01-20T14:30:00Z',
        isActive: true
      },
      {
        id: '2',
        username: 'jane.smith',
        email: 'jane.smith@company.com',
        role: UserRole.ASSOCIATE,
        createdAt: '2024-01-10T09:00:00Z',
        lastLogin: '2024-01-19T16:45:00Z',
        isActive: true
      },
      {
        id: '3',
        username: 'mike.wilson',
        email: 'mike.wilson@company.com',
        role: UserRole.ASSOCIATE,
        createdAt: '2024-01-05T11:30:00Z',
        lastLogin: '2024-01-18T13:20:00Z',
        isActive: false
      },
      {
        id: '4',
        username: 'sarah.johnson',
        email: 'sarah.johnson@company.com',
        role: UserRole.MANAGER,
        createdAt: '2024-01-12T08:15:00Z',
        lastLogin: '2024-01-20T10:10:00Z',
        isActive: true
      }
    ]

    setTimeout(() => {
      setUsers(mockUsers)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const handleEditUser = (_userId: string) => {
    addNotification({
      type: 'info',
      title: 'Edit User',
      message: 'Edit user functionality would be implemented here.'
    })
  }

  const handleDeleteUser = (_userId: string) => {
    addNotification({
      type: 'warning',
      title: 'Delete User',
      message: 'Delete user functionality would be implemented here.'
    })
  }

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    ))
    addNotification({
      type: 'success',
      title: 'User Status Updated',
      message: 'User status has been successfully updated.'
    })
  }

  const getRoleBadgeColor = (role: UserRole) => {
    return role === UserRole.MANAGER 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800'
  }

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  // Only managers can access user management
  if (currentUser?.role !== UserRole.MANAGER) {
    return (
      <div className="text-center py-12">
        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to access user management.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage system users and their permissions.</p>
        </div>
        <Button onClick={() => setShowAddUser(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value={UserRole.MANAGER}>Managers</SelectItem>
                  <SelectItem value={UserRole.ASSOCIATE}>Associates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-800 font-medium text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900">{user.username}</h3>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Badge className={getStatusBadgeColor(user.isActive)}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                        {user.lastLogin && (
                          <span className="ml-4">
                            Last login: {new Date(user.lastLogin).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleUserStatus(user.id)}>
                        <UsersIcon className="mr-2 h-4 w-4" />
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add User Modal Placeholder */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Add user form would be implemented here with proper validation and API integration.
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddUser(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setShowAddUser(false)
                  addNotification({
                    type: 'info',
                    title: 'Add User',
                    message: 'Add user functionality would be implemented here.'
                  })
                }}>
                  Add User
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default Users
