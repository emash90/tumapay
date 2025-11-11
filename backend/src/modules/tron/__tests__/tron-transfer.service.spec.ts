import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { TronTransferService } from '../services/tron-transfer.service';
import { TronService } from '../tron.service';
import { BlockchainTransactionService } from '../blockchain-transaction.service';

/**
 * TronTransferService Unit Tests
 *
 * Tests the transfer orchestration service with pessimistic locking:
 * - Concurrency control (locking)
 * - Pre-flight validation integration
 * - Retry logic integration
 * - Error handling
 */
describe('TronTransferService', () => {
  let service: TronTransferService;
  let tronService: jest.Mocked<TronService>;
  let blockchainTxService: jest.Mocked<BlockchainTransactionService>;

  beforeEach(async () => {
    // Create mocks
    const mockTronService = {
      validateTransferRequirements: jest.fn(),
      sendUSDT: jest.fn(),
      sendUSDTWithRetry: jest.fn(),
    };

    const mockBlockchainTxService = {
      create: jest.fn(),
      updateTxHash: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TronTransferService,
        {
          provide: TronService,
          useValue: mockTronService,
        },
        {
          provide: BlockchainTransactionService,
          useValue: mockBlockchainTxService,
        },
      ],
    }).compile();

    service = module.get<TronTransferService>(TronTransferService);
    tronService = module.get(TronService) as jest.Mocked<TronService>;
    blockchainTxService = module.get(
      BlockchainTransactionService,
    ) as jest.Mocked<BlockchainTransactionService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // PESSIMISTIC LOCKING TESTS
  // ========================================

  describe('executeTransferWithLock', () => {
    const testTransactionId = 'test-txn-123';
    const testAddress = 'TTestAddress123';
    const testAmount = 100;

    beforeEach(() => {
      // Setup successful validation and transfer
      tronService.validateTransferRequirements.mockResolvedValue({
        valid: true,
        errors: [],
      });

      tronService.sendUSDTWithRetry.mockResolvedValue({
        txHash: '0xtest-hash',
        success: true,
        amount: testAmount,
        toAddress: testAddress,
        timestamp: new Date(),
      });
    });

    it('should execute transfer successfully with lock', async () => {
      const result = await service.executeTransferWithLock(
        testTransactionId,
        testAddress,
        testAmount,
      );

      expect(result.txHash).toBe('0xtest-hash');
      expect(result.success).toBe(true);
      expect(tronService.validateTransferRequirements).toHaveBeenCalledWith(
        testAddress,
        testAmount,
      );
      expect(tronService.sendUSDTWithRetry).toHaveBeenCalled();
    });

    it('should prevent concurrent transfers for same transaction ID', async () => {
      // Start first transfer (don't await)
      const firstTransfer = service.executeTransferWithLock(
        testTransactionId,
        testAddress,
        testAmount,
      );

      // Try to start second transfer while first is in progress
      // This should throw immediately
      await expect(
        service.executeTransferWithLock(
          testTransactionId,
          testAddress,
          testAmount,
        ),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.executeTransferWithLock(
          testTransactionId,
          testAddress,
          testAmount,
        ),
      ).rejects.toThrow('already in progress');

      // Wait for first transfer to complete
      await firstTransfer;
    });

    it('should release lock after successful transfer', async () => {
      await service.executeTransferWithLock(
        testTransactionId,
        testAddress,
        testAmount,
      );

      // Lock should be released, second transfer should succeed
      const secondTransfer = await service.executeTransferWithLock(
        testTransactionId,
        testAddress,
        testAmount,
      );

      expect(secondTransfer.success).toBe(true);
    });

    it('should release lock even if transfer fails', async () => {
      tronService.sendUSDTWithRetry.mockRejectedValueOnce(
        new Error('Transfer failed'),
      );

      await expect(
        service.executeTransferWithLock(
          testTransactionId,
          testAddress,
          testAmount,
        ),
      ).rejects.toThrow('Transfer failed');

      // Lock should be released, second attempt should be allowed
      tronService.sendUSDTWithRetry.mockResolvedValue({
        txHash: '0xsuccess',
        success: true,
        amount: testAmount,
        toAddress: testAddress,
        timestamp: new Date(),
      });

      const secondTransfer = await service.executeTransferWithLock(
        testTransactionId,
        testAddress,
        testAmount,
      );

      expect(secondTransfer.success).toBe(true);
    });

    it('should throw error if validation fails', async () => {
      tronService.validateTransferRequirements.mockResolvedValue({
        valid: false,
        errors: ['Insufficient USDT balance', 'Insufficient TRX for gas'],
      });

      await expect(
        service.executeTransferWithLock(
          testTransactionId,
          testAddress,
          testAmount,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.executeTransferWithLock(
          testTransactionId,
          testAddress,
          testAmount,
        ),
      ).rejects.toThrow('Insufficient USDT balance');
    });

    it('should use retry logic by default', async () => {
      await service.executeTransferWithLock(
        testTransactionId,
        testAddress,
        testAmount,
      );

      expect(tronService.sendUSDTWithRetry).toHaveBeenCalled();
      expect(tronService.sendUSDT).not.toHaveBeenCalled();
    });

    it('should allow disabling retry logic', async () => {
      tronService.sendUSDT.mockResolvedValue({
        txHash: '0xdirect',
        success: true,
        amount: testAmount,
        toAddress: testAddress,
        timestamp: new Date(),
      });

      await service.executeTransferWithLock(
        testTransactionId,
        testAddress,
        testAmount,
        {
          useRetry: false,
        },
      );

      expect(tronService.sendUSDT).toHaveBeenCalled();
      expect(tronService.sendUSDTWithRetry).not.toHaveBeenCalled();
    });

    it('should respect custom maxRetries option', async () => {
      await service.executeTransferWithLock(
        testTransactionId,
        testAddress,
        testAmount,
        {
          maxRetries: 5,
        },
      );

      expect(tronService.sendUSDTWithRetry).toHaveBeenCalledWith(
        testAddress,
        testAmount,
        expect.objectContaining({
          feeLimit: undefined,
          note: undefined,
        }),
        5, // maxRetries
      );
    });

    it('should pass feeLimit and note options to transfer', async () => {
      await service.executeTransferWithLock(
        testTransactionId,
        testAddress,
        testAmount,
        {
          feeLimit: 50000000,
          note: 'Test transfer',
        },
      );

      expect(tronService.sendUSDTWithRetry).toHaveBeenCalledWith(
        testAddress,
        testAmount,
        expect.objectContaining({
          feeLimit: 50000000,
          note: 'Test transfer',
        }),
        undefined,
      );
    });
  });

  // ========================================
  // LOCK STATUS TESTS
  // ========================================

  describe('isTransferInProgress', () => {
    it('should return false when no transfer is in progress', () => {
      const isInProgress = service.isTransferInProgress('test-txn');

      expect(isInProgress).toBe(false);
    });

    it('should return true when transfer is in progress', async () => {
      tronService.validateTransferRequirements.mockResolvedValue({
        valid: true,
        errors: [],
      });

      tronService.sendUSDTWithRetry.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  txHash: '0x123',
                  success: true,
                  amount: 100,
                  toAddress: 'TAddr',
                  timestamp: new Date(),
                }),
              100,
            ),
          ),
      );

      // Start transfer (don't await)
      const transferPromise = service.executeTransferWithLock(
        'test-txn',
        'TAddr',
        100,
      );

      // Check status immediately
      const isInProgress = service.isTransferInProgress('test-txn');
      expect(isInProgress).toBe(true);

      // Wait for transfer to complete
      await transferPromise;

      // Check status after completion
      const isInProgressAfter = service.isTransferInProgress('test-txn');
      expect(isInProgressAfter).toBe(false);
    });
  });

  describe('getTransferAttemptCount', () => {
    it('should return 0 for transactions with no attempts', () => {
      const count = service.getTransferAttemptCount('test-txn');

      expect(count).toBe(0);
    });

    it('should increment attempt count on each transfer', async () => {
      tronService.validateTransferRequirements.mockResolvedValue({
        valid: true,
        errors: [],
      });

      tronService.sendUSDTWithRetry.mockResolvedValue({
        txHash: '0x123',
        success: true,
        amount: 100,
        toAddress: 'TAddr',
        timestamp: new Date(),
      });

      // First attempt
      await service.executeTransferWithLock('test-txn', 'TAddr', 100);
      expect(service.getTransferAttemptCount('test-txn')).toBe(1);

      // Second attempt
      await service.executeTransferWithLock('test-txn', 'TAddr', 100);
      expect(service.getTransferAttemptCount('test-txn')).toBe(2);
    });
  });

  describe('getLockStatus', () => {
    it('should return empty status when no locks', () => {
      const status = service.getLockStatus();

      expect(status.lockCount).toBe(0);
      expect(status.lockedTransactions).toHaveLength(0);
      expect(status.attemptCounts).toEqual({});
    });

    it('should return current lock status', async () => {
      tronService.validateTransferRequirements.mockResolvedValue({
        valid: true,
        errors: [],
      });

      tronService.sendUSDTWithRetry.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  txHash: '0x123',
                  success: true,
                  amount: 100,
                  toAddress: 'TAddr',
                  timestamp: new Date(),
                }),
              100,
            ),
          ),
      );

      // Start transfer
      const transferPromise = service.executeTransferWithLock(
        'test-txn-1',
        'TAddr',
        100,
      );

      // Check status while locked
      const status = service.getLockStatus();
      expect(status.lockCount).toBe(1);
      expect(status.lockedTransactions).toContain('test-txn-1');
      expect(status.attemptCounts['test-txn-1']).toBe(1);

      await transferPromise;
    });
  });

  describe('forceReleaseLock', () => {
    it('should return false when releasing non-existent lock', () => {
      const released = service.forceReleaseLock('test-txn');

      expect(released).toBe(false);
    });

    it('should force release a stuck lock', async () => {
      tronService.validateTransferRequirements.mockResolvedValue({
        valid: true,
        errors: [],
      });

      tronService.sendUSDTWithRetry.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  txHash: '0x123',
                  success: true,
                  amount: 100,
                  toAddress: 'TAddr',
                  timestamp: new Date(),
                }),
              1000,
            ),
          ),
      );

      // Start transfer
      const transferPromise = service.executeTransferWithLock(
        'test-txn',
        'TAddr',
        100,
      );

      // Verify locked
      expect(service.isTransferInProgress('test-txn')).toBe(true);

      // Force release
      const released = service.forceReleaseLock('test-txn');
      expect(released).toBe(true);

      // Verify unlocked
      expect(service.isTransferInProgress('test-txn')).toBe(false);

      // Wait for original transfer to complete
      await transferPromise;
    });
  });
});
