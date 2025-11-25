import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  TrendingUp,
  ArrowLeftRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  isLoading?: boolean;
}

function StatCard({ title, value, change, icon: Icon, iconColor, iconBg, isLoading }: StatCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={cn('p-2.5 rounded-lg', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {change && (
        <div className="flex items-center gap-1">
          {change.type === 'increase' ? (
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          )}
          <span className={cn(
            'text-sm font-medium',
            change.type === 'increase' ? 'text-green-600' : 'text-red-600'
          )}>
            {change.value}%
          </span>
          <span className="text-sm text-gray-500">vs last month</span>
        </div>
      )}
    </div>
  );
}

interface StatsCardsProps {
  stats?: {
    totalBalance: number;
    totalTransfers: number;
    totalBeneficiaries: number;
    monthlyVolume: number;
  };
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading }: StatsCardsProps) {
  const defaultStats = {
    totalBalance: stats?.totalBalance ?? 0,
    totalTransfers: stats?.totalTransfers ?? 0,
    totalBeneficiaries: stats?.totalBeneficiaries ?? 0,
    monthlyVolume: stats?.monthlyVolume ?? 0,
  };

  const cards: StatCardProps[] = [
    {
      title: 'Total Balance',
      value: formatCurrency(defaultStats.totalBalance, 'KES'),
      icon: Wallet,
      iconColor: 'text-primary-600',
      iconBg: 'bg-primary-100',
    },
    {
      title: 'Total Transfers',
      value: defaultStats.totalTransfers.toString(),
      icon: ArrowLeftRight,
      iconColor: 'text-secondary-600',
      iconBg: 'bg-secondary-100',
    },
    {
      title: 'Beneficiaries',
      value: defaultStats.totalBeneficiaries.toString(),
      icon: Users,
      iconColor: 'text-accent-600',
      iconBg: 'bg-accent-100',
    },
    {
      title: 'Monthly Transfers',
      value: formatCurrency(defaultStats.monthlyVolume, 'KES'),
      icon: TrendingUp,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} isLoading={isLoading} />
      ))}
    </div>
  );
}
