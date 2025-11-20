import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Plus,
  Send,
  Download,
  UserPlus,
  ArrowLeftRight,
  History
} from 'lucide-react';

interface QuickAction {
  name: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
  hoverBg: string;
}

const actions: QuickAction[] = [
  {
    name: 'Deposit',
    description: 'Add funds to wallet',
    icon: Plus,
    href: '/wallets/deposit',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    hoverBg: 'hover:bg-green-50',
  },
  {
    name: 'Transfer',
    description: 'Send money',
    icon: Send,
    href: '/transfers/new',
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    hoverBg: 'hover:bg-primary-50',
  },
  {
    name: 'Withdraw',
    description: 'Cash out funds',
    icon: Download,
    href: '/wallets/withdraw',
    color: 'text-accent-600',
    bgColor: 'bg-accent-100',
    hoverBg: 'hover:bg-accent-50',
  },
  {
    name: 'Add Beneficiary',
    description: 'New recipient',
    icon: UserPlus,
    href: '/beneficiaries/new',
    color: 'text-secondary-600',
    bgColor: 'bg-secondary-100',
    hoverBg: 'hover:bg-secondary-50',
  },
  {
    name: 'Convert',
    description: 'Exchange currency',
    icon: ArrowLeftRight,
    href: '/exchange-rates',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    hoverBg: 'hover:bg-blue-50',
  },
  {
    name: 'History',
    description: 'View all transactions',
    icon: History,
    href: '/history',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    hoverBg: 'hover:bg-gray-50',
  },
];

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
        <p className="text-sm text-gray-500">Common tasks at your fingertips</p>
      </div>

      {/* Actions grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {actions.map((action) => (
            <button
              key={action.name}
              onClick={() => navigate(action.href)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-100 transition-all',
                'hover:border-gray-200 hover:shadow-sm',
                action.hoverBg
              )}
            >
              <div className={cn('p-2.5 rounded-lg', action.bgColor)}>
                <action.icon className={cn('h-5 w-5', action.color)} />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900 text-sm">{action.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
