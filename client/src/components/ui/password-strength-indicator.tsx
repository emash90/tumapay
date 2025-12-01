import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

interface StrengthInfo {
  level: StrengthLevel;
  label: string;
  color: string;
  barColor: string;
  percentage: number;
}

export function PasswordStrengthIndicator({
  password,
  className
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo((): StrengthInfo => {
    if (!password) {
      return {
        level: 'weak',
        label: 'No password',
        color: 'text-gray-400',
        barColor: 'bg-gray-300',
        percentage: 0,
      };
    }

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1; // lowercase
    if (/[A-Z]/.test(password)) score += 1; // uppercase
    if (/[0-9]/.test(password)) score += 1; // numbers
    if (/[^a-zA-Z0-9]/.test(password)) score += 1; // special chars

    // Determine strength level
    if (score <= 2) {
      return {
        level: 'weak',
        label: 'Weak',
        color: 'text-red-600',
        barColor: 'bg-red-500',
        percentage: 25,
      };
    } else if (score <= 4) {
      return {
        level: 'fair',
        label: 'Fair',
        color: 'text-orange-600',
        barColor: 'bg-orange-500',
        percentage: 50,
      };
    } else if (score <= 5) {
      return {
        level: 'good',
        label: 'Good',
        color: 'text-yellow-600',
        barColor: 'bg-yellow-500',
        percentage: 75,
      };
    } else {
      return {
        level: 'strong',
        label: 'Strong',
        color: 'text-green-600',
        barColor: 'bg-green-500',
        percentage: 100,
      };
    }
  }, [password]);

  if (!password) {
    return null;
  }

  return (
    <div className={cn('mt-2 space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">Password strength:</span>
        <span className={cn('text-xs font-medium', strength.color)}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn('h-full transition-all duration-300', strength.barColor)}
          style={{ width: `${strength.percentage}%` }}
        />
      </div>
      <div className="mt-1 space-y-0.5 text-xs text-gray-500">
        {password.length < 8 && (
          <div>• At least 8 characters required</div>
        )}
        {!/[A-Z]/.test(password) && (
          <div>• Add uppercase letter</div>
        )}
        {!/[a-z]/.test(password) && (
          <div>• Add lowercase letter</div>
        )}
        {!/[0-9]/.test(password) && (
          <div>• Add number</div>
        )}
        {!/[^a-zA-Z0-9]/.test(password) && password.length >= 8 && (
          <div className="text-gray-400">• Add special character for stronger password</div>
        )}
      </div>
    </div>
  );
}
