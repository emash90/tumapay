import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import type { TransferTimelineEvent } from '@/api/types';

interface TransferTimelineProps {
  timeline: TransferTimelineEvent[];
  isLoading?: boolean;
}

// Map step names to human-readable labels
const stepLabels: Record<string, string> = {
  transfer_initiated: 'Transfer Initiated',
  beneficiary_validated: 'Beneficiary Validated',
  wallet_debited: 'Wallet Debited',
  wallet_debit_started: 'Debiting Wallet',
  exchange_rate_calculated: 'Exchange Rate Calculated',
  exchange_rate_calculation_started: 'Calculating Exchange Rate',
  usdt_liquidity_check_started: 'Checking USDT Liquidity',
  usdt_liquidity_confirmed: 'USDT Liquidity Confirmed',
  tron_liquidity_check_started: 'Checking TRON Balance',
  tron_liquidity_confirmed: 'TRON Balance Confirmed',
  binance_withdrawal_started: 'Withdrawing from Binance',
  binance_withdrawal_completed: 'Binance Withdrawal Complete',
  binance_withdrawal_failed: 'Binance Withdrawal Failed',
  tron_transfer_started: 'Initiating TRON Transfer',
  tron_transfer_sent: 'USDT Sent via TRON',
  tron_confirmation_pending: 'Awaiting Confirmation',
  tron_confirmed: 'TRON Transaction Confirmed',
  transfer_completed: 'Transfer Completed',
  rollback_started: 'Initiating Rollback',
  rollback_wallet_credited: 'Wallet Refunded',
  rollback_completed: 'Rollback Complete',
  rollback_failed: 'Rollback Failed',
};

const statusConfig = {
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    lineColor: 'bg-green-200',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    lineColor: 'bg-red-200',
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    lineColor: 'bg-gray-200',
  },
};

export function TransferTimeline({ timeline, isLoading }: TransferTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No timeline events yet
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {timeline.map((event, idx) => {
          const config = statusConfig[event.status] || statusConfig.pending;
          const Icon = config.icon;
          const isLast = idx === timeline.length - 1;
          const label = stepLabels[event.step] || event.step;
          const timestamp = new Date(event.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {/* Connecting line */}
                {!isLast && (
                  <span
                    className={cn(
                      'absolute left-4 top-4 -ml-px h-full w-0.5',
                      config.lineColor
                    )}
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex space-x-3">
                  {/* Icon */}
                  <div>
                    <span
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                        config.bgColor
                      )}
                    >
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <time className="text-xs text-gray-500">{timestamp}</time>
                    </div>
                    {event.message && (
                      <p className="mt-1 text-sm text-gray-500">{event.message}</p>
                    )}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-600">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-400">{key}:</span>{' '}
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
