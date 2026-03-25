export default function migrate(state: Record<string, unknown>): Record<string, unknown> {
  (state as any).engine.backgroundState.TokensController = {
    allTokens: (state as any).engine.backgroundState.AssetsController.allTokens,
    ignoredTokens: (state as any).engine.backgroundState.AssetsController.ignoredTokens,
  };

  (state as any).engine.backgroundState.CollectiblesController = {
    allCollectibles:
      (state as any).engine.backgroundState.AssetsController.allCollectibles,
    allCollectibleContracts:
      (state as any).engine.backgroundState.AssetsController.allCollectibleContracts,
    ignoredCollectibles:
      (state as any).engine.backgroundState.AssetsController.ignoredCollectibles,
  };

  delete (state as any).engine.backgroundState.AssetsController;

  return state;
}
