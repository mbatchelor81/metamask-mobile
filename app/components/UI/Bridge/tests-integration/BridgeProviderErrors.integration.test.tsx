import { renderScreen } from '../../../../util/test/renderWithProvider';
import { createBridgeTestState } from '../testUtils';
import BridgeView from '../Views/BridgeView';
import { RequestStatus } from '@metamask/bridge-controller';
import Engine from '../../../../core/Engine';
import { Hex } from '@metamask/utils';
import { fireEvent, waitFor } from '@testing-library/react-native';
import Routes from '../../../../constants/navigation/Routes';

jest.mock('../../../../core/Engine', () => ({
  context: {
    BridgeController: {
      updateBridgeQuoteRequestParams: jest.fn(),
      resetState: jest.fn(),
      setBridgeFeatureFlags: jest.fn().mockResolvedValue(undefined),
    },
    BridgeStatusController: {
      submitTx: jest.fn().mockResolvedValue({ success: true }),
    },
    SwapsController: {
      fetchAggregatorMetadataWithCache: jest.fn(),
      fetchTopAssetsWithCache: jest.fn(),
      fetchTokenWithCache: jest.fn(),
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
    GasFeeController: {
      startPolling: jest.fn(),
      stopPollingByPollingToken: jest.fn(),
    },
    NetworkController: {
      getNetworkConfigurationByNetworkClientId: jest.fn(),
    },
  },
  getTotalEvmFiatAccountBalance: jest.fn().mockReturnValue({
    balance: '1000000000000000000',
    fiatBalance: '2000',
  }),
}));

jest.mock('../../../../hooks/useAccounts', () => ({
  useAccounts: () => ({
    accounts: [
      {
        address: '0x1234567890123456789012345678901234567890',
        name: 'Account 1',
        type: 'HD Key Tree',
        yOffset: 0,
        isSelected: true,
      },
    ],
  }),
}));

jest.mock('../hooks/useLatestBalance', () => ({
  useLatestBalance: jest.fn().mockImplementation(({ address, chainId }) => {
    if (!address || !chainId) return undefined;
    const actualEthers = jest.requireActual('ethers');
    return {
      displayBalance: '2.0',
      atomicBalance: actualEthers.BigNumber.from('2000000000000000000'),
    };
  }),
}));

jest.mock('../../../../../component-library/components/Skeleton', () => ({
  Skeleton: () => null,
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
      setOptions: jest.fn(),
    }),
  };
});

const mockProviderErrors = {
  rateLimited: {
    quoteFetchError: 'Rate limit exceeded. Please try again later.',
    quotesLoadingStatus: RequestStatus.LOADING,
    quotes: [],
    quotesLastFetched: null,
  },
  serviceUnavailable: {
    quoteFetchError: 'Bridge service temporarily unavailable',
    quotesLoadingStatus: RequestStatus.LOADING,
    quotes: [],
    quotesLastFetched: null,
  },
  invalidTokenPair: {
    quoteFetchError: 'Token pair not supported by bridge providers',
    quotesLoadingStatus: RequestStatus.LOADING,
    quotes: [],
    quotesLastFetched: null,
  },
  networkError: {
    quoteFetchError: 'Network error: Unable to connect to bridge API',
    quotesLoadingStatus: RequestStatus.LOADING,
    quotes: [],
    quotesLastFetched: null,
  },
  providerMaintenance: {
    quoteFetchError: 'Bridge providers are under maintenance',
    quotesLoadingStatus: RequestStatus.LOADING,
    quotes: [],
    quotesLastFetched: null,
  },
  insufficientLiquidity: {
    quoteFetchError: 'Insufficient liquidity for this token pair',
    quotesLoadingStatus: RequestStatus.LOADING,
    quotes: [],
    quotesLastFetched: null,
  },
};

describe('Bridge External Provider Error Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Provider Error Handling', () => {
    it('should display appropriate error message for rate limiting', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: mockProviderErrors.rateLimited,
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

      const { queryByText } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      expect(queryByText('Continue')).toBeFalsy();
    });

    it('should handle network connectivity issues gracefully', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: mockProviderErrors.networkError,
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

      const { queryByText } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      expect(queryByText('Continue')).toBeFalsy();
    });

    it('should handle service unavailable errors', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: mockProviderErrors.serviceUnavailable,
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x1' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0xa4b1' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          sourceAmount: '0.5',
        },
      });

      const { queryByText } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      expect(queryByText('Continue')).toBeFalsy();
    });

    it('should handle unsupported token pair errors', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: mockProviderErrors.invalidTokenPair,
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x1234567890123456789012345678901234567890',
            chainId: '0x1' as Hex,
            decimals: 18,
            symbol: 'UNKNOWN',
            name: 'Unknown Token',
          },
          destToken: {
            address: '0x0987654321098765432109876543210987654321',
            chainId: '0x89' as Hex,
            decimals: 18,
            symbol: 'UNKNOWN2',
            name: 'Unknown Token 2',
          },
          sourceAmount: '1.0',
        },
      });

      const { queryByText } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      expect(queryByText('Continue')).toBeFalsy();
    });
  });

  describe('Provider Maintenance Scenarios', () => {
    it('should handle provider maintenance gracefully', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: mockProviderErrors.providerMaintenance,
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

      const { queryByText } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      expect(queryByText('Continue')).toBeFalsy();
    });

    it('should handle insufficient liquidity errors', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: mockProviderErrors.insufficientLiquidity,
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
          sourceAmount: '1000.0',
        },
      });

      const { queryByText } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      expect(queryByText('Continue')).toBeFalsy();
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should allow retry after provider error', async () => {
      Engine.context.BridgeController.updateBridgeQuoteRequestParams = jest
        .fn()
        .mockRejectedValueOnce(new Error('Provider error'))
        .mockResolvedValueOnce(undefined);

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.LOADING,
          quoteFetchError: 'Provider error',
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

      const { getByTestId } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      const input = getByTestId('source-token-area-input');
      fireEvent.changeText(input, '1.5');

      await waitFor(() => {
        expect(Engine.context.BridgeController.updateBridgeQuoteRequestParams).toHaveBeenCalled();
      });
    });

    it('should handle intermittent provider failures', async () => {
      let callCount = 0;
      Engine.context.BridgeController.updateBridgeQuoteRequestParams = jest
        .fn()
        .mockImplementation(() => {
          callCount++;
          if (callCount <= 2) {
            return Promise.reject(new Error('Intermittent failure'));
          }
          return Promise.resolve();
        });

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
          sourceAmount: '1.0',
        },
      });

      const { getByTestId } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      const input = getByTestId('source-token-area-input');
      
      fireEvent.changeText(input, '1.1');
      fireEvent.changeText(input, '1.2');
      fireEvent.changeText(input, '1.3');

      await waitFor(() => {
        expect(Engine.context.BridgeController.updateBridgeQuoteRequestParams).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Complex Error Scenarios', () => {
    it('should handle mixed provider responses with some errors', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.LOADING,
          quoteFetchError: 'Some providers failed: LiFi (timeout), Socket (rate limited)',
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
            chainId: '0x89' as Hex,
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
          sourceAmount: '1.0',
        },
      });

      const { queryByText } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      expect(queryByText('Continue')).toBeFalsy();
    });

    it('should handle cascading provider failures', async () => {
      Engine.context.BridgeController.updateBridgeQuoteRequestParams = jest
        .fn()
        .mockRejectedValue(new Error('All providers failed'));

      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.LOADING,
          quoteFetchError: 'All bridge providers are currently unavailable',
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
            chainId: '0xa4b1' as Hex,
            decimals: 6,
            symbol: 'USDC',
            name: 'USD Coin',
          },
          sourceAmount: '1.0',
        },
      });

      const { queryByText } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      expect(queryByText('Continue')).toBeFalsy();
    });
  });

  describe('Provider-Specific Error Handling', () => {
    it('should handle LiFi provider specific errors', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.LOADING,
          quoteFetchError: 'LiFi: Route not found for this token pair',
          quotesLastFetched: null,
        },
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x1234567890123456789012345678901234567890',
            chainId: '0x1' as Hex,
            decimals: 18,
            symbol: 'RARE',
            name: 'Rare Token',
          },
          destToken: {
            address: '0x0987654321098765432109876543210987654321',
            chainId: '0x89' as Hex,
            decimals: 18,
            symbol: 'RARE2',
            name: 'Rare Token 2',
          },
          sourceAmount: '1.0',
        },
      });

      const { queryByText } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      expect(queryByText('Continue')).toBeFalsy();
    });

    it('should handle Socket provider specific errors', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [],
          quotesLoadingStatus: RequestStatus.LOADING,
          quoteFetchError: 'Socket: Bridge not supported for this route',
          quotesLastFetched: null,
        },
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x38' as Hex,
            decimals: 18,
            symbol: 'BNB',
            name: 'Binance Coin',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x2105' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          sourceAmount: '1.0',
        },
      });

      const { queryByText } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      expect(queryByText('Continue')).toBeFalsy();
    });
  });
});
