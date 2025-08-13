import { Link, useLocation } from 'react-router-dom'
import { 
  Plus, 
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigation = [
  { name: '任务创建', href: '/tasks/new', icon: Plus },
]

export default function Sidebar({ open, setOpen }) {
  const location = useLocation()

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 bg-card border-r border-border transition-all duration-300",
      open ? "w-64" : "w-16"
    )}>
      <div className="flex h-full flex-col">
        {/* Toggle Button */}
        <div className="flex items-center justify-end p-4 border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="h-8 w-8 p-0"
          >
            {open ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className={cn(
                  "transition-opacity duration-300",
                  open ? "opacity-100" : "opacity-0"
                )}>
                  {item.name}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Status */}
        <div className="p-4 border-t border-border">
          <div className={cn(
            "flex items-center space-x-3 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}>
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full">
              <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">系统状态</p>
              <p className="text-xs text-green-600 dark:text-green-400">运行正常</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

