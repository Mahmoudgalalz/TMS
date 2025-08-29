import { NavLink } from 'react-router-dom'
import { 
  HomeIcon, 
  TicketIcon, 
  UsersIcon, 
  PlusIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { UserRole } from '@service-ticket/types'

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Tickets', href: '/tickets', icon: TicketIcon },
  { name: 'New Ticket', href: '/tickets/new', icon: PlusIcon },
]

const adminNavigation = [
  { name: 'Users', href: '/users', icon: UsersIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
]

const Sidebar = () => {
  const { user } = useAuth()

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-gray-900">
            Service Tickets
          </h1>
        </div>
        <div className="mt-5 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon
                  className="mr-3 flex-shrink-0 h-6 w-6"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
            
            {user?.role === UserRole.ADMIN && (
              <>
                <div className="border-t border-gray-200 mt-4 pt-4">
                  <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administration
                  </p>
                </div>
                {adminNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon
                      className="mr-3 flex-shrink-0 h-6 w-6"
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
    </div>
  )
}

export default Sidebar
