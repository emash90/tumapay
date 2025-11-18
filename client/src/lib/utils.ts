import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function maskIBAN(iban: string): string {
  if (!iban || iban.length < 8) return iban
  return `${iban.slice(0, 4)}****${iban.slice(-4)}`
}

export function formatPhoneNumber(phone: string): string {
  // Format phone number for display
  if (!phone) return ''

  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '')

  return cleaned
}

export function truncateAddress(address: string, chars: number = 10): string {
  if (!address || address.length <= chars * 2) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}
