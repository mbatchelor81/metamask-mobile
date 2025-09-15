import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import { createBridgeTestState } from '../../testUtils';
import { useBridgeQuoteRequest, DEBOUNCE_WAIT } from '../../hooks/useBridgeQuoteRequest';
import { useBridgeQuoteData } from '../../hooks/useBridgeQuoteData';
import Engine from '../../../../../core/Engine';
import { RequestStatus } from '@metamask/bridge-controller';
import { act, waitFor } from '@testing-library/react-native';
import { setupIntegrationTests } from './testSetup';
import mockQuotes from '../../_mocks_/mock-quotes-sol-sol.json';

jest.mock('@metamask/bridge-controller', () => ({
  ...jest.requireActual('@metamask/bridge-controller'),
  isSolanaChainId: jest.fn(),
}));

jest.mock('../../hooks/useUnifiedSwapBridgeContext', () => ({
  useUnifiedSwapBridgeContext: jest.fn(),
}));

jest.mock('../../utils/quoteUtils', () => ({
  isQuoteExpired: jest.fn(),
  getQuoteRefreshRate: jest.fn(),
  shouldRefreshQuote: jest.fn(),
}));

describe('Bridge Quote Fetching Integration Tests', () => {
  setupIntegrationTests();

  describe('Quote Request Lifecycle', () => {
    it('should fetch quotes with debounced updates and handle loading states', async () => {
      const mockUpdateBridgeQuoteRequestParams = jest.fn().mockResolvedValue(undefined);
      Engine.context.BridgeController = {
        updateBridgeQuoteRequestParams: mockUpdateBridgeQuoteRequestParams,
        resetState: jest.fn(),
      } as any;

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.LOADING,
          quotes: [],
          quoteFetchError: null,
          quotesLastFetched: null,
          quotesRefreshCount: 0,
        },
      });

      const { result: quoteRequestResult } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      await act(async () => {
        quoteRequestResult.current();
        jest.advanceTimersByTime(DEBOUNCE_WAIT);
      });

      expect(mockUpdateBridgeQuoteRequestParams).toHaveBeenCalled();
      expect(quoteDataResult.current.isLoading).toBe(true);
    });

    it('should handle successful quote response with formatted data', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: mockQuotes as any,
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
          quotesRefreshCount: 0,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeQuote).toBeDefined();
      expect(result.current.formattedQuoteData).toBeDefined();
      expect(result.current.quoteFetchError).toBeNull();
    });

    it('should coalesce multiple rapid quote requests', async () => {
      const mockUpdateBridgeQuoteRequestParams = jest.fn().mockResolvedValue(undefined);
      Engine.context.BridgeController = {
        updateBridgeQuoteRequestParams: mockUpdateBridgeQuoteRequestParams,
        resetState: jest.fn(),
      } as any;

      const testState = createBridgeTestState();
      const { result } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        result.current();
        result.current();
        result.current();

        jest.advanceTimersByTime(DEBOUNCE_WAIT - 100);
        expect(mockUpdateBridgeQuoteRequestParams).not.toHaveBeenCalled();

        jest.advanceTimersByTime(200);
        expect(mockUpdateBridgeQuoteRequestParams).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Cross-Chain Transaction Flows', () => {
    it('should handle EVM to Solana bridge with destination address', async () => {
      const solanaDestChainId = '0xfa';
      const evmSourceChainId = '0x1';
      const destSolanaAddress = 'FakeS0LanaAddr3ss111111111111111111111111111';

      const mockUpdateBridgeQuoteRequestParams = jest.fn().mockResolvedValue(undefined);
      Engine.context.BridgeController = {
        updateBridgeQuoteRequestParams: mockUpdateBridgeQuoteRequestParams,
        resetState: jest.fn(),
      } as any;

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: evmSourceChainId,
            name: 'Ethereum',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'SOL',
            decimals: 9,
            chainId: solanaDestChainId,
            name: 'Solana',
          },
          destAddress: destSolanaAddress,
          selectedDestChainId: solanaDestChainId,
          sourceAmount: '1.0',
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        result.current();
        jest.advanceTimersByTime(DEBOUNCE_WAIT);
      });

      expect(mockUpdateBridgeQuoteRequestParams).toHaveBeenCalledWith(
        expect.objectContaining({
          srcChainId: 1,
          destChainId: 250,
          destWalletAddress: destSolanaAddress,
        }),
        undefined
      );
    });

    it('should handle Solana to EVM bridge flows', async () => {
      const evmDestChainId = '0x1';
      const solanaSourceChainId = '0xfa';
      const evmDestAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';

      const mockUpdateBridgeQuoteRequestParams = jest.fn().mockResolvedValue(undefined);
      Engine.context.BridgeController = {
        updateBridgeQuoteRequestParams: mockUpdateBridgeQuoteRequestParams,
        resetState: jest.fn(),
      } as any;

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'SOL',
            decimals: 9,
            chainId: solanaSourceChainId,
            name: 'Solana',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: evmDestChainId,
            name: 'Ethereum',
          },
          destAddress: evmDestAddress,
          selectedDestChainId: evmDestChainId,
          sourceAmount: '10.0',
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        result.current();
        jest.advanceTimersByTime(DEBOUNCE_WAIT);
      });

      expect(mockUpdateBridgeQuoteRequestParams).toHaveBeenCalledWith(
        expect.objectContaining({
          srcChainId: 250,
          destChainId: 1,
          destWalletAddress: evmDestAddress,
        }),
        undefined
      );
    });

    it('should validate required parameters for cross-chain transactions', async () => {
      const mockUpdateBridgeQuoteRequestParams = jest.fn().mockResolvedValue(undefined);
      Engine.context.BridgeController = {
        updateBridgeQuoteRequestParams: mockUpdateBridgeQuoteRequestParams,
        resetState: jest.fn(),
      } as any;

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: undefined,
          destToken: undefined,
          sourceAmount: undefined,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        result.current();
        jest.advanceTimersByTime(DEBOUNCE_WAIT);
      });

      expect(mockUpdateBridgeQuoteRequestParams).not.toHaveBeenCalled();
    });
  });

  describe('Quote Validation and Timeout Handling', () => {
    it('should handle quote expiration and refresh mechanisms', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockImplementation(() => now);

      const { isQuoteExpired, shouldRefreshQuote } = require('../../utils/quoteUtils');
      (isQuoteExpired as jest.Mock).mockReturnValue(true);
      (shouldRefreshQuote as jest.Mock).mockReturnValue(true);

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLastFetched: now - 35000,
          quotesRefreshCount: 2,
          quoteFetchError: null,
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteRequest: { insufficientBal: false },
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.isExpired).toBe(true);
      expect(result.current.willRefresh).toBe(true);
    });

    it('should stop refreshing after max attempts', async () => {
      const { shouldRefreshQuote } = require('../../utils/quoteUtils');
      (shouldRefreshQuote as jest.Mock).mockReturnValue(false);

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesRefreshCount: 5,
          quoteFetchError: null,
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteRequest: { insufficientBal: false },
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.willRefresh).toBe(false);
    });

    it('should handle quote refresh rate configuration', async () => {
      const { getQuoteRefreshRate } = require('../../utils/quoteUtils');
      (getQuoteRefreshRate as jest.Mock).mockReturnValue(15000);

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLastFetched: Date.now() - 20000,
          quotesRefreshCount: 1,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(getQuoteRefreshRate).toHaveBeenCalled();
    });

    it('should handle quote expiration without refresh eligibility', async () => {
      const { isQuoteExpired, shouldRefreshQuote } = require('../../utils/quoteUtils');
      (isQuoteExpired as jest.Mock).mockReturnValue(true);
      (shouldRefreshQuote as jest.Mock).mockReturnValue(false);

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLastFetched: Date.now() - 35000,
          quotesRefreshCount: 5,
          quoteFetchError: null,
          quotesLoadingStatus: RequestStatus.FETCHED,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.isExpired).toBe(true);
      expect(result.current.willRefresh).toBe(false);
      expect(result.current.activeQuote).toBeUndefined();
    });
  });

  describe('Error Scenarios with External Bridge Providers', () => {
    it('should handle network failures from bridge providers', async () => {
      const networkError = 'Network request failed';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteFetchError: networkError,
          quotesLoadingStatus: RequestStatus.ERROR,
          quotes: [],
          quotesLastFetched: null,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.quoteFetchError).toBe(networkError);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeQuote).toBeNull();
      expect(result.current.isNoQuotesAvailable).toBe(false);
    });

    it('should handle insufficient funds scenarios', async () => {
      const { shouldRefreshQuote } = require('../../utils/quoteUtils');
      (shouldRefreshQuote as jest.Mock).mockReturnValue(false);

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteRequest: { insufficientBal: true },
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: null,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.willRefresh).toBe(false);
    });

    it('should handle provider timeout scenarios', async () => {
      const timeoutError = 'Request timeout';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteFetchError: timeoutError,
          quotesLoadingStatus: RequestStatus.ERROR,
          quotes: [],
          quotesLastFetched: Date.now() - 60000,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.quoteFetchError).toBe(timeoutError);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeQuote).toBeNull();
    });

    it('should handle malformed quote responses', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: Date.now(),
          quoteFetchError: null,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.bestQuote).toBeNull();
      expect(result.current.activeQuote).toBeNull();
      expect(result.current.isNoQuotesAvailable).toBe(true);
      expect(result.current.formattedQuoteData).toBeUndefined();
    });

    it('should handle quote request parameter validation errors', async () => {
      const mockUpdateBridgeQuoteRequestParams = jest.fn().mockRejectedValue(
        new Error('Invalid quote parameters')
      );
      Engine.context.BridgeController = {
        updateBridgeQuoteRequestParams: mockUpdateBridgeQuoteRequestParams,
        resetState: jest.fn(),
      } as any;

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceAmount: 'invalid',
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        try {
          result.current();
          jest.advanceTimersByTime(DEBOUNCE_WAIT);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(mockUpdateBridgeQuoteRequestParams).toHaveBeenCalled();
    });

    it('should handle loading state transitions correctly', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.LOADING,
          quotes: [],
          quoteFetchError: null,
        },
      });

      const { result, rerender } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isNoQuotesAvailable).toBe(false);

      const updatedState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: [],
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
        },
      });

      rerender({ state: updatedState });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isNoQuotesAvailable).toBe(true);
    });
  });

  describe('Quote Data Formatting and Validation', () => {
    it('should format destination token amounts correctly', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as any,
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
          quotesRefreshCount: 0,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.destTokenAmount).toBeDefined();
      expect(typeof result.current.destTokenAmount).toBe('string');
    });

    it('should calculate quote rates correctly', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as any,
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
          quotesRefreshCount: 0,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.formattedQuoteData?.rate).toBeDefined();
      expect(result.current.formattedQuoteData?.rate).toContain('=');
    });

    it('should handle network fee formatting', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as any,
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
          quotesRefreshCount: 0,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.formattedQuoteData?.networkFee).toBeDefined();
    });

    it('should handle price impact and slippage formatting', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as any,
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
          quotesRefreshCount: 0,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.formattedQuoteData).toBeDefined();
      if (result.current.formattedQuoteData) {
        expect(typeof result.current.formattedQuoteData.priceImpact).toBe('string');
        expect(typeof result.current.formattedQuoteData.slippage).toBe('string');
        expect(result.current.formattedQuoteData.slippage).toBe('0.5%');
      }
    });
  });
});
