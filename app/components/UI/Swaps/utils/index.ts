import { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { swapsUtils } from '@metamask/swaps-controller';
import { strings } from '../../../../../locales/i18n';
import AppConstants from '../../../../core/AppConstants';
import { NETWORKS_CHAIN_ID } from '../../../../constants/network';
///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
import { SolScope } from '@metamask/keyring-api';
///: END:ONLY_INCLUDE_IF(keyring-snaps)

export interface SwapsToken {
  address: string;
  symbol?: string;
  decimals?: number;
  name?: string;
  occurrences?: number;
  aggregators?: string[];
  iconUrl?: string;
  balance?: string;
  balanceFiat?: string;
}

export interface QuotesNavigationParams {
  sourceTokenAddress: string;
  destinationTokenAddress: string;
  sourceAmount: string;
  slippage: number;
  tokens: SwapsToken[];
}

export interface FetchParamsInput {
  slippage?: number;
  sourceToken: SwapsToken;
  destinationToken: SwapsToken;
  sourceAmount: string;
  walletAddress: string;
  networkClientId: string;
  enableGasIncludedQuotes: boolean;
}

export interface MaxBalanceLinkParams {
  sourceToken: SwapsToken | null;
  shouldUseSmartTransaction: boolean;
  hasBalance: boolean;
}

const {
  ETH_CHAIN_ID,
  BSC_CHAIN_ID,
  SWAPS_TESTNET_CHAIN_ID,
  POLYGON_CHAIN_ID,
  AVALANCHE_CHAIN_ID,
  ARBITRUM_CHAIN_ID,
  OPTIMISM_CHAIN_ID,
  ZKSYNC_ERA_CHAIN_ID,
  LINEA_CHAIN_ID,
  BASE_CHAIN_ID,
} = swapsUtils;

const allowedChainIds: string[] = [
  ETH_CHAIN_ID,
  BSC_CHAIN_ID,
  POLYGON_CHAIN_ID,
  AVALANCHE_CHAIN_ID,
  ARBITRUM_CHAIN_ID,
  OPTIMISM_CHAIN_ID,
  ZKSYNC_ERA_CHAIN_ID,
  LINEA_CHAIN_ID,
  BASE_CHAIN_ID,
  SWAPS_TESTNET_CHAIN_ID,
];

export const allowedTestnetChainIds: string[] = [
  NETWORKS_CHAIN_ID.GOERLI,
  NETWORKS_CHAIN_ID.SEPOLIA,
];

if (__DEV__) {
  allowedChainIds.push(...allowedTestnetChainIds);
}

export function isSwapsAllowed(chainId: string): boolean {
  if (!AppConstants.SWAPS.ACTIVE) {
    return false;
  }
  if (!AppConstants.SWAPS.ONLY_MAINNET) {
    allowedChainIds.push(SWAPS_TESTNET_CHAIN_ID);
  }

  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  if (chainId === SolScope.Mainnet) {
    return true;
  }
  ///: END:ONLY_INCLUDE_IF(keyring-snaps)

  return allowedChainIds.includes(chainId);
}

export function isSwapsNativeAsset(token: SwapsToken | null | undefined): boolean {
  return (
    Boolean(token) && token?.address === swapsUtils.NATIVE_SWAPS_TOKEN_ADDRESS
  );
}

export function isDynamicToken(token: SwapsToken | null | undefined): boolean {
  return (
    Boolean(token) &&
    token?.occurrences === 1 &&
    token?.aggregators?.length === 1 &&
    token?.aggregators?.[0] === 'dynamic'
  );
}

export function setQuotesNavigationsParams(
  sourceTokenAddress: string,
  destinationTokenAddress: string,
  sourceAmount: string,
  slippage: number,
  tokens: SwapsToken[] = [],
): QuotesNavigationParams {
  return {
    sourceTokenAddress,
    destinationTokenAddress,
    sourceAmount,
    slippage,
    tokens,
  };
}

export function getQuotesNavigationsParams(route: { params?: Record<string, unknown> }): QuotesNavigationParams {
  const slippage = (route.params?.slippage as number) ?? 1;
  const sourceTokenAddress = (route.params?.sourceTokenAddress as string) ?? '';
  const destinationTokenAddress = (route.params?.destinationTokenAddress as string) ?? '';
  const sourceAmount = route.params?.sourceAmount as string;
  const tokens = route.params?.tokens as SwapsToken[];

  return {
    sourceTokenAddress,
    destinationTokenAddress,
    sourceAmount,
    slippage,
    tokens,
  };
}

export function getFetchParams({
  slippage = 1,
  sourceToken,
  destinationToken,
  sourceAmount,
  walletAddress,
  networkClientId,
  enableGasIncludedQuotes,
}: FetchParamsInput) {
  return {
    slippage,
    sourceToken: sourceToken.address,
    destinationToken: destinationToken.address,
    sourceAmount,
    walletAddress,
    metaData: {
      sourceTokenInfo: sourceToken,
      destinationTokenInfo: destinationToken,
      networkClientId,
    },
    enableGasIncludedQuotes,
  };
}

export function useRatio(
  numeratorAmount: string | number,
  numeratorDecimals: number,
  denominatorAmount: string | number,
  denominatorDecimals: number,
): BigNumber {
  const ratio = useMemo(
    () =>
      new BigNumber(numeratorAmount)
        .dividedBy(denominatorAmount)
        .multipliedBy(
          new BigNumber(10).pow(denominatorDecimals - numeratorDecimals),
        ),
    [
      denominatorAmount,
      denominatorDecimals,
      numeratorAmount,
      numeratorDecimals,
    ],
  );

  return ratio;
}

export function getErrorMessage(errorKey: string): [string, string, string] {
  const { SwapsError } = swapsUtils;
  const errorAction =
    errorKey === SwapsError.QUOTES_EXPIRED_ERROR
      ? strings('swaps.get_new_quotes')
      : strings('swaps.try_again');
  switch (errorKey) {
    case SwapsError.QUOTES_EXPIRED_ERROR: {
      return [
        strings('swaps.quotes_timeout'),
        strings('swaps.request_new_quotes'),
        errorAction,
      ];
    }
    case SwapsError.QUOTES_NOT_AVAILABLE_ERROR: {
      return [
        strings('swaps.quotes_not_available'),
        strings('swaps.try_adjusting'),
        errorAction,
      ];
    }
    default: {
      return [
        strings('swaps.error_fetching_quote'),
        strings('swaps.unexpected_error', {
          error: errorKey || 'error-not-provided',
        }),
        errorAction,
      ];
    }
  }
}

export function getQuotesSourceMessage(type: string): [string, string, string] {
  switch (type) {
    case 'DEX': {
      return [
        strings('swaps.quote_source_dex.1'),
        strings('swaps.quote_source_dex.2'),
        strings('swaps.quote_source_dex.3'),
      ];
    }
    case 'RFQ': {
      return [
        strings('swaps.quote_source_rfq.1'),
        strings('swaps.quote_source_rfq.2'),
        strings('swaps.quote_source_rfq.3'),
      ];
    }
    case 'CONTRACT':
    case 'CNT': {
      return [
        strings('swaps.quote_source_cnt.1'),
        strings('swaps.quote_source_cnt.2'),
        strings('swaps.quote_source_cnt.3'),
      ];
    }
    case 'AGG':
    default: {
      return [
        strings('swaps.quote_source_agg.1'),
        strings('swaps.quote_source_agg.2'),
        strings('swaps.quote_source_agg.3'),
      ];
    }
  }
}

export function shouldShowMaxBalanceLink({
  sourceToken,
  shouldUseSmartTransaction,
  hasBalance,
}: MaxBalanceLinkParams): boolean {
  if (!sourceToken?.symbol || !hasBalance) {
    return false;
  }

  const isNonDefaultFromToken = !isSwapsNativeAsset(sourceToken);
  const isTokenEligibleForMaxBalance =
    shouldUseSmartTransaction ||
    (!shouldUseSmartTransaction && isNonDefaultFromToken);

  return isTokenEligibleForMaxBalance;
}
