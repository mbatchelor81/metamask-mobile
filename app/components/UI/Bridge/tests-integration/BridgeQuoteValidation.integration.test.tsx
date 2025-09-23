import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';
import { createBridgeTestState } from '../testUtils';
import { useBridgeQuoteRequest } from '../hooks/useBridgeQuoteRequest';
import { useBridgeQuoteData } from '../hooks/useBridgeQuoteData';
import Engine from '../../../../core/Engine';
import { RequestStatus, type QuoteResponse } from '@metamask/bridge-controller';
import { act } from '@testing-library/react-native';
import { Hex } from '@metamask/utils';
import mockQuotes from '../_mocks_/mock-quotes-sol-sol.json';

jest.mock('../../../../../core/Engine', () => ({
  context: {
    BridgeController: {
      updateBridgeQuoteRequestParams: jest.fn(),
      resetState: jest.fn(),
    },
  },
}));

jest.mock('../hooks/useUnifiedSwapBridgeContext', () => ({
  useUnifiedSwapBridgeContext: jest.fn(),
}));

const mockProviderResponses = {
  multipleProviders: {
    quotes: [
      {
        quote: { destTokenAmount: '1000000', bridgePriceData: { priceImpact: -0.002 } },
        estimatedProcessingTimeInSeconds: 60,
        totalNetworkFee: { amount: '0.01', valueInCurrency: '10' },
      },
      {
        quote: { destTokenAmount: '1050000', bridgePriceData: { priceImpact: -0.001 } },
        estimatedProcessingTimeInSeconds: 90,
        totalNetworkFee: { amount: '0.015', valueInCurrency: '15' },
      },
    ] as unknown as QuoteResponse[],
    quotesLoadingStatus: RequestStatus.FETCHED,
    quotesLastFetched: Date.now(),
  },
  providerTimeout: {
    quotes: [],
    quotesLoadingStatus: RequestStatus.LOADING,
    quoteFetchError: 'Request timeout after 30 seconds',
    quotesLastFetched: null,
  },
  invalidQuoteData: {
    quotes: [
      {
        quote: null,
        estimatedProcessingTimeInSeconds: 0,
      },
    ] as unknown as QuoteResponse[],
    quotesLoadingStatus: RequestStatus.FETCHED,
    quotesLastFetched: Date.now(),
  },
  rateLimitError: {
    quotes: [],
    quotesLoadingStatus: RequestStatus.LOADING,
    quoteFetchError: 'Rate limit exceeded. Please try again later.',
    quotesLastFetched: null,
  },
};

describe('Bridge Quote Validation Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('External Provider Integration', () => {
    it('should handle multiple bridge provider responses and select best quote', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: mockProviderResponses.multipleProviders,
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          destToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            chainId: '0x1' as Hex,
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
          sourceAmount: '1.0',
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.bestQuote).toBeDefined();
      expect(result.current.activeQuote).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.quoteFetchError).toBeNull();
    });

    it('should validate quote parameters before sending to external providers', async () => {
      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          destToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            chainId: '0x1' as Hex,
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
          selectedDestChainId: '0x1' as Hex,
          sourceAmount: '1.5',
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteRequest(), {
        state: testState,
      });

      await act(async () => {
        await result.current();
        jest.advanceTimersByTime(700);
      });

      expect(Engine.context.BridgeController.updateBridgeQuoteRequestParams).toHaveBeenCalledWith(
        expect.objectContaining({
          srcChainId: 1,
          destChainId: 1,
          srcTokenAmount: '1500000000000000000',
          srcTokenAddress: '0x0000000000000000000000000000000000000000',
          destTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        }),
        undefined,
      );
    });

    it('should handle missing required parameters gracefully', async () => {
      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: undefined,
          destToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            chainId: '0x1' as Hex,
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
          sourceAmount: '1.0',
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteRequest(), {
        state: testState,
      });

      await act(async () => {
        await result.current();
        jest.advanceTimersByTime(700);
      });

      expect(Engine.context.BridgeController.updateBridgeQuoteRequestParams).not.toHaveBeenCalled();
    });

    it('should handle provider timeout errors', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: mockProviderResponses.providerTimeout,
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          destToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            chainId: '0x89' as Hex,
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
          sourceAmount: '1.0',
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.quoteFetchError).toBe('Request timeout after 30 seconds');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.bestQuote).toBeNull();
    });

    it('should handle rate limiting from external providers', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: mockProviderResponses.rateLimitError,
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          destToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            chainId: '0x1' as Hex,
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
          sourceAmount: '1.0',
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.quoteFetchError).toBe('Rate limit exceeded. Please try again later.');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.bestQuote).toBeNull();
    });
  });

  describe('Quote Data Processing', () => {
    it('should process and format quote data correctly', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [mockQuotes[0] as unknown as QuoteResponse],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: Date.now(),
        },
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          destToken: {
            address: 'So11111111111111111111111111111111111111112',
            chainId: '0xfa' as Hex,
            decimals: 9,
            symbol: 'SOL',
            name: 'Solana',
          },
          sourceAmount: '1.0',
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.formattedQuoteData).toBeDefined();
      expect(result.current.formattedQuoteData?.estimatedTime).toMatch(/\d+ min/);
      expect(result.current.formattedQuoteData?.rate).toMatch(/1 ETH = .* SOL/);
      expect(result.current.destTokenAmount).toBeDefined();
    });

    it('should handle invalid quote data gracefully', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: mockProviderResponses.invalidQuoteData,
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          destToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            chainId: '0x1' as Hex,
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
          sourceAmount: '1.0',
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.bestQuote).toBeDefined();
      expect(result.current.activeQuote).toBeDefined();
    });
  });

  describe('Quote Parameter Validation', () => {
    it('should validate decimal precision for token amounts', async () => {
      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            chainId: '0x1' as Hex,
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          selectedDestChainId: '0x1' as Hex,
          sourceAmount: '1000.123456',
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteRequest(), {
        state: testState,
      });

      await act(async () => {
        await result.current();
        jest.advanceTimersByTime(700);
      });

      expect(Engine.context.BridgeController.updateBridgeQuoteRequestParams).toHaveBeenCalledWith(
        expect.objectContaining({
          srcTokenAmount: '1000123456',
        }),
        undefined,
      );
    });

    it('should handle edge case amounts like decimal point only', async () => {
      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          destToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            chainId: '0x1' as Hex,
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
          selectedDestChainId: '0x1' as Hex,
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

      expect(Engine.context.BridgeController.updateBridgeQuoteRequestParams).toHaveBeenCalledWith(
        expect.objectContaining({
          srcTokenAmount: '0',
        }),
        undefined,
      );
    });
  });

  describe('Loading States', () => {
    it('should handle loading state during quote fetching', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.LOADING,
          quotesLastFetched: null,
        },
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          destToken: {
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            chainId: '0x1' as Hex,
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
          sourceAmount: '1.0',
        },
      });

      const { result } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.bestQuote).toBeUndefined();
      expect(result.current.activeQuote).toBeUndefined();
    });
  });
});
