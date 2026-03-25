export default function migrate(state: Record<string, unknown>): Record<string, unknown> {
  const {
    allCollectibles,
    allCollectibleContracts,
    ignoredCollectibles,
    ...unexpectedCollectiblesControllerState
  } = (state as any).engine.backgroundState.CollectiblesController;
  (state as any).engine.backgroundState.NftController = {
    ...unexpectedCollectiblesControllerState,
    allNfts: allCollectibles,
    allNftContracts: allCollectibleContracts,
    ignoredNfts: ignoredCollectibles,
  };
  delete (state as any).engine.backgroundState.CollectiblesController;

  (state as any).engine.backgroundState.NftDetectionController =
    (state as any).engine.backgroundState.CollectibleDetectionController;
  delete (state as any).engine.backgroundState.CollectibleDetectionController;

  (state as any).engine.backgroundState.PreferencesController.useNftDetection =
    (state as any).engine.backgroundState.PreferencesController.useCollectibleDetection;
  delete (state as any).engine.backgroundState.PreferencesController
    .useCollectibleDetection;

  return state;
}
