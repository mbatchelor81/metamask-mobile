import { v1 as random } from 'uuid';

export default function migrate(state: Record<string, unknown>): Record<string, unknown> {
  // If for some reason we already have PermissionController state, bail out.
  const hasPermissionControllerState: boolean = Boolean(
    (state as any).engine.backgroundState.PermissionController?.subjects,
  );
  if (hasPermissionControllerState) return state;

  const { approvedHosts } = (state as any).privacy;
  const { selectedAddress } =
    (state as any).engine.backgroundState.PreferencesController;

  const hosts: string[] = Object.keys(approvedHosts);
  // If no dapps connected, bail out.
  if (hosts.length < 1) return state;

  const { subjects } = hosts.reduce<Record<string, any>>(
    (accumulator, host, index) => ({
      subjects: {
        ...accumulator.subjects,
        [host]: {
          origin: host,
          permissions: {
            eth_accounts: {
              id: random(),
              parentCapability: 'eth_accounts',
              invoker: host,
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: [
                    {
                      address: selectedAddress,
                      lastUsed: Date.now() - index,
                    },
                  ],
                },
              ],
              date: Date.now(),
            },
          },
        },
      },
    }),
    {} as Record<string, any>,
  );

  const newState: Record<string, unknown> = { ...state };

  (newState as any).engine.backgroundState.PermissionController = {
    subjects,
  };
  return newState;
}
