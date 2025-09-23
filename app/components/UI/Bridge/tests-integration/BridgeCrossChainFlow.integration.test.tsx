import { renderScreen } from '../../../../util/test/renderWithProvider';
import { fireEvent, waitFor } from '@testing-library/react-native';
import Routes from '../../../../constants/navigation/Routes';
import BridgeView from '../Views/BridgeView';
import { createBridgeTestState } from '../testUtils';
import { RequestStatus, type QuoteResponse } from '@metamask/bridge-controller';
import mockQuotes from '../_mocks_/mock-quotes-sol-sol.json';
import Engine from '../../../../core/Engine';
import { SolScope } from '@metamask/keyring-api';
import { Hex } from '@metamask/utils';

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

const mockSuccessfulQuoteResponse = {
  quotes: [mockQuotes[0] as unknown as QuoteResponse],
  quotesLoadingStatus: RequestStatus.FETCHED,
  quotesLastFetched: Date.now(),
  quoteFetchError: null,
};

const mockCrossChainProviderError = {
  quotes: [],
  quotesLoadingStatus: RequestStatus.LOADING,
  quoteFetchError: 'Bridge provider unavailable',
  quotesLastFetched: null,
};

describe('Bridge Cross-Chain Transaction Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('EVM to EVM Cross-Chain Flow', () => {
    it('should complete full quote fetching flow for Ethereum to Polygon bridge', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          ...mockSuccessfulQuoteResponse,
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
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x89' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          selectedDestChainId: '0x89' as Hex,
          sourceAmount: '1.0',
        },
      });

      const { getByText, getByTestId } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      expect(getByText('ETH')).toBeTruthy();
      expect(getByTestId('source-token-area-input').props.value).toBe('1.0');
      expect(getByText('Continue')).toBeTruthy();

      const continueButton = getByText('Continue');
      fireEvent.press(continueButton);

      await waitFor(() => {
        expect(Engine.context.BridgeController.updateBridgeQuoteRequestParams).toHaveBeenCalledWith(
          expect.objectContaining({
            srcChainId: 1,
            destChainId: 137,
            srcTokenAmount: '1000000000000000000',
          }),
          undefined,
        );
      });
    });

    it('should handle cross-chain quote fetching errors gracefully', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: mockCrossChainProviderError,
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
          selectedDestChainId: '0xa4b1' as Hex,
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
  });

  describe('EVM to Solana Cross-Chain Flow', () => {
    it('should handle EVM to Solana bridge transaction flow', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          ...mockSuccessfulQuoteResponse,
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
            address: 'So11111111111111111111111111111111111111112',
            chainId: SolScope.Mainnet,
            decimals: 9,
            symbol: 'SOL',
            name: 'Solana',
          },
          selectedDestChainId: SolScope.Mainnet,
          sourceAmount: '0.1',
          destAddress: 'FakeS0LanaAddr3ss111111111111111111111111111',
        },
      });

      const { getByText, getByTestId } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      expect(getByText('ETH')).toBeTruthy();
      expect(getByTestId('source-token-area-input').props.value).toBe('0.1');

      await waitFor(() => {
        expect(getByText('Continue')).toBeTruthy();
      });
    });

    it('should validate destination address for Solana transactions', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          ...mockSuccessfulQuoteResponse,
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
            address: 'So11111111111111111111111111111111111111112',
            chainId: SolScope.Mainnet,
            decimals: 9,
            symbol: 'SOL',
            name: 'Solana',
          },
          selectedDestChainId: SolScope.Mainnet,
          sourceAmount: '0.1',
          destAddress: undefined,
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

  describe('Solana to EVM Cross-Chain Flow', () => {
    it('should handle Solana to EVM bridge transaction flow', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          ...mockSuccessfulQuoteResponse,
          quoteRequest: { insufficientBal: false },
        },
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
            chainId: '0x1' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          selectedDestChainId: '0x1' as Hex,
          sourceAmount: '1.0',
        },
      });

      const { getByText, getByTestId } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      expect(getByText('SOL')).toBeTruthy();
      expect(getByTestId('source-token-area-input').props.value).toBe('1.0');

      await waitFor(() => {
        expect(getByText('Continue')).toBeTruthy();
      });
    });
  });

  describe('Token Switching Flow', () => {
    it('should handle token switching in cross-chain scenarios', async () => {
      const initialStateWithTokens = createBridgeTestState({
        bridgeControllerOverrides: mockSuccessfulQuoteResponse,
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
          selectedDestChainId: '0x89' as Hex,
          sourceAmount: '1.0',
        },
      });

      const { getByTestId } = renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: initialStateWithTokens },
      );

      const arrowButton = getByTestId('arrow-button');
      fireEvent.press(arrowButton);

      await waitFor(() => {
        expect(Engine.context.BridgeController.updateBridgeQuoteRequestParams).toHaveBeenCalled();
      });
    });
  });

  describe('Quote Refresh Flow', () => {
    it('should handle automatic quote refresh during cross-chain flow', async () => {
      const testState = createBridgeTestState({
        bridgeControllerOverrides: {
          quotes: [mockQuotes[0] as unknown as QuoteResponse],
          quotesLoadingStatus: RequestStatus.FETCHED,
          quotesLastFetched: Date.now() - 35000,
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
            address: '0x0000000000000000000000000000000000000000',
            chainId: '0x89' as Hex,
            decimals: 18,
            symbol: 'ETH',
            name: 'Ethereum',
          },
          selectedDestChainId: '0x89' as Hex,
          sourceAmount: '1.0',
        },
      });

      renderScreen(
        BridgeView,
        { name: Routes.BRIDGE.ROOT },
        { state: testState },
      );

      await waitFor(() => {
        expect(Engine.context.BridgeController.updateBridgeQuoteRequestParams).toHaveBeenCalled();
      });
    });
  });
});
