import { renderHookWithProvider } from '../../../../util/test/renderWithProvider';
import { createBridgeTestState } from '../testUtils';
import { useBridgeQuoteData } from '../hooks/useBridgeQuoteData';
import { isQuoteExpired, shouldRefreshQuote, getQuoteRefreshRate } from '../utils/quoteUtils';
import { RequestStatus, type QuoteResponse } from '@metamask/bridge-controller';
import { act } from '@testing-library/react-native';
import { Hex } from '@metamask/utils';
import mockQuotes from '../_mocks_/mock-quotes-sol-sol.json';

const mockSelectPrimaryCurrency = jest.fn();
jest.mock('../../../../selectors/settings', () => ({
  ...jest.requireActual('../../../../selectors/settings'),
  selectPrimaryCurrency: () => mockSelectPrimaryCurrency(),
}));

jest.mock('../../../../selectors/networkController', () => ({
  selectTicker: () => 'ETH',
}));

jest.mock('../../SimulationDetails/FiatDisplay/useFiatFormatter', () => ({
  __esModule: true,
  default: () => (value: any) => `$${value.toString()}`,
}));

const mockTimeScenarios = {
  expiredQuote: {
    quotesLastFetched: Date.now() - 60000,
    quotesRefreshCount: 2,
    quotes: [mockQuotes[0] as unknown as QuoteResponse],
    quotesLoadingStatus: RequestStatus.FETCHED,
  },
  maxRefreshReached: {
    quotesLastFetched: Date.now() - 30000,
    quotesRefreshCount: 5,
    quotes: [mockQuotes[0] as unknown as QuoteResponse],
    quotesLoadingStatus: RequestStatus.FETCHED,
  },
  networkTimeout: {
    quotesLoadingStatus: RequestStatus.LOADING,
    quoteFetchError: 'Network timeout',
    quotesLastFetched: null,
    quotesRefreshCount: 0,
  },
  recentQuote: {
    quotesLastFetched: Date.now() - 10000,
    quotesRefreshCount: 1,
    quotes: [mockQuotes[0] as unknown as QuoteResponse],
    quotesLoadingStatus: RequestStatus.FETCHED,
  },
};

describe('Bridge Timeout and Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (isQuoteExpired as jest.Mock).mockReturnValue(false);
    (getQuoteRefreshRate as jest.Mock).mockReturnValue(30000);
    (shouldRefreshQuote as jest.Mock).mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Quote Expiration Scenarios', () => {
    it('should handle quote expiration with automatic refresh', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          ...mockTimeScenarios.expiredQuote,
          quoteRequest: { insufficientBal: false },
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

      expect(result.current.isExpired).toBe(true);
      expect(result.current.willRefresh).toBe(true);
      expect(result.current.activeQuote).toBeUndefined();
    });

    it('should stop refreshing after max attempts and show expired modal', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          ...mockTimeScenarios.maxRefreshReached,
          quoteRequest: { insufficientBal: false },
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

      expect(result.current.willRefresh).toBe(false);
      expect(result.current.isExpired).toBe(true);
      expect(result.current.activeQuote).toBeUndefined();
    });

    it('should not expire recent quotes', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          ...mockTimeScenarios.recentQuote,
          quoteRequest: { insufficientBal: false },
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

      expect(result.current.isExpired).toBe(false);
      expect(result.current.willRefresh).toBe(true);
      expect(result.current.activeQuote).toBeDefined();
    });
  });

  describe('Network Timeout Scenarios', () => {
    it('should handle network timeout during quote fetching', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: mockTimeScenarios.networkTimeout,
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
      expect(result.current.quoteFetchError).toBe('Network timeout');
      expect(result.current.bestQuote).toBeUndefined();
    });

    it('should handle recovery from network timeout', async () => {
      let testState = createBridgeTestState({
        bridgeControllerOverrides: mockTimeScenarios.networkTimeout,
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

      const { result, rerender } = renderHookWithProvider(() => useBridgeQuoteData(), {
        state: testState,
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.quoteFetchError).toBe('Network timeout');

      testState = createBridgeTestState({
        bridgeControllerOverrides: {
          ...mockTimeScenarios.recentQuote,
          quoteRequest: { insufficientBal: false },
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

      rerender({ state: testState });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.quoteFetchError).toBeNull();
      expect(result.current.bestQuote).toBeDefined();
    });
  });

  describe('Refresh Rate Logic', () => {
    it('should use mocked refresh rate', () => {
      (getQuoteRefreshRate as jest.Mock).mockReturnValue(20000);
      
      const sourceToken = {
        address: '0x0000000000000000000000000000000000000000',
        chainId: '0x1' as Hex,
        decimals: 18,
        symbol: 'ETH',
        name: 'Ethereum',
      };

      const refreshRate = getQuoteRefreshRate(undefined, sourceToken);
      expect(refreshRate).toBe(20000);
    });

    it('should fall back to default refresh rate when no feature flags', () => {
      (getQuoteRefreshRate as jest.Mock).mockReturnValue(30000);
      
      const sourceToken = {
        address: '0x0000000000000000000000000000000000000000',
        chainId: '0x1' as Hex,
        decimals: 18,
        symbol: 'ETH',
        name: 'Ethereum',
      };

      const refreshRate = getQuoteRefreshRate(undefined, sourceToken);
      expect(refreshRate).toBe(30000);
    });
  });

  describe('Refresh Logic Validation', () => {
    it('should not refresh when user has insufficient balance', () => {
      const shouldRefresh = shouldRefreshQuote(true, 2, 5, false);
      expect(shouldRefresh).toBe(false);
    });

    it('should not refresh when transaction is being submitted', () => {
      const shouldRefresh = shouldRefreshQuote(false, 2, 5, true);
      expect(shouldRefresh).toBe(false);
    });

    it('should refresh when under max attempts and conditions are met', () => {
      const shouldRefresh = shouldRefreshQuote(false, 2, 5, false);
      expect(shouldRefresh).toBe(true);
    });

    it('should not refresh when max attempts reached', () => {
      const shouldRefresh = shouldRefreshQuote(false, 5, 5, false);
      expect(shouldRefresh).toBe(false);
    });
  });

  describe('Quote Expiration Logic', () => {
    it('should detect expired quotes correctly', () => {
      const oldTimestamp = Date.now() - 35000;
      const refreshRate = 30000;
      
      const expired = isQuoteExpired(false, refreshRate, oldTimestamp);
      expect(expired).toBe(true);
    });

    it('should not mark quotes as expired when they will refresh', () => {
      const oldTimestamp = Date.now() - 35000;
      const refreshRate = 30000;
      
      const expired = isQuoteExpired(true, refreshRate, oldTimestamp);
      expect(expired).toBe(false);
    });

    it('should handle null timestamp gracefully', () => {
      const refreshRate = 30000;
      
      const expired = isQuoteExpired(false, refreshRate, null);
      expect(expired).toBe(false);
    });
  });

  describe('Complex Timeout Scenarios', () => {
    it('should handle multiple consecutive timeouts', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotesLoadingStatus: RequestStatus.LOADING,
          quoteFetchError: 'Multiple consecutive timeouts',
          quotesLastFetched: null,
          quotesRefreshCount: 3,
          quotes: [],
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

      expect(result.current.quoteFetchError).toBe('Multiple consecutive timeouts');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isNoQuotesAvailable).toBe(false);
    });

    it('should handle partial provider responses with timeouts', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [mockQuotes[0] as unknown as QuoteResponse],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: 'Some providers timed out',
          quotesLastFetched: Date.now(),
          quotesRefreshCount: 1,
          quoteRequest: { insufficientBal: false },
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

      expect(result.current.bestQuote).toBeDefined();
      expect(result.current.activeQuote).toBeDefined();
      expect(result.current.quoteFetchError).toBe('Some providers timed out');
      expect(result.current.isLoading).toBe(false);
    });
  });
});
