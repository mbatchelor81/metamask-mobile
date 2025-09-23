import {
  type BridgeControllerState,
  getDefaultBridgeControllerState,
  type QuoteResponse,
  RequestStatus,
} from '@metamask/bridge-controller';
import { initialState } from '../_mocks_/initialState';
import { mockBridgeReducerState } from '../_mocks_/bridgeReducerState';
import type { BridgeState } from '../../../../core/redux/slices/bridge';
import { Hex } from '@metamask/utils';

type BridgeControllerStateOverride = Partial<BridgeControllerState>;

/**
 * Creates a complete bridge controller state by merging default state with overrides
 * @param overrides - Partial state to override default values
 * @returns Complete bridge controller state
 */
export const createBridgeControllerState = (
  overrides: BridgeControllerStateOverride = {},
): BridgeControllerState => ({
  ...getDefaultBridgeControllerState(),
  ...overrides,
});

/**
 * Creates a complete test state for bridge components/hooks
 * @param overrides - Object containing optional overrides for bridge controller and reducer state
 * @returns Complete test state
 */
export const createBridgeTestState = (
  overrides: {
    bridgeControllerOverrides?: BridgeControllerStateOverride;
    bridgeReducerOverrides?: Partial<BridgeState>;
  } = {},
) => {
  const bridgeControllerState = createBridgeControllerState(
    overrides.bridgeControllerOverrides ?? {},
  );

  return {
    ...initialState,
    engine: {
      ...initialState.engine,
      backgroundState: {
        ...initialState.engine.backgroundState,
        BridgeController: bridgeControllerState,
      },
    },
    bridge: {
      ...mockBridgeReducerState,
      ...(overrides.bridgeReducerOverrides ?? {}),
    },
  };
};

/**
 * Creates mock quote responses for testing external provider scenarios
 */
export const createMockQuoteResponse = (overrides: Partial<QuoteResponse> = {}): QuoteResponse => ({
  quote: {
    destTokenAmount: '1000000',
    bridgePriceData: { priceImpact: -0.002 },
    ...overrides.quote,
  },
  estimatedProcessingTimeInSeconds: 60,
  totalNetworkFee: {
    amount: '0.01',
    valueInCurrency: '10',
  },
  ...overrides,
} as QuoteResponse);

/**
 * Creates mock bridge controller state for error scenarios
 */
export const createMockErrorState = (
  errorMessage: string,
  status: RequestStatus = RequestStatus.LOADING,
): Partial<BridgeControllerState> => ({
  quotes: [],
  quotesLoadingStatus: status,
  quoteFetchError: errorMessage,
  quotesLastFetched: null,
});

/**
 * Creates mock bridge controller state for timeout scenarios
 */
export const createMockTimeoutState = (
  lastFetched: number | null = null,
  refreshCount: number = 0,
): Partial<BridgeControllerState> => ({
  quotesLastFetched: lastFetched,
  quotesRefreshCount: refreshCount,
  quotesLoadingStatus: RequestStatus.FETCHED,
});

/**
 * Creates mock token for testing
 */
export const createMockToken = (
  symbol: string,
  chainId: Hex,
  address: string,
  decimals: number = 18,
) => ({
  address,
  chainId,
  decimals,
  symbol,
  name: symbol,
});
