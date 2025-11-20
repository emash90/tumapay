import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  History,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Wallets', href: '/dashboard/wallets', icon: Wallet },
  { name: 'Transfers', href: '/dashboard/transfers', icon: ArrowLeftRight },
  { name: 'Beneficiaries', href: '/dashboard/beneficiaries', icon: Users },
  { name: 'Exchange Rates', href: '/dashboard/exchange-rates', icon: TrendingUp },
  { name: 'Transaction History', href: '/dashboard/history', icon: History },
];

const secondaryNavItems: NavItem[] = [
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Help & Support', href: '/dashboard/support', icon: HelpCircle },
];

export function Sidebar({ isCollapsed, onCollapse, isMobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href ||
      (item.href !== '/dashboard' && location.pathname.startsWith(item.href));

    return (
      <NavLink
        to={item.href}
        onClick={onMobileClose}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          'hover:bg-white/10',
          isActive
            ? 'bg-white/20 text-white shadow-sm'
            : 'text-gray-300 hover:text-white',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-white')} />
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.name}</span>
            {item.badge && (
              <span className="bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-secondary-900',
          'flex flex-col transition-all duration-300 ease-in-out',
          'shadow-xl',
          // Width
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile styles
          'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo section */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-white/10',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <span className="text-white font-semibold text-lg">TumaPay</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
          )}

          {/* Collapse button - desktop only */}
          <button
            onClick={() => onCollapse(!isCollapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Main navigation */}
          <div className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Main Menu
              </p>
            )}
            {mainNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>

          {/* Secondary navigation */}
          <div className="pt-6 space-y-1">
            {!isCollapsed && (
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Support
              </p>
            )}
            {secondaryNavItems.map((item) => (
              <NavItemComponent key={item.href} item={item} />
            ))}
          </div>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-white/10">
            <div className="text-xs text-gray-400 text-center">
              © 2024 TumaPay
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
