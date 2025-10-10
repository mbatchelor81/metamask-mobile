import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import { useBridgeQuoteRequest } from '../../hooks/useBridgeQuoteRequest';
import { useBridgeQuoteData } from '../../hooks/useBridgeQuoteData';
import Engine from '../../../../../core/Engine';
import { createBridgeTestState } from '../../testUtils';
import mockQuotes from '../../_mocks_/mock-quotes-sol-sol.json';
import { QuoteResponse, RequestStatus, isSolanaChainId } from '@metamask/bridge-controller';
import { act } from '@testing-library/react-native';

jest.mock('@metamask/bridge-controller', () => ({
  ...jest.requireActual('@metamask/bridge-controller'),
  isSolanaChainId: jest.fn(),
}));

jest.mock('../../../../../core/Engine', () => ({
  context: {
    BridgeController: {
      updateBridgeQuoteRequestParams: jest.fn(),
    },
    KeyringController: {
      state: {
        keyrings: [
          {
            accounts: ['0x1234567890123456789012345678901234567890'],
            type: 'HD Key Tree',
          },
        ],
      },
    },
  },
}));

jest.mock('../../hooks/useUnifiedSwapBridgeContext', () => ({
  useUnifiedSwapBridgeContext: jest.fn(),
}));

describe('Bridge Quote Fetching Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (isSolanaChainId as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Cross-chain transaction flows', () => {
    it('should handle EVM to Solana bridge flow with correct destination address', async () => {
      const evmChainId = '0x1';
      const solanaChainId = '0xfa';
      const solanaDestAddress = 'FakeS0LanaAddr3ss111111111111111111111111111';

      (isSolanaChainId as jest.Mock).mockImplementation(
        (chainId) => chainId === solanaChainId,
      );

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteRequest: {
            srcChainId: Number(evmChainId),
            destChainId: Number(solanaChainId),
            srcTokenAddress: '0x0000000000000000000000000000000000000000',
            destTokenAddress: '0x0000000000000000000000000000000000000000',
            srcTokenAmount: '1000000000000000000',
          },
          quotes: [],
          quotesLoadingStatus: null,
          quoteFetchError: null,
        },
        bridgeReducerOverrides: {
          selectedDestChainId: solanaChainId,
          destAddress: solanaDestAddress,
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: evmChainId,
            name: 'Ethereum',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'SOL',
            decimals: 9,
            chainId: solanaChainId,
            name: 'Solana',
          },
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteRequest(), {
        state: testState,
      });

      await act(async () => {
        await result.current();
        jest.advanceTimersByTime(700);
      });

      expect(
        Engine.context.BridgeController.updateBridgeQuoteRequestParams,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          srcChainId: String(Number(evmChainId)),
          destChainId: String(Number(solanaChainId)),
          destWalletAddress: solanaDestAddress,
        }),
        undefined,
      );
    });

    it('should handle Solana to EVM bridge flow with correct destination address', async () => {
      const solanaChainId = '0xfa';
      const evmChainId = '0x1';
      const evmWalletAddress = '0x1234567890123456789012345678901234567890';

      (isSolanaChainId as jest.Mock).mockImplementation(
        (chainId) => chainId === solanaChainId,
      );

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteRequest: {
            srcChainId: Number(solanaChainId),
            destChainId: Number(evmChainId),
            srcTokenAddress: '0x0000000000000000000000000000000000000000',
            destTokenAddress: '0x0000000000000000000000000000000000000000',
            srcTokenAmount: '500000000',
          },
          quotes: [],
          quotesLoadingStatus: null,
          quoteFetchError: null,
        },
        bridgeReducerOverrides: {
          selectedDestChainId: evmChainId,
          destAddress: evmWalletAddress,
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'SOL',
            decimals: 9,
            chainId: solanaChainId,
            name: 'Solana',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: evmChainId,
            name: 'Ethereum',
          },
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteRequest(), {
        state: testState,
      });

      await act(async () => {
        await result.current();
        jest.advanceTimersByTime(700);
      });

      expect(
        Engine.context.BridgeController.updateBridgeQuoteRequestParams,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          srcChainId: String(Number(solanaChainId)),
          destChainId: String(Number(evmChainId)),
          destWalletAddress: evmWalletAddress,
        }),
        undefined,
      );
    });

    it('should handle EVM to EVM bridge flow with same wallet address', async () => {
      const evmChainId1 = '0x1';
      const evmChainId2 = '0xa';

      (isSolanaChainId as jest.Mock).mockReturnValue(false);

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteRequest: {
            srcChainId: Number(evmChainId1),
            destChainId: Number(evmChainId2),
            srcTokenAddress: '0x0000000000000000000000000000000000000000',
            destTokenAddress: '0x0000000000000000000000000000000000000000',
            srcTokenAmount: '1000000000000000000',
          },
          quotes: [],
          quotesLoadingStatus: null,
          quoteFetchError: null,
        },
        bridgeReducerOverrides: {
          selectedDestChainId: evmChainId2,
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteRequest(), {
        state: testState,
      });

      await act(async () => {
        await result.current();
        jest.advanceTimersByTime(700);
      });

      expect(
        Engine.context.BridgeController.updateBridgeQuoteRequestParams,
      ).toHaveBeenCalled();
    });
  });

  describe('Quote validation scenarios', () => {
    it('should not trigger quote request when source token is missing', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteRequest: {},
          quotes: [],
          quotesLoadingStatus: null,
          quoteFetchError: null,
        },
        bridgeReducerOverrides: {
          sourceToken: undefined,
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteRequest(), {
        state: testState,
      });

      await act(async () => {
        await result.current();
        jest.advanceTimersByTime(700);
      });

      expect(
        Engine.context.BridgeController.updateBridgeQuoteRequestParams,
      ).not.toHaveBeenCalled();
    });

    it('should trigger quote request with normalized zero amount', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteRequest: {},
          quotes: [],
          quotesLoadingStatus: null,
          quoteFetchError: null,
        },
        bridgeReducerOverrides: {
          sourceAmount: '0',
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteRequest(), {
        state: testState,
      });

      await act(async () => {
        await result.current();
        jest.advanceTimersByTime(700);
      });

      expect(
        Engine.context.BridgeController.updateBridgeQuoteRequestParams,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          srcTokenAmount: '0',
        }),
        undefined,
      );
    });

    it('should handle decimal point input as zero amount', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteRequest: {},
          quotes: [],
          quotesLoadingStatus: null,
          quoteFetchError: null,
        },
        bridgeReducerOverrides: {
          sourceAmount: '.',
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteRequest(), {
        state: testState,
      });

      await act(async () => {
        await result.current();
        jest.advanceTimersByTime(700);
      });

      expect(
        Engine.context.BridgeController.updateBridgeQuoteRequestParams,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          srcTokenAmount: '0',
        }),
        undefined,
      );
    });

    it('should handle insufficient balance scenario', async () => {
      const pastTime = Date.now() - 35000;

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteRequest: {
            insufficientBal: true,
          },
          quotes: mockQuotes as unknown as QuoteResponse[],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: null,
          quotesLastFetched: pastTime,
          quotesRefreshCount: 0,
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.activeQuote).toBeUndefined();
      expect(result.current.willRefresh).toBe(false);
    });
  });

  describe('Timeout and debounce handling', () => {
    it('should debounce multiple rapid quote requests', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteRequest: {
            srcChainId: 1,
            destChainId: 10,
            srcTokenAddress: '0x0000000000000000000000000000000000000000',
            destTokenAddress: '0x0000000000000000000000000000000000000000',
            srcTokenAmount: '1000000000000000000',
          },
          quotes: [],
          quotesLoadingStatus: null,
          quoteFetchError: null,
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteRequest(), {
        state: testState,
      });

      await act(async () => {
        result.current();
        result.current();
        result.current();

        jest.advanceTimersByTime(600);

        expect(
          Engine.context.BridgeController.updateBridgeQuoteRequestParams,
        ).not.toHaveBeenCalled();

        jest.advanceTimersByTime(200);

        expect(
          Engine.context.BridgeController.updateBridgeQuoteRequestParams,
        ).toHaveBeenCalledTimes(1);
      });
    });

    it('should show loading state during quote fetch', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.LOADING,
          quotes: [],
          quoteFetchError: null,
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.activeQuote).toBeNull();
    });

    it('should transition from loading to fetched state', async () => {
      const initialState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.LOADING,
          quotes: [],
          quoteFetchError: null,
        },
      });

      const { result: loadingResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: initialState },
      );

      expect(loadingResult.current.isLoading).toBe(true);

      const fetchedState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: mockQuotes as unknown as QuoteResponse[],
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
        },
      });

      const { result: fetchedResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: fetchedState },
      );

      expect(fetchedResult.current.isLoading).toBe(false);
      expect(fetchedResult.current.activeQuote).toBeDefined();
    });
  });

  describe('Error scenarios with external providers', () => {
    it('should handle network failure error', async () => {
      const errorMessage = 'Network request failed';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: null,
          quotes: [],
          quoteFetchError: errorMessage,
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.quoteFetchError).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeQuote).toBeNull();
    });

    it('should handle provider timeout error', async () => {
      const errorMessage = 'Request timeout';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: null,
          quotes: [],
          quoteFetchError: errorMessage,
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.quoteFetchError).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle invalid quote response error', async () => {
      const errorMessage = 'Invalid quote response format';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: null,
          quotes: [],
          quoteFetchError: errorMessage,
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.quoteFetchError).toBe(errorMessage);
      expect(result.current.activeQuote).toBeNull();
    });

    it('should recover from error state with subsequent successful fetch', async () => {
      const errorState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: null,
          quotes: [],
          quoteFetchError: 'Network error',
        },
      });

      const { result: errorResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: errorState },
      );

      expect(errorResult.current.quoteFetchError).toBe('Network error');
      expect(errorResult.current.activeQuote).toBeNull();

      const successState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: mockQuotes as unknown as QuoteResponse[],
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
        },
      });

      const { result: successResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: successState },
      );

      expect(successResult.current.quoteFetchError).toBeNull();
      expect(successResult.current.activeQuote).toBeDefined();
    });
  });

  describe('Quote refresh and expiration logic', () => {
    it('should mark quote as expired after refresh rate period', async () => {
      const pastTime = Date.now() - 35000;

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as unknown as QuoteResponse[],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: pastTime,
          quoteFetchError: null,
          quotesRefreshCount: 5,
          quoteRequest: {
            insufficientBal: false,
          },
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.isExpired).toBe(true);
      expect(result.current.willRefresh).toBe(false);
      expect(result.current.activeQuote).toBeUndefined();
    });

    it('should not mark quote as expired within refresh rate period', async () => {
      const recentTime = Date.now() - 10000;

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as unknown as QuoteResponse[],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: recentTime,
          quoteFetchError: null,
          quotesRefreshCount: 0,
          quoteRequest: {
            insufficientBal: false,
          },
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.isExpired).toBe(false);
    });

    it('should indicate willRefresh when quote is eligible for refresh', async () => {
      const pastTime = Date.now() - 35000;

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as unknown as QuoteResponse[],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: pastTime,
          quoteFetchError: null,
          quotesRefreshCount: 2,
          quoteRequest: {
            insufficientBal: false,
          },
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.willRefresh).toBe(true);
    });

    it('should not refresh when refresh count exceeds maximum', async () => {
      const pastTime = Date.now() - 35000;

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as unknown as QuoteResponse[],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: pastTime,
          quoteFetchError: null,
          quotesRefreshCount: 5,
          quoteRequest: {
            insufficientBal: false,
          },
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.willRefresh).toBe(false);
    });

    it('should handle no quotes available when expired', async () => {
      const pastTime = Date.now() - 35000;

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: pastTime,
          quoteFetchError: null,
          quotesRefreshCount: 5,
          quoteRequest: {
            insufficientBal: false,
          },
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.isNoQuotesAvailable).toBe(true);
      expect(result.current.activeQuote).toBeUndefined();
    });
  });

  describe('End-to-end quote fetching flow', () => {
    it('should complete full quote fetching lifecycle', async () => {
      const initialState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteRequest: {},
          quotes: [],
          quotesLoadingStatus: null,
          quoteFetchError: null,
          quotesLastFetched: null,
          quotesRefreshCount: 0,
        },
        bridgeReducerOverrides: {
          sourceAmount: '1.0',
        },
      });

      const { result: requestResult } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: initialState },
      );

      await act(async () => {
        await requestResult.current();
        jest.advanceTimersByTime(700);
      });

      expect(
        Engine.context.BridgeController.updateBridgeQuoteRequestParams,
      ).toHaveBeenCalled();

      const loadingState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.LOADING,
          quotes: [],
          quoteFetchError: null,
        },
      });

      const { result: loadingResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: loadingState },
      );

      expect(loadingResult.current.isLoading).toBe(true);

      const fetchedState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: mockQuotes as unknown as QuoteResponse[],
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
          quotesRefreshCount: 0,
        },
      });

      const { result: fetchedResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: fetchedState },
      );

      expect(fetchedResult.current.isLoading).toBe(false);
      expect(fetchedResult.current.quoteFetchError).toBeNull();
      expect(fetchedResult.current.activeQuote).toBeDefined();
      expect(fetchedResult.current.isExpired).toBe(false);
      expect(fetchedResult.current.isNoQuotesAvailable).toBe(false);
    });

    it('should handle state transitions with multiple updates', async () => {
      const initialState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: null,
          quoteFetchError: null,
        },
      });

      const { result: initialResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: initialState },
      );

      expect(initialResult.current.isLoading).toBe(false);
      expect(initialResult.current.activeQuote).toBeNull();

      const loadingState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.LOADING,
          quotes: [],
          quoteFetchError: null,
        },
      });

      const { result: loadingResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: loadingState },
      );

      expect(loadingResult.current.isLoading).toBe(true);

      const errorState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: null,
          quotes: [],
          quoteFetchError: 'Failed to fetch quotes',
        },
      });

      const { result: errorResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: errorState },
      );

      expect(errorResult.current.isLoading).toBe(false);
      expect(errorResult.current.quoteFetchError).toBe('Failed to fetch quotes');

      const retryLoadingState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.LOADING,
          quotes: [],
          quoteFetchError: null,
        },
      });

      const { result: retryLoadingResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: retryLoadingState },
      );

      expect(retryLoadingResult.current.isLoading).toBe(true);
      expect(retryLoadingResult.current.quoteFetchError).toBeNull();

      const successState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: mockQuotes as unknown as QuoteResponse[],
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
        },
      });

      const { result: successResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: successState },
      );

      expect(successResult.current.isLoading).toBe(false);
      expect(successResult.current.quoteFetchError).toBeNull();
      expect(successResult.current.activeQuote).toBeDefined();
    });
  });
});
