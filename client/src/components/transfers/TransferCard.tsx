import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Transfer, TransactionStatus } from '@/api/types';

interface TransferCardProps {
  transfer: Transfer;
  onViewDetails: (transfer: Transfer) => void;
}

const statusConfig: Record<TransactionStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: <Clock className="h-3 w-3" />
  },
  processing: {
    label: 'Processing',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: <Loader2 className="h-3 w-3 animate-spin" />
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: <CheckCircle className="h-3 w-3" />
  },
  failed: {
    label: 'Failed',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: <XCircle className="h-3 w-3" />
  },
  reversed: {
    label: 'Reversed',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: <XCircle className="h-3 w-3" />
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: <XCircle className="h-3 w-3" />
  },
};

export function TransferCard({ transfer, onViewDetails }: TransferCardProps) {
  const config = statusConfig[transfer.status] || statusConfig.pending;
  const date = new Date(transfer.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {transfer.beneficiary?.name || 'Unknown Beneficiary'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{date}</p>
          </div>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              config.bgColor,
              config.color
            )}
          >
            {config.icon}
            {config.label}
          </span>
        </div>
      </div>

      {/* Amounts */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-500">Sent</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(transfer.kesAmount, 'KES')}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <div className="text-right">
            <p className="text-xs text-gray-500">Received</p>
            <p className="text-lg font-semibold text-accent-600">
              {formatCurrency(transfer.usdtAmount, 'USDT')}
            </p>
          </div>
        </div>

        {/* Reference */}
        <div className="text-xs text-gray-500">
          Ref: {transfer.reference}
        </div>

        {/* Exchange Rate */}
        <div className="mt-2 text-xs text-gray-500">
          Rate: 1 KES = {transfer.exchangeRate.toFixed(6)} USD
        </div>

        {/* TRON Hash */}
        {transfer.tronTransactionHash && (
          <div className="mt-2">
            <a
              href={`https://tronscan.org/#/transaction/${transfer.tronTransactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
            >
              View on TronScan
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Error Message */}
        {transfer.errorMessage && (
          <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
            {transfer.errorMessage}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onViewDetails(transfer)}
        >
          View Details
        </Button>
      </div>
    </div>
  );
}
