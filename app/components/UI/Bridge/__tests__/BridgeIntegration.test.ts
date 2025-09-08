import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';
import { createBridgeTestState } from '../testUtils';
import { useBridgeQuoteRequest } from '../hooks/useBridgeQuoteRequest';
import { useBridgeQuoteData } from '../hooks/useBridgeQuoteData';
import Engine from '../../../../core/Engine';
import { act } from '@testing-library/react-native';
import { RequestStatus, type QuoteResponse, selectBridgeQuotes } from '@metamask/bridge-controller';
import mockQuotes from '../_mocks_/mock-quotes-sol-sol.json';
import { SolScope } from '@metamask/keyring-api';

const mockSuccessfulQuoteResponse = mockQuotes[0] as unknown as QuoteResponse;

jest.mock('../../../../core/Engine', () => ({
  context: {
    BridgeController: {
      updateBridgeQuoteRequestParams: jest.fn(),
      resetState: jest.fn(),
    },
    KeyringController: {
      state: {
        keyrings: [],
      },
    },
  },
}));

jest.mock('../utils/quoteUtils', () => ({
  isQuoteExpired: jest.fn(),
  getQuoteRefreshRate: jest.fn(),
  shouldRefreshQuote: jest.fn(),
}));

jest.mock('../hooks/useUnifiedSwapBridgeContext', () => ({
  useUnifiedSwapBridgeContext: jest.fn(() => ({
    stx_enabled: false,
    token_symbol_source: 'ETH',
    token_symbol_destination: 'SOL',
    security_warnings: [],
    warnings: [],
  })),
}));

jest.mock('@metamask/bridge-controller', () => ({
  ...jest.requireActual('@metamask/bridge-controller'),
  selectBridgeQuotes: jest.fn(() => ({
    recommendedQuote: null,
    alternativeQuotes: [],
  })),
}));

const mockUpdateBridgeQuoteRequestParams = jest.spyOn(
  Engine.context.BridgeController,
  'updateBridgeQuoteRequestParams',
);

describe('Bridge Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    const mockIsQuoteExpired = jest.requireMock('../utils/quoteUtils').isQuoteExpired;
    const mockGetQuoteRefreshRate = jest.requireMock('../utils/quoteUtils').getQuoteRefreshRate;
    const mockShouldRefreshQuote = jest.requireMock('../utils/quoteUtils').shouldRefreshQuote;

    mockIsQuoteExpired.mockReturnValue(false);
    mockGetQuoteRefreshRate.mockReturnValue(30000);
    mockShouldRefreshQuote.mockReturnValue(true);

    (selectBridgeQuotes as unknown as jest.Mock).mockReturnValue({
      recommendedQuote: null,
      alternativeQuotes: [],
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Cross-chain Transaction Flows', () => {
    it('should handle EVM to Solana bridge quote request flow', async () => {
      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1',
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          destToken: {
            address: 'So11111111111111111111111111111111111111112',
            chainId: SolScope.Mainnet,
            decimals: 9,
            symbol: 'SOL',
            name: 'Solana',
          },
          sourceAmount: '1.0',
          selectedDestChainId: SolScope.Mainnet,
          destAddress: 'FakeS0LanaAddr3ss111111111111111111111111111',
        },
      });

      const { result: quoteRequestResult } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        await quoteRequestResult.current();
        jest.advanceTimersByTime(700);
      });

      expect(mockUpdateBridgeQuoteRequestParams).toHaveBeenCalledWith(
        expect.objectContaining({
          srcChainId: '1',
          destChainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          destWalletAddress: 'FakeS0LanaAddr3ss111111111111111111111111111',
        }),
        expect.any(Object)
      );
    });

    it('should handle Solana to EVM bridge quote request flow', async () => {
      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: 'So11111111111111111111111111111111111111112',
            chainId: SolScope.Mainnet,
            decimals: 9,
            symbol: 'SOL',
            name: 'Solana',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1',
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          sourceAmount: '2.5',
          selectedDestChainId: '0x1',
        },
      });

      const { result: quoteRequestResult } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        await quoteRequestResult.current();
        jest.advanceTimersByTime(700);
      });

      expect(mockUpdateBridgeQuoteRequestParams).toHaveBeenCalledWith(
        expect.objectContaining({
          srcChainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          destChainId: '1',
          srcTokenAmount: '2500000000',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Quote Validation', () => {
    it('should handle insufficient funds scenario', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteRequest: {
            insufficientBal: true,
          },
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: [],
          quoteFetchError: null,
        },
        bridgeReducerOverrides: {
          sourceAmount: '10.0',
        },
      });

      const mockShouldRefreshQuote = jest.requireMock('../utils/quoteUtils').shouldRefreshQuote;
      mockShouldRefreshQuote.mockReturnValue(false);

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.willRefresh).toBe(false);
      expect(quoteDataResult.current.isNoQuotesAvailable).toBe(false);
    });

    it('should validate quote parameters before making requests', async () => {
      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: undefined,
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1',
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          sourceAmount: '1.0',
        },
      });

      const { result: quoteRequestResult } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        await quoteRequestResult.current();
        jest.advanceTimersByTime(700);
      });

      expect(mockUpdateBridgeQuoteRequestParams).not.toHaveBeenCalled();
    });

    it('should handle quote amount validation with different token decimals', async () => {
      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            chainId: '0x1',
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
          sourceAmount: '1000.123456',
        },
      });

      const { result: quoteRequestResult } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        await quoteRequestResult.current();
        jest.advanceTimersByTime(700);
      });

      expect(mockUpdateBridgeQuoteRequestParams).toHaveBeenCalledWith(
        expect.objectContaining({
          srcTokenAmount: '1000123456',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Timeout Handling', () => {
    it('should handle quote expiration without refresh', async () => {
      const expiredTimestamp = Date.now() - 35000;

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [mockSuccessfulQuoteResponse],
          quotesLastFetched: expiredTimestamp,
          quotesRefreshCount: 5,
          quoteFetchError: null,
        },
      });

      const mockIsQuoteExpired = jest.requireMock('../utils/quoteUtils').isQuoteExpired;
      const mockShouldRefreshQuote = jest.requireMock('../utils/quoteUtils').shouldRefreshQuote;
      mockIsQuoteExpired.mockReturnValue(true);
      mockShouldRefreshQuote.mockReturnValue(false);

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.isExpired).toBe(true);
      expect(quoteDataResult.current.willRefresh).toBe(false);
      expect(quoteDataResult.current.activeQuote).toBeUndefined();
    });

    it('should handle quote expiration with refresh capability', async () => {
      const expiredTimestamp = Date.now() - 35000;

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [mockSuccessfulQuoteResponse],
          quotesLastFetched: expiredTimestamp,
          quotesRefreshCount: 2,
          quoteRequest: {
            insufficientBal: false,
          },
        },
      });

      const mockIsQuoteExpired = jest.requireMock('../utils/quoteUtils').isQuoteExpired;
      const mockShouldRefreshQuote = jest.requireMock('../utils/quoteUtils').shouldRefreshQuote;
      mockIsQuoteExpired.mockReturnValue(false);
      mockShouldRefreshQuote.mockReturnValue(true);

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.isExpired).toBe(false);
      expect(quoteDataResult.current.willRefresh).toBe(true);
      expect(quoteDataResult.current.activeQuote).toBeDefined();
    });

    it('should respect custom refresh rates for different chains', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [mockSuccessfulQuoteResponse],
          quotesLastFetched: Date.now() - 20000,
        },
      });

      const mockGetQuoteRefreshRate = jest.requireMock('../utils/quoteUtils').getQuoteRefreshRate;
      const mockIsQuoteExpired = jest.requireMock('../utils/quoteUtils').isQuoteExpired;
      mockGetQuoteRefreshRate.mockReturnValue(15000);
      mockIsQuoteExpired.mockReturnValue(true);

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.isExpired).toBe(true);
    });
  });

  describe('Error Scenarios with External Bridge Providers', () => {
    it('should handle external provider network failures', async () => {
      const networkError = 'Network request failed';

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteFetchError: networkError,
          quotesLoadingStatus: null,
          quotes: [],
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.quoteFetchError).toBe(networkError);
      expect(quoteDataResult.current.isLoading).toBe(false);
      expect(quoteDataResult.current.activeQuote).toBeNull();
    });

    it('should handle provider timeout scenarios', async () => {
      const timeoutError = 'Request timeout after 30 seconds';

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteFetchError: timeoutError,
          quotesLoadingStatus: null,
          quotes: [],
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.quoteFetchError).toBe(timeoutError);
      expect(quoteDataResult.current.isNoQuotesAvailable).toBe(false);
    });

    it('should handle provider rate limiting', async () => {
      const rateLimitError = 'Rate limit exceeded. Please try again later.';

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteFetchError: rateLimitError,
          quotesLoadingStatus: null,
          quotes: [],
          quotesRefreshCount: 3,
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.quoteFetchError).toBe(rateLimitError);
      expect(quoteDataResult.current.willRefresh).toBe(true);
    });

    it('should handle malformed provider responses', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [
            {
              quote: {
                srcChainId: 1,
                destChainId: 1,
              },
            } as unknown as QuoteResponse,
          ],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: null,
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.destTokenAmount).toBeUndefined();
      expect(quoteDataResult.current.formattedQuoteData).toBeUndefined();
    });
  });

  describe('Loading State Integration', () => {
    it('should handle complete quote fetching lifecycle', async () => {
      let testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.LOADING,
          quotes: [],
          quoteFetchError: null,
        },
      });

      const { result: quoteDataResult, rerender } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.isLoading).toBe(true);
      expect(quoteDataResult.current.activeQuote).toBeNull();

      testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: [mockSuccessfulQuoteResponse],
          quotesLastFetched: Date.now(),
          quoteFetchError: null,
        },
      });

      rerender({ state: testState });

      expect(quoteDataResult.current.isLoading).toBe(true);
      expect(quoteDataResult.current.activeQuote).toBeDefined();
    });

    it('should handle debounced quote requests during loading', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.LOADING,
        },
        bridgeReducerOverrides: {
          sourceAmount: '1.0',
        },
      });

      const { result: quoteRequestResult } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        quoteRequestResult.current();
        quoteRequestResult.current();
        quoteRequestResult.current();

        jest.advanceTimersByTime(300);

        quoteRequestResult.current();

        jest.advanceTimersByTime(700);
      });

      expect(mockUpdateBridgeQuoteRequestParams).toHaveBeenCalledTimes(1);
    });
  });
});
