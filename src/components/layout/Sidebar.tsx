import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  Users, 
  Store, 
  BellRing, 
  BarChart3, 
  Truck
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

export function Sidebar() {
  const location = useLocation();
  const pathname = location.pathname;
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const navigate = useNavigate();

  // Determine role context based on pathnames
  const isManager = pathname?.startsWith('/manager');
  const isWorker = pathname?.startsWith('/inventory-handler') || 
                    pathname?.startsWith('/delivery-staff') || 
                    pathname?.startsWith('/warehouse-staff');

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
    navigate("/login");
  };

  let navItems = [];

  if (isWorker) {
    let workerRoute = '/inventory-handler';
    if (user?.designation === 'Inventory Handler') workerRoute = '/inventory-handler';
    else if (user?.designation === 'Delivery Staff') workerRoute = '/delivery-staff';
    else if (user?.designation === 'Warehouse Staff') workerRoute = '/warehouse-staff';

    navItems = [
      { name: 'Job Panel', href: workerRoute, icon: Package },
      { name: 'Shift Schedule', href: '#', icon: BellRing },
    ];
  } else if (isManager) {
    navItems = [
      { name: 'Store Dashboard', href: '/manager', icon: Store },
      { name: 'Store Inventory', href: '/manager/inventory', icon: Package },
      { name: 'Deliveries', href: '/manager/transfers', icon: Truck },
      { name: 'Worker Shifts', href: '/manager/team', icon: Users },
    ];
  } else {
    // Super Admin
    navItems = [
      { name: 'Global Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Inventory', href: '/admin/inventory', icon: Package },
      { name: 'Transfers', href: '/admin/transfers', icon: ArrowRightLeft },
      { name: 'Workers', href: '/admin/workers', icon: Users },
      { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ];
  }

  return (
    <aside className="w-[240px] bg-background border-r border-border h-screen flex flex-col fixed left-0 top-0 text-sm z-20">
      <div className="h-14 flex items-center px-5 border-b border-border">
        <div className="font-semibold text-foreground tracking-tight text-base flex items-center gap-2">
          <div className="w-5 h-5 bg-foreground rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-background rounded-full"></div>
          </div>
          Logistics OS
        </div>
      </div>
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/admin' || item.href === '/manager'
            ? pathname === item.href
            : pathname === item.href || (item.href !== '#' && pathname?.startsWith(item.href + '/') && item.href !== '/');
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 mx-1 rounded-md text-sm transition-all duration-200 ${
                isActive 
                  ? 'bg-surface text-foreground font-medium shadow-[0_1px_2px_rgba(0,0,0,0.2)] border border-border/50' 
                  : 'text-muted hover:bg-surface hover:text-foreground border border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-muted px-1">
          <span className="font-mono text-[10px] tracking-wider uppercase">v2.15.0-ent</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
            <span className="text-[10px]">Online</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="text-muted hover:text-foreground hover:bg-surface transition-colors w-full text-left px-3 py-1.5 rounded text-xs font-medium cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
