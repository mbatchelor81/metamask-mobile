import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';
import { createBridgeTestState } from '../testUtils';
import Engine from '../../../../core/Engine';
import { act } from '@testing-library/react-native';
import { useBridgeQuoteRequest, DEBOUNCE_WAIT } from '../hooks/useBridgeQuoteRequest';
import { useBridgeQuoteData } from '../hooks/useBridgeQuoteData';
import { RequestStatus, type QuoteResponse, isSolanaChainId } from '@metamask/bridge-controller';
import mockQuotes from '../_mocks_/mock-quotes-sol-sol.json';
import { Hex } from '@metamask/utils';
import { SolScope } from '@metamask/keyring-api';
import { isQuoteExpired, getQuoteRefreshRate, shouldRefreshQuote } from '../utils/quoteUtils';

jest.mock('@metamask/bridge-controller', () => ({
  ...jest.requireActual('@metamask/bridge-controller'),
  isSolanaChainId: jest.fn(),
  fetchBridgeTokens: jest.fn(),
}));

jest.mock('../../../../core/Engine', () => ({
  context: {
    BridgeController: {
      updateBridgeQuoteRequestParams: jest.fn(),
      resetState: jest.fn(),
      setBridgeFeatureFlags: jest.fn(),
    },
  },
}));

jest.mock('../utils/quoteUtils', () => ({
  isQuoteExpired: jest.fn(),
  getQuoteRefreshRate: jest.fn(),
  shouldRefreshQuote: jest.fn(),
}));

jest.mock('../hooks/useUnifiedSwapBridgeContext', () => ({
  useUnifiedSwapBridgeContext: jest.fn(),
}));

const mockSelectPrimaryCurrency = jest.fn();
jest.mock('../../../../selectors/settings', () => ({
  ...jest.requireActual('../../../../selectors/settings'),
  selectPrimaryCurrency: () => mockSelectPrimaryCurrency(),
}));

jest.useFakeTimers();

const spyUpdateBridgeQuoteRequestParams = jest.spyOn(
  Engine.context.BridgeController,
  'updateBridgeQuoteRequestParams',
);

describe('Bridge Quote Fetching Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (isQuoteExpired as jest.Mock).mockReturnValue(false);
    (getQuoteRefreshRate as jest.Mock).mockReturnValue(30000);
    (shouldRefreshQuote as jest.Mock).mockReturnValue(true);
    mockSelectPrimaryCurrency.mockReturnValue('ETH');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Cross-Chain Transaction Flows', () => {
    it('should handle EVM to EVM bridging flow', async () => {
      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: '0x1' as Hex,
            name: 'Ethereum',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: '0x89' as Hex,
            name: 'Polygon ETH',
          },
          selectedDestChainId: '0x89' as Hex,
          sourceAmount: '1.0',
        },
      });

      const { result: quoteRequestResult } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        await quoteRequestResult.current();
        jest.advanceTimersByTime(DEBOUNCE_WAIT);
      });

      expect(spyUpdateBridgeQuoteRequestParams).toHaveBeenCalledWith(
        expect.objectContaining({
          srcChainId: '1',
          destChainId: '137',
          srcTokenAddress: '0x0000000000000000000000000000000000000000',
          destTokenAddress: '0x0000000000000000000000000000000000000000',
          srcTokenAmount: '1000000000000000000',
        }),
        undefined,
      );
    });

    it('should handle EVM to Solana bridging with destination address', async () => {
      const solanaDestChainId = '0xfa' as Hex;
      const evmSourceChainId = '0x1' as Hex;
      const destSolanaAddress = 'FakeS0LanaAddr3ss111111111111111111111111111';

      (isSolanaChainId as jest.Mock).mockImplementation(
        (chainId) => chainId === solanaDestChainId,
      );

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
            address: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            decimals: 9,
            chainId: solanaDestChainId,
            name: 'Solana',
          },
          selectedDestChainId: solanaDestChainId,
          destAddress: destSolanaAddress,
          sourceAmount: '0.5',
        },
      });

      const { result: quoteRequestResult } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        await quoteRequestResult.current();
        jest.advanceTimersByTime(DEBOUNCE_WAIT);
      });

      expect(spyUpdateBridgeQuoteRequestParams).toHaveBeenCalledWith(
        expect.objectContaining({
          destWalletAddress: destSolanaAddress,
          srcChainId: '1',
          destChainId: '250',
          srcTokenAmount: '500000000000000000',
        }),
        undefined,
      );
    });

    it('should handle Solana to EVM bridging', async () => {
      const solanaSourceChainId = SolScope.Mainnet;
      const evmDestChainId = '0x1' as Hex;

      (isSolanaChainId as jest.Mock).mockImplementation(
        (chainId) => chainId === solanaSourceChainId,
      );

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: 'So11111111111111111111111111111111111111112',
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
          selectedDestChainId: evmDestChainId,
          sourceAmount: '2.0',
        },
      });

      const { result: quoteRequestResult } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        await quoteRequestResult.current();
        jest.advanceTimersByTime(DEBOUNCE_WAIT);
      });

      expect(spyUpdateBridgeQuoteRequestParams).toHaveBeenCalledWith(
        expect.objectContaining({
          srcTokenAmount: '2000000000',
          destChainId: '1',
        }),
        undefined,
      );
    });

    it('should handle multi-step bridge transaction with intermediate chains', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [
            {
              ...mockQuotes[0],
              quote: {
                ...mockQuotes[0].quote,
                steps: [
                  {
                    action: 'bridge',
                    srcChainId: 1,
                    destChainId: 137,
                    protocol: { name: 'polygon-bridge', displayName: 'Polygon Bridge' },
                    srcAsset: { symbol: 'ETH', decimals: 18 },
                    destAsset: { symbol: 'ETH', decimals: 18 },
                    srcAmount: '1000000000000000000',
                    destAmount: '999000000000000000',
                  },
                  {
                    action: 'swap',
                    srcChainId: 137,
                    destChainId: 137,
                    protocol: { name: 'uniswap', displayName: 'Uniswap' },
                    srcAsset: { symbol: 'ETH', decimals: 18 },
                    destAsset: { symbol: 'USDC', decimals: 6 },
                    srcAmount: '999000000000000000',
                    destAmount: '1998000000',
                  },
                ],
              },
            } as unknown as QuoteResponse,
          ],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: Date.now(),
        },
        bridgeReducerOverrides: {
          sourceAmount: '1.0',
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.bestQuote).toBeDefined();
      expect(quoteDataResult.current.bestQuote?.quote.steps).toHaveLength(2);
      expect(quoteDataResult.current.bestQuote?.quote.steps[0].action).toBe('bridge');
      expect(quoteDataResult.current.bestQuote?.quote.steps[1].action).toBe('swap');
    });
  });

  describe('Quote Validation', () => {
    it('should validate amount conversion with different token decimals', async () => {
      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceAmount: '1000.123456',
          sourceToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            symbol: 'USDC',
            decimals: 6,
            chainId: '0x1' as Hex,
            name: 'USD Coin',
          },
        },
      });

      const { result: quoteRequestResult } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        await quoteRequestResult.current();
        jest.advanceTimersByTime(DEBOUNCE_WAIT);
      });

      expect(spyUpdateBridgeQuoteRequestParams).toHaveBeenCalledWith(
        expect.objectContaining({
          srcTokenAmount: '1000123456',
        }),
        undefined,
      );
    });

    it('should handle insufficient balance scenarios', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteRequest: {
            insufficientBal: true,
          },
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: [],
          quotesLastFetched: Date.now(),
        },
        bridgeReducerOverrides: {
          sourceAmount: '999999.0',
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.isNoQuotesAvailable).toBe(true);
      expect(quoteDataResult.current.bestQuote).toBeNull();
    });

    it('should validate token address formats', async () => {
      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: undefined,
          sourceAmount: '1.0',
        },
      });

      const { result: quoteRequestResult } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        await quoteRequestResult.current();
        jest.advanceTimersByTime(DEBOUNCE_WAIT);
      });

      expect(spyUpdateBridgeQuoteRequestParams).not.toHaveBeenCalled();
    });

    it('should handle slippage validation', async () => {
      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          slippage: '2.5',
          sourceAmount: '1.0',
        },
      });

      const { result: quoteRequestResult } = renderHookWithProvider(
        () => useBridgeQuoteRequest(),
        { state: testState }
      );

      await act(async () => {
        await quoteRequestResult.current();
        jest.advanceTimersByTime(DEBOUNCE_WAIT);
      });

      expect(spyUpdateBridgeQuoteRequestParams).toHaveBeenCalledWith(
        expect.objectContaining({
          slippage: 2.5,
        }),
        undefined,
      );
    });

    it('should calculate price impact correctly', async () => {
      const mockQuoteWithPriceImpact = {
        ...mockQuotes[0],
        quote: {
          ...mockQuotes[0].quote,
          bridgePriceData: {
            ...mockQuotes[0].quote.bridgePriceData,
            priceImpact: -0.025,
          },
        },
      };

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [mockQuoteWithPriceImpact as unknown as QuoteResponse],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: Date.now(),
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.formattedQuoteData?.priceImpact).toBe('-2.50%');
    });
  });

  describe('Timeout and Expiration Handling', () => {
    it('should handle quote expiration without refresh', async () => {
      (isQuoteExpired as jest.Mock).mockReturnValue(true);
      (shouldRefreshQuote as jest.Mock).mockReturnValue(false);

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as unknown as QuoteResponse[],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: Date.now() - 60000,
          quotesRefreshCount: 5,
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.isExpired).toBe(true);
      expect(quoteDataResult.current.willRefresh).toBe(false);
      expect(quoteDataResult.current.activeQuote).toBeUndefined();
    });

    it('should handle quote expiration with automatic refresh', async () => {
      (isQuoteExpired as jest.Mock).mockReturnValue(true);
      (shouldRefreshQuote as jest.Mock).mockReturnValue(true);

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as unknown as QuoteResponse[],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: Date.now() - 35000,
          quotesRefreshCount: 2,
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.isExpired).toBe(true);
      expect(quoteDataResult.current.willRefresh).toBe(true);
      expect(quoteDataResult.current.bestQuote).toBeDefined();
    });

    it('should respect refresh rate configuration', async () => {
      (getQuoteRefreshRate as jest.Mock).mockReturnValue(15000);

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLastFetched: Date.now() - 20000,
        },
      });

      renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(getQuoteRefreshRate).toHaveBeenCalled();
    });

    it('should enforce maximum refresh count limits', async () => {
      (shouldRefreshQuote as jest.Mock).mockImplementation(
        (_insufficientBal, quotesRefreshCount, maxRefreshCount) =>
          quotesRefreshCount < maxRefreshCount
      );

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesRefreshCount: 5,
        },
      });

      renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(shouldRefreshQuote).toHaveBeenCalledWith(
        false,
        5,
        5,
        false,
      );
    });

    it('should handle debounced quote requests correctly', async () => {
      const testState = createBridgeTestState({
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

        jest.advanceTimersByTime(DEBOUNCE_WAIT - 100);
        expect(spyUpdateBridgeQuoteRequestParams).not.toHaveBeenCalled();

        jest.advanceTimersByTime(200);
        expect(spyUpdateBridgeQuoteRequestParams).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle external API failures', async () => {
      const apiError = 'Bridge API unavailable';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteFetchError: apiError,
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: [],
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.quoteFetchError).toBe(apiError);
      expect(quoteDataResult.current.isLoading).toBe(false);
      expect(quoteDataResult.current.bestQuote).toBeNull();
    });

    it('should handle network connectivity issues', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteFetchError: 'Network request failed',
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: [],
        },
        bridgeReducerOverrides: {
          sourceAmount: '1.0',
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.quoteFetchError).toBe('Network request failed');
      expect(quoteDataResult.current.isLoading).toBe(false);
      expect(quoteDataResult.current.bestQuote).toBeNull();
    });

    it('should handle invalid quote responses', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: Date.now(),
          quoteFetchError: 'Invalid quote response format',
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.quoteFetchError).toBe('Invalid quote response format');
      expect(quoteDataResult.current.destTokenAmount).toBeUndefined();
    });

    it('should handle provider unavailability scenarios', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: Date.now(),
          quoteFetchError: null,
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.isNoQuotesAvailable).toBe(true);
      expect(quoteDataResult.current.bestQuote).toBeNull();
    });

    it('should handle loading states correctly', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.LOADING,
          quotes: [],
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.isLoading).toBe(true);
      expect(quoteDataResult.current.activeQuote).toBeNull();
      expect(quoteDataResult.current.isNoQuotesAvailable).toBe(false);
    });

    it('should handle rate limiting scenarios', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteFetchError: 'Rate limit exceeded',
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: [],
        },
        bridgeReducerOverrides: {
          sourceAmount: '1.0',
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(quoteDataResult.current.quoteFetchError).toBe('Rate limit exceeded');
      expect(quoteDataResult.current.isLoading).toBe(false);
      expect(quoteDataResult.current.bestQuote).toBeNull();
    });
  });

  describe('End-to-End Integration', () => {
    beforeEach(() => {
      spyUpdateBridgeQuoteRequestParams.mockClear();
      spyUpdateBridgeQuoteRequestParams.mockResolvedValue(undefined);
    });

    it('should integrate quote request and data hooks for complete workflow', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as unknown as QuoteResponse[],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: Date.now(),
        },
        bridgeReducerOverrides: {
          sourceAmount: '0.5',
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
        await quoteRequestResult.current();
        jest.advanceTimersByTime(DEBOUNCE_WAIT);
      });

      expect(spyUpdateBridgeQuoteRequestParams).toHaveBeenCalled();
      expect(quoteDataResult.current.bestQuote).toBeDefined();
      expect(quoteDataResult.current.destTokenAmount).toBeDefined();
      expect(quoteDataResult.current.formattedQuoteData).toBeDefined();
    });

    it('should handle complete cross-chain workflow with state updates', async () => {
      const loadingState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.LOADING,
          quotes: [],
        },
        bridgeReducerOverrides: {
          sourceAmount: '1.0',
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: '0x1' as Hex,
            name: 'Ethereum',
          },
          destToken: {
            address: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            decimals: 9,
            chainId: '0xfa' as Hex,
            name: 'Solana',
          },
        },
      });

      const { result: loadingResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: loadingState }
      );

      expect(loadingResult.current.isLoading).toBe(true);

      const fetchedState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as unknown as QuoteResponse[],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: Date.now(),
        },
        bridgeReducerOverrides: {
          sourceAmount: '1.0',
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: '0x1' as Hex,
            name: 'Ethereum',
          },
          destToken: {
            address: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            decimals: 9,
            chainId: '0xfa' as Hex,
            name: 'Solana',
          },
        },
      });

      const { result: fetchedResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: fetchedState }
      );

      expect(fetchedResult.current.isLoading).toBe(false);
      expect(fetchedResult.current.bestQuote).toBeDefined();
    });

    it('should handle error recovery workflows', async () => {
      const errorState = createBridgeTestState({
        bridgeControllerOverrides: {
          quoteFetchError: 'Network error',
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotes: [],
        },
      });

      const { result: errorResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: errorState }
      );

      expect(errorResult.current.quoteFetchError).toBe('Network error');
      expect(errorResult.current.bestQuote).toBeNull();

      const recoveredState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as unknown as QuoteResponse[],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: Date.now(),
          quoteFetchError: null,
        },
        bridgeReducerOverrides: {
          sourceAmount: '1.0',
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: '0x1' as Hex,
            name: 'Ethereum',
          },
          destToken: {
            address: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            decimals: 9,
            chainId: '0xfa' as Hex,
            name: 'Solana',
          },
        },
      });

      const { result: recoveredResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: recoveredState }
      );

      expect(recoveredResult.current.quoteFetchError).toBeNull();
      expect(recoveredResult.current.bestQuote).toBeDefined();
    });

    it('should handle complex multi-chain scenarios with proper validation', async () => {
      const complexState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [
            {
              ...mockQuotes[0],
              quote: {
                ...mockQuotes[0].quote,
                srcChainId: 1,
                destChainId: 1151111081099710,
                srcTokenAmount: '1000000000000000000',
                destTokenAmount: '57056221',
                steps: [
                  {
                    action: 'bridge',
                    srcChainId: 1,
                    destChainId: 1151111081099710,
                    protocol: { name: 'wormhole', displayName: 'Wormhole' },
                    srcAsset: { symbol: 'ETH', decimals: 18 },
                    destAsset: { symbol: 'SOL', decimals: 9 },
                    srcAmount: '1000000000000000000',
                    destAmount: '57056221',
                  },
                ],
              },
            } as unknown as QuoteResponse,
          ],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: Date.now(),
        },
        bridgeReducerOverrides: {
          sourceAmount: '1.0',
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: '0x1' as Hex,
            name: 'Ethereum',
          },
          destToken: {
            address: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            decimals: 9,
            chainId: '0xfa' as Hex,
            name: 'Solana',
          },
        },
      });

      const { result: quoteDataResult } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: complexState }
      );

      expect(quoteDataResult.current.bestQuote).toBeDefined();
      expect(quoteDataResult.current.destTokenAmount).toBe('0.057056221');
      expect(quoteDataResult.current.formattedQuoteData?.estimatedTime).toBe('1 min');
    });
  });
});
