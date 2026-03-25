import { equal } from 'uri-js';
import { InteractionManager } from 'react-native';
import { ChainId } from '@metamask/controller-utils';
import Engine from '../Engine';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import { MetaMetricsEvents, MetaMetrics } from '../../core/Analytics';
import { MetricsEventBuilder } from '../../core/Analytics/MetricsEventBuilder';
import {
  selectEvmChainId,
  selectEvmNetworkConfigurationsByChainId,
} from '../../selectors/networkController';
import { store } from '../../store';
import checkSafeNetwork from './networkChecker.util';
import {
  validateAddEthereumChainParams,
  validateRpcEndpoint,
  switchToNetwork,
} from './lib/ethereum-chain-utils';
import { getDecimalChainId } from '../../util/networks';
import { RpcEndpointType } from '@metamask/network-controller';
import { MESSAGE_TYPE } from '../createTracingMiddleware';
import type { JsonRpcParams } from '@metamask/utils';

interface AddEthereumChainRequest {
  params: unknown[] | null;
  origin?: string;
  method?: string;
}

interface AddEthereumChainResponse {
  result: null | unknown;
}

interface AddEthereumChainOptions {
  req: AddEthereumChainRequest;
  res: AddEthereumChainResponse;
  requestUserApproval: (opts: { type: string; requestData: Record<string, unknown> }) => Promise<void>;
  analytics: Record<string, unknown>;
  hooks: Record<string, (...args: unknown[]) => unknown>;
}

const waitForInteraction = async (): Promise<void> =>
  new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      resolve();
    });
  });

// Utility function to find or add an item in an array and return the updated array and index
const addOrUpdateIndex = <T>(array: T[], value: T, comparator: (item: T) => boolean): { updatedArray: T[]; index: number } => {
  const index = array.findIndex(comparator);
  if (index === -1) {
    return {
      updatedArray: [...array, value],
      index: array.length,
    };
  }
  return { updatedArray: array, index };
};

/**
 * Add chain implementation to be used in JsonRpcEngine middleware.
 *
 * @param params.req - The JsonRpcEngine request.
 * @param params.res - The JsonRpcEngine result object.
 * @param params.requestUserApproval - The callback to trigger user approval flow.
 * @param params.analytics - Analytics parameters to be passed when tracking event via `MetaMetrics`.
 * @param params.hooks - Method hooks passed to the method implementation.
 * @returns {Nothing}.
 */
export const wallet_addEthereumChain = async ({
  req,
  res,
  requestUserApproval,
  analytics,
  hooks,
}: AddEthereumChainOptions): Promise<void> => {
  const {
    NetworkController,
    MultichainNetworkController,
    ApprovalController,
    PermissionController,
    SelectedNetworkController,
  } = Engine.context;

  const { origin } = req;
  const params = validateAddEthereumChainParams(req.params as unknown[]);

  const {
    chainId,
    chainName,
    firstValidRPCUrl,
    firstValidBlockExplorerUrl,
    ticker,
  } = params;

  const switchToNetworkAndMetrics = async (network: Record<string, unknown>, isAddNetworkFlow: boolean): Promise<void> => {
    const rpcEndpoints = network.rpcEndpoints as { networkClientId: string }[];
    const defaultRpcEndpointIndex = network.defaultRpcEndpointIndex as number;
    const { networkClientId } = rpcEndpoints[defaultRpcEndpointIndex];

    const existingNetwork = hooks.getNetworkConfigurationByChainId(chainId) as Record<string, unknown> | undefined;
    const existingRpcEndpoints = existingNetwork?.rpcEndpoints as { url: string }[] | undefined;
    const rpcIndex = existingRpcEndpoints?.findIndex(({ url }: { url: string }) =>
      equal(url, firstValidRPCUrl),
    );

    const existingBlockExplorerUrls = existingNetwork?.blockExplorerUrls as string[] | undefined;
    const blockExplorerIndex = firstValidBlockExplorerUrl
      ? existingBlockExplorerUrls?.findIndex((url: string) =>
          equal(url, firstValidBlockExplorerUrl),
        )
      : undefined;

    const shouldAddOrUpdateNetwork =
      !existingNetwork ||
      rpcIndex !== (existingNetwork.defaultRpcEndpointIndex as number) ||
      (firstValidBlockExplorerUrl &&
        blockExplorerIndex !== (existingNetwork.defaultBlockExplorerUrlIndex as number));

    await switchToNetwork({
      network: [networkClientId, network] as [string, Record<string, unknown>],
      chainId,
      controllers: {
        MultichainNetworkController,
        PermissionController,
        SelectedNetworkController,
      },
      requestUserApproval,
      analytics,
      origin: origin ?? '',
      isAddNetworkFlow,
      autoApprove: shouldAddOrUpdateNetwork ? true : false,
      hooks,
    });
  };

  //TODO: Remove aurora from default chains in @metamask/controller-utils
  const actualChains: Record<string, string | undefined> = { ...ChainId, aurora: undefined };
  if (Object.values(actualChains).find((value) => value === chainId)) {
    throw rpcErrors.invalidParams(`May not specify default MetaMask chain.`);
  }
  const networkConfigurations = selectEvmNetworkConfigurationsByChainId(
    store.getState(),
  );

  const existingNetworkConfiguration = Object.values(
    networkConfigurations,
  ).find((networkConfiguration) => networkConfiguration.chainId === chainId);

  const existingNetworkConfigurationHasRpcEndpoint =
    existingNetworkConfiguration?.rpcEndpoints.some(
      (endpoint) => endpoint.url === firstValidRPCUrl,
    );

  // If the network already exists and the RPC URL is the same, perform a network switch only
  if (
    existingNetworkConfiguration &&
    existingNetworkConfigurationHasRpcEndpoint
  ) {
    const existingRpcEndpoints = (existingNetworkConfiguration as Record<string, unknown>).rpcEndpoints as { url: string }[];
    const rpcResult = addOrUpdateIndex(
      existingRpcEndpoints,
      {
        url: firstValidRPCUrl,
        type: RpcEndpointType.Custom,
        name: chainName,
      } as unknown as { url: string },
      (endpoint: { url: string }) => endpoint.url === firstValidRPCUrl,
    );

    switchToNetworkAndMetrics(
      {
        ...(existingNetworkConfiguration as Record<string, unknown>),
        rpcEndpoints: rpcResult.updatedArray,
        defaultRpcEndpointIndex: rpcResult.index,
      },
      false,
    );

    res.result = null;
    return;
  }

  await validateRpcEndpoint(firstValidRPCUrl, chainId);
  const requestData: Record<string, unknown> = {
    chainId,
    blockExplorerUrl: firstValidBlockExplorerUrl,
    chainName,
    rpcUrl: firstValidRPCUrl,
    ticker,
    isNetworkRpcUpdate: !!existingNetworkConfiguration,
  };

  const alerts = await checkSafeNetwork(
    getDecimalChainId(chainId),
    firstValidRPCUrl,
    chainName,
    ticker,
  );
  requestData.alerts = alerts;

  MetaMetrics.getInstance().trackEvent(
    MetricsEventBuilder.createEventBuilder(MetaMetricsEvents.NETWORK_REQUESTED)
      .addProperties({
        chain_id: getDecimalChainId(chainId),
        source: 'Custom Network API',
        symbol: ticker,
        ...analytics,
      })
      .build(),
  );

  // Remove all existing approvals, including other add network requests.
  ApprovalController.clear(providerErrors.userRejectedRequest());

  // If existing approval request was an add network request, wait for
  // it to be rejected and for the corresponding approval flow to be ended.
  await waitForInteraction();

  try {
    await requestUserApproval({
      type: 'ADD_ETHEREUM_CHAIN',
      requestData,
    });
  } catch (error) {
    MetaMetrics.getInstance().trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.NETWORK_REQUEST_REJECTED,
      )
        .addProperties({
          chain_id: getDecimalChainId(chainId),
          source: 'Custom Network API',
          symbol: ticker,
          ...analytics,
        })
        .build(),
    );
    throw providerErrors.userRejectedRequest();
  }

  let newNetworkConfiguration: Record<string, unknown>;
  if (existingNetworkConfiguration) {
    const currentChainId = selectEvmChainId(store.getState());

    const existingRpcEndpoints = (existingNetworkConfiguration as Record<string, unknown>).rpcEndpoints as { url: string }[];
    const rpcResult = addOrUpdateIndex(
      existingRpcEndpoints,
      {
        url: firstValidRPCUrl,
        type: RpcEndpointType.Custom,
        name: chainName,
      } as unknown as { url: string },
      (endpoint: { url: string }) => endpoint.url === firstValidRPCUrl,
    );

    const existingBlockExplorerUrls = (existingNetworkConfiguration as Record<string, unknown>).blockExplorerUrls as string[];
    const blockExplorerResult = addOrUpdateIndex(
      existingBlockExplorerUrls,
      firstValidBlockExplorerUrl as string,
      (url: string) => url === firstValidBlockExplorerUrl,
    );

    const updatedNetworkConfiguration = {
      ...(existingNetworkConfiguration as Record<string, unknown>),
      rpcEndpoints: rpcResult.updatedArray,
      defaultRpcEndpointIndex: rpcResult.index,
      blockExplorerUrls: blockExplorerResult.updatedArray,
      defaultBlockExplorerUrlIndex: blockExplorerResult.index,
    };

    newNetworkConfiguration = await NetworkController.updateNetwork(
      chainId as `0x${string}`,
      updatedNetworkConfiguration as Parameters<typeof NetworkController.updateNetwork>[1],
      currentChainId === chainId
        ? {
            replacementSelectedRpcEndpointIndex:
              updatedNetworkConfiguration.defaultRpcEndpointIndex,
          }
        : undefined,
    ) as unknown as Record<string, unknown>;
  } else {
    newNetworkConfiguration = NetworkController.addNetwork({
      chainId: chainId as `0x${string}`,
      blockExplorerUrls: [firstValidBlockExplorerUrl ?? ''],
      defaultRpcEndpointIndex: 0,
      defaultBlockExplorerUrlIndex: 0,
      name: chainName,
      nativeCurrency: ticker,
      rpcEndpoints: [
        {
          url: firstValidRPCUrl,
          name: chainName,
          type: RpcEndpointType.Custom,
        },
      ],
    }) as unknown as Record<string, unknown>;

    MetaMetrics.getInstance().trackEvent(
      MetricsEventBuilder.createEventBuilder(MetaMetricsEvents.NETWORK_ADDED)
        .addProperties({
          chain_id: getDecimalChainId(chainId),
          source: 'Custom Network API',
          symbol: ticker,
          ...analytics,
        })
        .build(),
    );
  }
  switchToNetworkAndMetrics(newNetworkConfiguration, true);

  res.result = null;
};

export const addEthereumChainHandler = {
  methodNames: [MESSAGE_TYPE.ADD_ETHEREUM_CHAIN],
  implementation: wallet_addEthereumChain,
  hookNames: {
    addNetwork: true,
    updateNetwork: true,
    getNetworkConfigurationByChainId: true,
    setActiveNetwork: true,
    requestUserApproval: true,
    getCurrentChainIdForDomain: true,
    getCaveat: true,
    requestPermittedChainsPermissionIncrementalForOrigin: true,
    rejectApprovalRequestsForOrigin: true,
  },
};
