import { RequestStatus } from '@metamask/bridge-controller';
import { createBridgeTestState } from '../../testUtils';
import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import { useBridgeQuoteData } from '../../hooks/useBridgeQuoteData';
import mockQuotes from '../../_mocks_/mock-quotes-sol-sol.json';

jest.mock('@metamask/bridge-controller', () => ({
  ...jest.requireActual('@metamask/bridge-controller'),
}));

jest.mock('../../hooks/useUnifiedSwapBridgeContext', () => ({
  useUnifiedSwapBridgeContext: jest.fn(),
}));

jest.mock('../../utils/quoteUtils', () => ({
  isQuoteExpired: jest.fn(),
  getQuoteRefreshRate: jest.fn(),
  shouldRefreshQuote: jest.fn(),
}));

describe('External Bridge Providers Integration Tests', () => {

  describe('Provider Response Handling', () => {
    it('should handle successful quote responses from multiple providers', async () => {
      const multipleQuotes = [
        mockQuotes[0],
        {
          ...mockQuotes[0],
          quote: {
            ...mockQuotes[0].quote,
            destTokenAmount: '1100000000000000000',
          },
        },
      ];

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: multipleQuotes as any,
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.bestQuote).toBeDefined();
      expect(result.current.activeQuote).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.quoteFetchError).toBeNull();
    });

    it('should handle partial provider failures gracefully', async () => {
      const partialError = 'Provider A failed, but Provider B succeeded';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: mockQuotes as any,
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: partialError,
          quotesLastFetched: Date.now(),
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.bestQuote).toBeDefined();
      expect(result.current.activeQuote).toBeDefined();
      expect(result.current.quoteFetchError).toBe(partialError);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle complete provider outages', async () => {
      const outageError = 'All bridge providers are currently unavailable';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.ERROR,
          quoteFetchError: outageError,
          quotesLastFetched: null,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.bestQuote).toBeNull();
      expect(result.current.activeQuote).toBeNull();
      expect(result.current.quoteFetchError).toBe(outageError);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isNoQuotesAvailable).toBe(false);
    });

    it('should handle empty quote responses', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.bestQuote).toBeNull();
      expect(result.current.activeQuote).toBeNull();
      expect(result.current.isNoQuotesAvailable).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Provider Rate Limiting', () => {
    it('should handle rate limiting from bridge providers', async () => {
      const rateLimitError = 'Rate limit exceeded. Please try again later.';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.ERROR,
          quoteFetchError: rateLimitError,
          quotesLastFetched: Date.now() - 1000,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.quoteFetchError).toBe(rateLimitError);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeQuote).toBeNull();
    });

    it('should handle provider timeout errors', async () => {
      const timeoutError = 'Request timeout after 30 seconds';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.ERROR,
          quoteFetchError: timeoutError,
          quotesLastFetched: Date.now() - 30000,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.quoteFetchError).toBe(timeoutError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Provider Data Validation', () => {
    it('should handle malformed quote data from providers', async () => {
      const malformedQuote = {
        ...mockQuotes[0],
        quote: {
          ...mockQuotes[0].quote,
          destTokenAmount: null,
        },
      };

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [malformedQuote] as any,
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.destTokenAmount).toBeDefined();
    });

    it('should handle missing quote metadata', async () => {
      const incompleteQuote = {
        quote: mockQuotes[0].quote,
      };

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [incompleteQuote] as any,
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.bestQuote).toBeDefined();
      expect(result.current.formattedQuoteData?.networkFee).toBe('-');
    });

    it('should handle invalid network fee data', async () => {
      const invalidFeeQuote = {
        ...mockQuotes[0],
        totalNetworkFee: {
          amount: 'invalid',
          valueInCurrency: 'invalid',
        },
      };

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [invalidFeeQuote] as any,
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: null,
          quotesLastFetched: Date.now(),
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.formattedQuoteData?.networkFee).toBe('-');
    });
  });

  describe('Provider Communication Errors', () => {
    it('should handle network connectivity issues', async () => {
      const networkError = 'Network Error: Unable to connect to bridge provider';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.ERROR,
          quoteFetchError: networkError,
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
    });

    it('should handle SSL/TLS certificate errors', async () => {
      const sslError = 'SSL Error: Certificate verification failed';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.ERROR,
          quoteFetchError: sslError,
          quotesLastFetched: null,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.quoteFetchError).toBe(sslError);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle DNS resolution failures', async () => {
      const dnsError = 'DNS Error: Unable to resolve bridge provider hostname';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.ERROR,
          quoteFetchError: dnsError,
          quotesLastFetched: null,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.quoteFetchError).toBe(dnsError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Provider API Versioning', () => {
    it('should handle API version mismatch errors', async () => {
      const versionError = 'API Version Error: Unsupported API version';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.ERROR,
          quoteFetchError: versionError,
          quotesLastFetched: null,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.quoteFetchError).toBe(versionError);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle deprecated API endpoint errors', async () => {
      const deprecationError = 'API Deprecated: This endpoint is no longer supported';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.ERROR,
          quoteFetchError: deprecationError,
          quotesLastFetched: null,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.quoteFetchError).toBe(deprecationError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Provider Authentication Errors', () => {
    it('should handle API key authentication failures', async () => {
      const authError = 'Authentication Error: Invalid API key';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.ERROR,
          quoteFetchError: authError,
          quotesLastFetched: null,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.quoteFetchError).toBe(authError);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle expired authentication tokens', async () => {
      const tokenError = 'Token Error: Authentication token has expired';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.ERROR,
          quoteFetchError: tokenError,
          quotesLastFetched: null,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.quoteFetchError).toBe(tokenError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Provider Service Degradation', () => {
    it('should handle provider service degradation gracefully', async () => {
      const degradationError = 'Service Degraded: Reduced functionality available';
      const limitedQuotes = mockQuotes;

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: limitedQuotes as any,
          quotesLoadingStatus: RequestStatus.FETCHED,
          quoteFetchError: degradationError,
          quotesLastFetched: Date.now(),
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.bestQuote).toBeDefined();
      expect(result.current.quoteFetchError).toBe(degradationError);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle provider maintenance mode', async () => {
      const maintenanceError = 'Service Unavailable: Provider is under maintenance';
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.ERROR,
          quoteFetchError: maintenanceError,
          quotesLastFetched: null,
        },
      });

      const { result } = renderHookWithProvider(
        () => useBridgeQuoteData(),
        { state: testState }
      );

      expect(result.current.quoteFetchError).toBe(maintenanceError);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeQuote).toBeNull();
    });
  });
});
