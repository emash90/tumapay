import { cn } from '@/lib/utils';
import { User, MoreVertical, CheckCircle, XCircle, Building2, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Beneficiary } from '@/api/types';
import { useState, useRef, useEffect } from 'react';

interface BeneficiaryCardProps {
  beneficiary: Beneficiary;
  onEdit: (beneficiary: Beneficiary) => void;
  onDelete: (beneficiary: Beneficiary) => void;
  onToggleStatus: (beneficiary: Beneficiary) => void;
  onSendMoney: (beneficiary: Beneficiary) => void;
}

export function BeneficiaryCard({
  beneficiary,
  onEdit,
  onDelete,
  onToggleStatus,
  onSendMoney,
}: BeneficiaryCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-accent-100">
              <User className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{beneficiary.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs',
                    beneficiary.isActive ? 'text-green-600' : 'text-gray-400'
                  )}
                >
                  {beneficiary.isActive ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {beneficiary.isActive ? 'Active' : 'Inactive'}
                </span>
                {beneficiary.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => {
                    onEdit(beneficiary);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    onToggleStatus(beneficiary);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  {beneficiary.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => {
                    onDelete(beneficiary);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-3">
        {/* IBAN */}
        <div>
          <p className="text-xs text-gray-500 mb-1">IBAN</p>
          <p className="text-sm font-mono text-gray-900">{beneficiary.ibanFormatted}</p>
        </div>

        {/* Bank */}
        {beneficiary.bankName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span>{beneficiary.bankName}</span>
          </div>
        )}

        {/* Phone */}
        {beneficiary.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{beneficiary.phone}</span>
          </div>
        )}

        {/* Email */}
        {beneficiary.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400" />
            <span>{beneficiary.email}</span>
          </div>
        )}

        {/* Currency */}
        <div className="flex items-center gap-2 pt-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent-100 text-accent-700">
            {beneficiary.currency}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {beneficiary.country}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={() => onSendMoney(beneficiary)}
          disabled={!beneficiary.isActive}
        >
          Send Money
        </Button>
      </div>
    </div>
  );
}
