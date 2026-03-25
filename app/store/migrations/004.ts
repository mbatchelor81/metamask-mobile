import { NetworksChainId } from '@metamask/controller-utils';

export default function migrate(state: Record<string, unknown>): Record<string, unknown> {
  const { allTokens } = (state as any).engine.backgroundState.TokensController;
  const { allCollectibleContracts, allCollectibles } =
    (state as any).engine.backgroundState.CollectiblesController;
  const { frequentRpcList } =
    (state as any).engine.backgroundState.PreferencesController;

  const newAllCollectibleContracts: Record<string, Record<string, unknown>> = {};
  const newAllCollectibles: Record<string, Record<string, unknown>> = {};
  const newAllTokens: Record<string, Record<string, unknown>> = {};

  Object.keys(allTokens).forEach((address: string) => {
    newAllTokens[address] = {};
    Object.keys(allTokens[address]).forEach((networkType: string) => {
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        newAllTokens[address][(NetworksChainId as Record<string, string>)[networkType]] =
          allTokens[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }: { chainId: string }) => {
          newAllTokens[address][chainId] = allTokens[address][networkType];
        });
      }
    });
  });

  Object.keys(allCollectibles).forEach((address: string) => {
    newAllCollectibles[address] = {};
    Object.keys(allCollectibles[address]).forEach((networkType: string) => {
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        newAllCollectibles[address][(NetworksChainId as Record<string, string>)[networkType]] =
          allCollectibles[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }: { chainId: string }) => {
          newAllCollectibles[address][chainId] =
            allCollectibles[address][networkType];
        });
      }
    });
  });

  Object.keys(allCollectibleContracts).forEach((address: string) => {
    newAllCollectibleContracts[address] = {};
    Object.keys(allCollectibleContracts[address]).forEach((networkType: string) => {
      if ((NetworksChainId as Record<string, string>)[networkType]) {
        newAllCollectibleContracts[address][(NetworksChainId as Record<string, string>)[networkType]] =
          allCollectibleContracts[address][networkType];
      } else {
        frequentRpcList.forEach(({ chainId }: { chainId: string }) => {
          newAllCollectibleContracts[address][chainId] =
            allCollectibleContracts[address][networkType];
        });
      }
    });
  });

  (state as any).engine.backgroundState.TokensController = {
    ...(state as any).engine.backgroundState.TokensController,
    allTokens: newAllTokens,
  };
  (state as any).engine.backgroundState.CollectiblesController = {
    ...(state as any).engine.backgroundState.CollectiblesController,
    allCollectibles: newAllCollectibles,
    allCollectibleContracts: newAllCollectibleContracts,
  };
  return state;
}
