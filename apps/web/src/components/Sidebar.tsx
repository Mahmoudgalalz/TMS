import { NavLink } from 'react-router-dom'
import { 
  Home, 
  Ticket, 
  Users, 
  Plus,
  BarChart3,
  FileDown,
  FileUp,
  Archive
} from 'lucide-react'
import { useAuthStore } from '../stores/auth'
import { useUIStore } from '../stores/ui'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Tickets', href: '/tickets', icon: Ticket },
  { name: 'New Ticket', href: '/tickets/new', icon: Plus },
  { name: 'Imported Tickets', href: '/imported-tickets', icon: Archive },
]

const managerNavigation = [
  { name: 'CSV Export', href: '/csv/export', icon: FileDown },
  { name: 'CSV Import', href: '/csv/import', icon: FileUp },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

const Sidebar = () => {
  const { user } = useAuthStore()
  const { sidebarOpen } = useUIStore()

  const isManager = user?.role === 'manager'

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0",
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        <div className="flex items-center h-16 px-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">
            Service Tickets
          </h1>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )
              }
            >
              <item.icon
                className="mr-3 h-5 w-5"
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
          
          {isManager && (
            <>
              <div className="border-t border-gray-200 mt-4 pt-4">
                <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Manager Tools
                </p>
              </div>
              {managerNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )
                  }
                >
                  <item.icon
                    className="mr-3 h-5 w-5"
                    aria-hidden="true"
                  />
                  {item.name}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </div>
    </div>
  )
}

export default Sidebar
