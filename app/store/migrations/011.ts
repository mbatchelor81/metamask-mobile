export default function migrate(state: Record<string, unknown>): Record<string, unknown> {
  (state as any).engine.backgroundState.PreferencesController = {
    ...(state as any).engine.backgroundState.PreferencesController,
    useTokenDetection: true,
  };
  return state;
}
