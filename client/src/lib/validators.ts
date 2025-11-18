import { z } from 'zod'

export const emailSchema = z.string().email('Invalid email address')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    'Password must contain uppercase, lowercase, and number/special character'
  )

export const turkishIBANSchema = z
  .string()
  .length(26, 'Turkish IBAN must be 26 characters')
  .regex(/^TR\d{24}$/, 'Invalid Turkish IBAN format')
  .refine((iban) => validateIBANChecksum(iban), {
    message: 'Invalid IBAN checksum',
  })

export const tcKimlikSchema = z
  .string()
  .length(11, 'TC Kimlik must be 11 digits')
  .regex(/^[1-9][0-9]{10}$/, 'TC Kimlik must be 11 digits and cannot start with 0')
  .refine((tcKimlik) => validateTcKimlik(tcKimlik), {
    message: 'Invalid TC Kimlik checksum',
  })

export const kenyanPhoneSchema = z
  .string()
  .regex(/^\+254[17]\d{8}$/, 'Invalid Kenyan phone number. Format: +254712345678')

export const tronAddressSchema = z
  .string()
  .length(34, 'TRON address must be 34 characters')
  .regex(/^T[A-Za-z1-9]{33}$/, 'Invalid TRON address format')

// IBAN checksum validation using MOD-97 algorithm
function validateIBANChecksum(iban: string): boolean {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase()

  // Move first 4 characters to end
  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4)

  // Replace letters with numbers (A=10, B=11, ..., Z=35)
  const numeric = rearranged.replace(/[A-Z]/g, (char) =>
    (char.charCodeAt(0) - 55).toString()
  )

  // Calculate MOD 97
  return mod97(numeric) === 1
}

// Calculate MOD 97 for large numbers (as string)
function mod97(numericString: string): number {
  let remainder = 0
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString[i], 10)) % 97
  }
  return remainder
}

// Turkish National ID (TC Kimlik) validation algorithm
function validateTcKimlik(tcKimlik: string): boolean {
  if (!/^\d{11}$/.test(tcKimlik)) return false
  if (tcKimlik[0] === '0') return false

  const digits = tcKimlik.split('').map(Number)

  // Calculate first checksum digit (10th digit)
  const sum1 = (digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7]
  const checksum1 = (sum1 - sum2) % 10

  if (checksum1 !== digits[9]) return false

  // Calculate second checksum digit (11th digit)
  const sum3 = digits.slice(0, 10).reduce((acc, digit) => acc + digit, 0)
  const checksum2 = sum3 % 10

  return checksum2 === digits[10]
}
