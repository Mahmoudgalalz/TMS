import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import { useUsersStore } from '../stores/users'
import { User, UserRole } from '@service-ticket/types'
import { Button } from '@/components/ui/button'
import { Users as UsersIcon, UserPlus } from 'lucide-react'
import UserList from '../components/users/UserList'
import UserForm from '../components/users/UserForm'

const Users = () => {
  const { user: currentUser } = useAuthStore()
  const { addNotification } = useUIStore()
  const { users, loading, fetchUsers, createUser, updateUser, deleteUser } = useUsersStore()
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleCreateUser = async (userData: any) => {
    try {
      await createUser(userData)
      setShowAddUser(false)
      addNotification({
        type: 'success',
        title: 'User Created',
        message: 'User has been successfully created.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to create user. Please try again.'
      })
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
  }

  const handleUpdateUser = async (userData: any) => {
    if (!editingUser) return
    
    try {
      await updateUser(editingUser.id, userData)
      setEditingUser(null)
      addNotification({
        type: 'success',
        title: 'User Updated',
        message: 'User has been successfully updated.'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update user. Please try again.'
      })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(userId)
        addNotification({
          type: 'success',
          title: 'User Deleted',
          message: 'User has been successfully deleted.'
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to delete user. Please try again.'
        })
      }
    }
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

      <UserList 
        users={users}
        loading={loading}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* Add User Form */}
      {showAddUser && (
        <UserForm
          onSave={handleCreateUser}
          onCancel={() => setShowAddUser(false)}
          loading={loading}
        />
      )}

      {/* Edit User Form */}
      {editingUser && (
        <UserForm
          user={editingUser}
          onSave={handleUpdateUser}
          onCancel={() => setEditingUser(null)}
          loading={loading}
        />
      )}
    </div>
  )
}

export default Users
