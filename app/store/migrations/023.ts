import { isObject, hasProperty } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { mapValues } from 'lodash';
import ambiguousNetworks from './migration-data/amibiguous-networks.json';

/**
 * Migrate address book state to be keyed by chain ID rather than network ID.
 *
 * When choosing which chain ID to migrate each address book entry to, we
 * consider only networks that the user has configured locally. Any entries
 * for chains not configured locally are discarded.
 *
 * If there are multiple chain ID candidates for a given network ID (even
 * after filtering to include just locally configured networks), address
 * entries are duplicated on all potentially matching chains. These cases are
 * also stored in the `user.ambiguousAddressEntries` state so that we can
 * warn the user in the UI about these addresses.
 *
 * Note: the type is wrong here because it conflicts with `redux-persist`
 * types, due to a bug in that package.
 * See: https://github.com/rt2zz/redux-persist/issues/1065
 * TODO: Use `unknown` as the state type, and silence or work around the
 * redux-persist bug somehow.
 *
 **/
export default function migrate(state: Record<string, any>): Record<string, any> {
  const keyringControllerState = state.engine.backgroundState.KeyringController;
  if (!isObject(keyringControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid vault in KeyringController: '${typeof keyringControllerState}'`,
      ),
    );
  }

  const networkControllerState = state.engine.backgroundState.NetworkController;
  const addressBookControllerState =
    state.engine.backgroundState.AddressBookController;

  if (!isObject(networkControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid network controller state: '${typeof networkControllerState}'`,
      ),
    );
    return state;
  } else if (
    !hasProperty(networkControllerState, 'networkConfigurations') ||
    !isObject(networkControllerState.networkConfigurations)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid network configuration state: '${typeof networkControllerState.networkConfigurations}'`,
      ),
    );
    return state;
  } else if (
    Object.values(networkControllerState.networkConfigurations).some(
      (networkConfiguration) => !hasProperty(networkConfiguration as Record<string, unknown>, 'chainId'),
    )
  ) {
    const found = Object.entries(
      networkControllerState.networkConfigurations,
    ).find(
      ([_networkConfigId, networkConfiguration]) =>
        !hasProperty(networkConfiguration as Record<string, unknown>, 'chainId'),
    );
    const [invalidConfigurationId, invalidConfiguration] = found!;
    captureException(
      new Error(
        `Migration 23: Network configuration missing chain ID, id '${invalidConfigurationId}', keys '${Object.keys(
          invalidConfiguration as Record<string, unknown>,
        )}'`,
      ),
    );
    return state;
  } else if (!isObject(addressBookControllerState)) {
    captureException(
      new Error(
        `Migration 23: Invalid address book controller state: '${typeof addressBookControllerState}'`,
      ),
    );
    return state;
  } else if (
    !hasProperty(addressBookControllerState, 'addressBook') ||
    !isObject(addressBookControllerState.addressBook)
  ) {
    captureException(
      new Error(
        `Migration 23: Invalid address book state: '${typeof addressBookControllerState.addressBook}'`,
      ),
    );
    return state;
  } else if (
    Object.values(addressBookControllerState.addressBook).some(
      (addressEntries) => !isObject(addressEntries),
    )
  ) {
    const found = Object.entries(
      addressBookControllerState.addressBook,
    ).find(([_networkId, addressEntries]) => !isObject(addressEntries));
    const [networkId, invalidEntries] = found!;
    captureException(
      new Error(
        `Migration 23: Address book configuration invalid, network id '${networkId}', type '${typeof invalidEntries}'`,
      ),
    );
    return state;
  } else if (
    Object.values(addressBookControllerState.addressBook).some(
      (addressEntries) =>
        Object.values(addressEntries as Record<string, unknown>).some(
          (addressEntry) => !hasProperty(addressEntry as Record<string, unknown>, 'chainId'),
        ),
    )
  ) {
    const found = Object.entries(
      addressBookControllerState.addressBook,
    ).find(([_networkId, addressEntries]) =>
      Object.values(addressEntries as Record<string, unknown>).some(
        (addressEntry) => !hasProperty(addressEntry as Record<string, unknown>, 'chainId'),
      ),
    );
    const [networkId, invalidEntries] = found!;
    const invalidEntry = Object.values(invalidEntries as Record<string, unknown>).find(
      (addressEntry) => !hasProperty(addressEntry as Record<string, unknown>, 'chainId'),
    );
    captureException(
      new Error(
        `Migration 23: Address book configuration entry missing chain ID, network id '${networkId}', keys '${Object.keys(
          invalidEntry as Record<string, unknown>,
        )}'`,
      ),
    );
    return state;
  } else if (!isObject(state.user)) {
    captureException(
      new Error(`Migration 23: Invalid user state: '${typeof state.user}'`),
    );
    return state;
  }

  const localChainIds = Object.values(
    networkControllerState.networkConfigurations,
  ).reduce((customChainIds: Set<string>, networkConfiguration: unknown) => {
    customChainIds.add((networkConfiguration as Record<string, any>).chainId);
    return customChainIds;
  }, new Set<string>());
  const builtInNetworkChainIdsAsOfMigration22 = [
    '1',
    '5',
    '11155111',
    '59140',
    '59144',
  ];
  for (const builtInChainId of builtInNetworkChainIdsAsOfMigration22) {
    localChainIds.add(builtInChainId);
  }

  const migratedAddressBook: Record<string, any> = {};
  const ambiguousAddressEntries: Record<string, any> = {};
  for (const [networkId, addressEntries] of Object.entries(
    addressBookControllerState.addressBook,
  )) {
    if ((ambiguousNetworks as Record<string, any>)[networkId]) {
      const chainIdCandidates = (ambiguousNetworks as Record<string, any>)[networkId].chainIds;
      const recognizedChainIdCandidates = chainIdCandidates.filter((chainId: string) =>
        localChainIds.has(chainId),
      );

      for (const chainId of recognizedChainIdCandidates) {
        if (recognizedChainIdCandidates.length > 1) {
          ambiguousAddressEntries[chainId] = Object.keys(addressEntries as Record<string, unknown>);
        }
        migratedAddressBook[chainId] = mapValues(addressEntries as Record<string, any>, (entry: any) => ({
          ...entry,
          chainId,
        }));
      }
    } else {
      migratedAddressBook[networkId] = addressEntries;
    }
  }

  addressBookControllerState.addressBook = migratedAddressBook;

  // Store ambiguous entries so that we can warn about them in the UI
  if (Object.keys(ambiguousAddressEntries).length > 1) {
    state.user.ambiguousAddressEntries = ambiguousAddressEntries;
  }

  return state;
}
