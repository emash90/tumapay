import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { WithdrawalLimits } from '@/api/types';

interface WithdrawalLimitsDisplayProps {
  limits?: WithdrawalLimits;
  isLoading?: boolean;
}

export function WithdrawalLimitsDisplay({ limits, isLoading }: WithdrawalLimitsDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!limits) {
    return null;
  }

  const dailyPercentage = (limits.usage.dailyTotal / limits.limits.dailyLimit) * 100;
  const monthlyPercentage = (limits.usage.monthlyTotal / limits.limits.monthlyLimit) * 100;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Withdrawal Limits</h3>
            <p className="text-sm text-gray-500 capitalize">{limits.tier} Tier</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {limits.limits.businessHours.start}:00 - {limits.limits.businessHours.end}:00
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Daily Limit */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Daily Limit</span>
            <span className="text-sm font-medium">
              {formatCurrency(limits.usage.dailyTotal, 'KES')} / {formatCurrency(limits.limits.dailyLimit, 'KES')}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                dailyPercentage >= 90 ? 'bg-red-500' : dailyPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
              )}
              style={{ width: `${Math.min(dailyPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Remaining: {formatCurrency(limits.usage.dailyRemaining, 'KES')}
          </p>
        </div>

        {/* Monthly Limit */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Monthly Limit</span>
            <span className="text-sm font-medium">
              {formatCurrency(limits.usage.monthlyTotal, 'KES')} / {formatCurrency(limits.limits.monthlyLimit, 'KES')}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                monthlyPercentage >= 90 ? 'bg-red-500' : monthlyPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
              )}
              style={{ width: `${Math.min(monthlyPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Remaining: {formatCurrency(limits.usage.monthlyRemaining, 'KES')}
          </p>
        </div>

        {/* Transaction Limits */}
        <div className="pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Min per transaction</p>
              <p className="font-medium">{formatCurrency(limits.limits.minimumAmount, 'KES')}</p>
            </div>
            <div>
              <p className="text-gray-500">Max per transaction</p>
              <p className="font-medium">{formatCurrency(limits.limits.maximumPerTransaction, 'KES')}</p>
            </div>
          </div>
        </div>

        {/* Pending Withdrawals Warning */}
        {limits.usage.pendingWithdrawals >= limits.limits.maxPendingWithdrawals && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700">
              You have reached the maximum number of pending withdrawals ({limits.limits.maxPendingWithdrawals}).
              Please wait for current withdrawals to complete.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
