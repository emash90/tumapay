import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { TronService } from '../tron.service';
import tronConfig from '../../../config/tron.config';

/**
 * TronService Unit Tests
 *
 * Tests core functionality:
 * - Address validation
 * - Balance checking (USDT and TRX)
 * - Gas fee estimation
 * - Pre-flight validation
 * - Retry logic
 * - Error handling
 */
describe('TronService', () => {
  let service: TronService;
  let mockTronWeb: any;

  // Mock configuration
  const mockConfig = {
    network: 'nile',
    apiUrl: 'https://nile.trongrid.io',
    privateKey: 'test-private-key',
    walletAddress: 'TTestWalletAddress123',
    usdtContract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    maxFeeLimit: 100000000,
    requiredConfirmations: 19,
  };

  beforeEach(async () => {
    // Create mock TronWeb
    mockTronWeb = {
      isAddress: jest.fn(),
      address: {
        toHex: jest.fn(),
        fromHex: jest.fn(),
      },
      trx: {
        getBalance: jest.fn(),
        getTransactionInfo: jest.fn(),
        getCurrentBlock: jest.fn(),
        getAccount: jest.fn(),
      },
      contract: jest.fn(),
    };

    // Mock TronWeb constructor
    jest.mock('tronweb', () => ({
      TronWeb: jest.fn().mockImplementation(() => mockTronWeb),
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TronService,
        {
          provide: tronConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<TronService>(TronService);

    // Override the private tronWeb instance with our mock
    (service as any).tronWeb = mockTronWeb;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // ADDRESS VALIDATION TESTS
  // ========================================

  describe('validateAddress', () => {
    it('should validate a correct TRON address', () => {
      const testAddress = 'TTestAddress123';
      mockTronWeb.isAddress.mockReturnValue(true);

      const result = service.validateAddress(testAddress);

      expect(result).toBe(true);
      expect(mockTronWeb.isAddress).toHaveBeenCalledWith(testAddress);
    });

    it('should reject an invalid TRON address', () => {
      const invalidAddress = 'invalid-address';
      mockTronWeb.isAddress.mockReturnValue(false);

      const result = service.validateAddress(invalidAddress);

      expect(result).toBe(false);
      expect(mockTronWeb.isAddress).toHaveBeenCalledWith(invalidAddress);
    });

    it('should handle errors gracefully', () => {
      mockTronWeb.isAddress.mockImplementation(() => {
        throw new Error('Network error');
      });

      const result = service.validateAddress('TAddress');

      expect(result).toBe(false);
    });
  });

  describe('validateAndConvertAddress', () => {
    it('should convert a valid address to hex', () => {
      const testAddress = 'TTestAddress123';
      const hexAddress = '0x1234567890abcdef';

      mockTronWeb.isAddress.mockReturnValue(true);
      mockTronWeb.address.toHex.mockReturnValue(hexAddress);

      const result = service.validateAndConvertAddress(testAddress);

      expect(result).toBe(hexAddress);
      expect(mockTronWeb.address.toHex).toHaveBeenCalledWith(testAddress);
    });

    it('should throw error for empty address', () => {
      expect(() => service.validateAndConvertAddress('')).toThrow(
        BadRequestException,
      );
      expect(() => service.validateAndConvertAddress('')).toThrow(
        'Address is required',
      );
    });

    it('should throw error for invalid address', () => {
      mockTronWeb.isAddress.mockReturnValue(false);

      expect(() =>
        service.validateAndConvertAddress('invalid-address'),
      ).toThrow(BadRequestException);
      expect(() =>
        service.validateAndConvertAddress('invalid-address'),
      ).toThrow('Invalid TRON address');
    });
  });

  // ========================================
  // BALANCE CHECKING TESTS
  // ========================================

  describe('getTRXBalance', () => {
    it('should return TRX balance in TRX (not SUN)', async () => {
      const balanceInSun = 1000000; // 1 TRX
      mockTronWeb.trx.getBalance.mockResolvedValue(balanceInSun);
      mockTronWeb.isAddress.mockReturnValue(true);

      const balance = await service.getTRXBalance(mockConfig.walletAddress);

      expect(balance).toBe(1); // 1 TRX
      expect(mockTronWeb.trx.getBalance).toHaveBeenCalledWith(
        mockConfig.walletAddress,
      );
    });

    it('should use configured wallet address if none provided', async () => {
      mockTronWeb.trx.getBalance.mockResolvedValue(5000000); // 5 TRX
      mockTronWeb.isAddress.mockReturnValue(true);

      const balance = await service.getTRXBalance();

      expect(balance).toBe(5);
      expect(mockTronWeb.trx.getBalance).toHaveBeenCalledWith(
        mockConfig.walletAddress,
      );
    });

    it('should throw error if wallet address not configured', async () => {
      (service as any).config.walletAddress = null;

      await expect(service.getTRXBalance()).rejects.toThrow(
        'Wallet address not configured',
      );
    });
  });

  describe('getUSDTBalance', () => {
    it('should return USDT balance in USDT (not smallest unit)', async () => {
      const mockContract = {
        balanceOf: jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue('1000000'), // 1 USDT (6 decimals)
        }),
      };

      mockTronWeb.contract.mockReturnValue({
        at: jest.fn().mockResolvedValue(mockContract),
      });
      mockTronWeb.isAddress.mockReturnValue(true);

      const result = await service.getUSDTBalance(mockConfig.walletAddress);

      expect(result.balance).toBe(1); // 1 USDT
      expect(result.decimals).toBe(6);
      expect(result.address).toBe(mockConfig.walletAddress);
    });

    it('should handle large balances correctly', async () => {
      const mockContract = {
        balanceOf: jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue('100500000'), // 100.5 USDT
        }),
      };

      mockTronWeb.contract.mockReturnValue({
        at: jest.fn().mockResolvedValue(mockContract),
      });
      mockTronWeb.isAddress.mockReturnValue(true);

      const result = await service.getUSDTBalance();

      expect(result.balance).toBe(100.5);
    });
  });

  // ========================================
  // GAS FEE MANAGEMENT TESTS
  // ========================================

  describe('estimateGasFee', () => {
    it('should estimate gas fee in TRX', async () => {
      const mockContract = {
        transfer: jest.fn().mockReturnValue({
          estimateEnergy: jest.fn().mockResolvedValue(15000), // 15,000 energy
        }),
      };

      mockTronWeb.contract.mockReturnValue({
        at: jest.fn().mockResolvedValue(mockContract),
      });
      mockTronWeb.isAddress.mockReturnValue(true);
      mockTronWeb.address.toHex.mockReturnValue('0xhex');

      const estimate = await service.estimateGasFee('TAddress', 100);

      expect(estimate).toBeGreaterThan(0);
      expect(estimate).toBeLessThanOrEqual(20); // Should be reasonable
    });

    it('should return conservative estimate on error', async () => {
      mockTronWeb.contract.mockImplementation(() => {
        throw new Error('Network error');
      });

      const estimate = await service.estimateGasFee('TAddress', 100);

      expect(estimate).toBe(15); // Conservative estimate
    });
  });

  describe('hasSufficientGas', () => {
    it('should return true if TRX balance is sufficient', async () => {
      mockTronWeb.trx.getBalance.mockResolvedValue(50000000); // 50 TRX
      mockTronWeb.isAddress.mockReturnValue(true);

      const hasSufficient = await service.hasSufficientGas(20); // Need 20 TRX

      expect(hasSufficient).toBe(true);
    });

    it('should return false if TRX balance is insufficient', async () => {
      mockTronWeb.trx.getBalance.mockResolvedValue(10000000); // 10 TRX
      mockTronWeb.isAddress.mockReturnValue(true);

      const hasSufficient = await service.hasSufficientGas(20); // Need 20 TRX

      expect(hasSufficient).toBe(false);
    });

    it('should account for 10% buffer', async () => {
      mockTronWeb.trx.getBalance.mockResolvedValue(20000000); // 20 TRX
      mockTronWeb.isAddress.mockReturnValue(true);

      // Need 20 TRX, but with 10% buffer = 22 TRX required
      const hasSufficient = await service.hasSufficientGas(20);

      expect(hasSufficient).toBe(false);
    });
  });

  describe('getTRXBalanceStatus', () => {
    it('should return "healthy" status for good balance', async () => {
      mockTronWeb.trx.getBalance.mockResolvedValue(200000000); // 200 TRX
      mockTronWeb.isAddress.mockReturnValue(true);

      const status = await service.getTRXBalanceStatus();

      expect(status.status).toBe('healthy');
      expect(status.balance).toBe(200);
      expect(status.message).toContain('healthy');
    });

    it('should return "low" status for balance < 100 TRX', async () => {
      mockTronWeb.trx.getBalance.mockResolvedValue(50000000); // 50 TRX
      mockTronWeb.isAddress.mockReturnValue(true);

      const status = await service.getTRXBalanceStatus();

      expect(status.status).toBe('low');
      expect(status.balance).toBe(50);
      expect(status.message).toContain('WARNING');
    });

    it('should return "critical" status for balance < 20 TRX', async () => {
      mockTronWeb.trx.getBalance.mockResolvedValue(10000000); // 10 TRX
      mockTronWeb.isAddress.mockReturnValue(true);

      const status = await service.getTRXBalanceStatus();

      expect(status.status).toBe('critical');
      expect(status.balance).toBe(10);
      expect(status.message).toContain('CRITICAL');
    });
  });

  // ========================================
  // PRE-FLIGHT VALIDATION TESTS
  // ========================================

  describe('validateTransferRequirements', () => {
    beforeEach(() => {
      // Setup mocks for successful validation
      mockTronWeb.isAddress.mockReturnValue(true);
      mockTronWeb.address.toHex.mockReturnValue('0xhex');
      mockTronWeb.trx.getBalance.mockResolvedValue(100000000); // 100 TRX

      const mockContract = {
        balanceOf: jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue('1000000000'), // 1000 USDT
        }),
        transfer: jest.fn().mockReturnValue({
          estimateEnergy: jest.fn().mockResolvedValue(15000),
        }),
      };

      mockTronWeb.contract.mockReturnValue({
        at: jest.fn().mockResolvedValue(mockContract),
      });
    });

    it('should pass validation for valid transfer', async () => {
      const result = await service.validateTransferRequirements(
        'TValidAddress',
        100,
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for empty address', async () => {
      const result = await service.validateTransferRequirements('', 100);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Recipient address is required');
    });

    it('should fail validation for invalid address', async () => {
      mockTronWeb.isAddress.mockReturnValue(false);

      const result = await service.validateTransferRequirements(
        'invalid-address',
        100,
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Invalid TRON address'))).toBe(
        true,
      );
    });

    it('should fail validation for zero amount', async () => {
      const result = await service.validateTransferRequirements('TAddress', 0);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('greater than 0'))).toBe(true);
    });

    it('should fail validation for amount < 1 USDT', async () => {
      const result = await service.validateTransferRequirements(
        'TAddress',
        0.5,
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('at least 1 USDT'))).toBe(
        true,
      );
    });

    it('should fail validation for too many decimal places', async () => {
      const result = await service.validateTransferRequirements(
        'TAddress',
        100.1234567, // 7 decimals, USDT only supports 6
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('too many decimal places'))).toBe(
        true,
      );
    });

    it('should fail validation for insufficient USDT balance', async () => {
      const mockContract = {
        balanceOf: jest.fn().mockReturnValue({
          call: jest.fn().mockResolvedValue('50000000'), // Only 50 USDT
        }),
        transfer: jest.fn().mockReturnValue({
          estimateEnergy: jest.fn().mockResolvedValue(15000),
        }),
      };

      mockTronWeb.contract.mockReturnValue({
        at: jest.fn().mockResolvedValue(mockContract),
      });

      const result = await service.validateTransferRequirements(
        'TAddress',
        100, // Need 100 USDT
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Insufficient USDT'))).toBe(
        true,
      );
    });

    it('should fail validation for insufficient TRX for gas', async () => {
      mockTronWeb.trx.getBalance.mockResolvedValue(5000000); // Only 5 TRX

      const result = await service.validateTransferRequirements(
        'TAddress',
        100,
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Insufficient TRX'))).toBe(
        true,
      );
    });
  });

  // ========================================
  // DECIMAL CONVERSION TESTS
  // ========================================

  describe('toSmallestUnit', () => {
    it('should convert USDT to smallest unit (6 decimals)', () => {
      expect(service.toSmallestUnit(1)).toBe(1000000);
      expect(service.toSmallestUnit(100.5)).toBe(100500000);
      expect(service.toSmallestUnit(0.000001)).toBe(1);
    });

    it('should throw error for negative amounts', () => {
      expect(() => service.toSmallestUnit(-10)).toThrow(BadRequestException);
      expect(() => service.toSmallestUnit(-10)).toThrow(
        'Amount cannot be negative',
      );
    });
  });

  describe('fromSmallestUnit', () => {
    it('should convert from smallest unit to USDT', () => {
      expect(service.fromSmallestUnit(1000000)).toBe(1);
      expect(service.fromSmallestUnit(100500000)).toBe(100.5);
      expect(service.fromSmallestUnit('1000000')).toBe(1);
    });
  });

  describe('sunToTrx', () => {
    it('should convert SUN to TRX', () => {
      expect(service.sunToTrx(1000000)).toBe(1);
      expect(service.sunToTrx(50000000)).toBe(50);
      expect(service.sunToTrx('1000000')).toBe(1);
    });
  });

  describe('trxToSun', () => {
    it('should convert TRX to SUN', () => {
      expect(service.trxToSun(1)).toBe(1000000);
      expect(service.trxToSun(50)).toBe(50000000);
      expect(service.trxToSun(0.5)).toBe(500000);
    });
  });

  // ========================================
  // CONNECTION TESTS
  // ========================================

  describe('checkConnection', () => {
    it('should return true if connection is successful', async () => {
      mockTronWeb.trx.getCurrentBlock.mockResolvedValue({
        block_header: { raw_data: { number: 12345 } },
      });

      const isConnected = await service.checkConnection();

      expect(isConnected).toBe(true);
    });

    it('should return false if connection fails', async () => {
      mockTronWeb.trx.getCurrentBlock.mockRejectedValue(
        new Error('Network error'),
      );

      const isConnected = await service.checkConnection();

      expect(isConnected).toBe(false);
    });
  });
});
