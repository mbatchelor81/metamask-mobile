import { wallet_switchEthereumChain } from './wallet_switchEthereumChain';
import Engine from '../Engine';
import { mockNetworkState } from '../../util/test/network';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';

const existingNetworkConfiguration = {
  id: 'test-network-configuration-id',
  chainId: '0x64' as const,
  rpcUrl: 'https://rpc.test-chain.com',
  ticker: 'ETH',
  nickname: 'Gnosis Chain',
  rpcPrefs: {
    blockExplorerUrl: 'https://explorer.test-chain.com',
  },
};

jest.mock('../Engine', () => ({
  context: {
    NetworkController: {
      setActiveNetwork: jest.fn(),
      getNetworkClientById: jest.fn(),
    },
    MultichainNetworkController: {
      setActiveNetwork: jest.fn(),
    },
    CurrencyRateController: {
      updateExchangeRate: jest.fn(),
    },
    PermissionController: {
      hasPermission: jest.fn().mockReturnValue(true),
      grantPermissionsIncremental: jest.fn(),
      getCaveat: jest.fn(),
    },
    SelectedNetworkController: {
      setNetworkClientIdForDomain: jest.fn(),
      getNetworkClientIdForDomain: jest.fn(),
    },
    KeyringController: {
      isUnlocked: jest.fn(),
    },
  },
}));

jest.mock('../../store', () => ({
  store: {
    getState: jest.fn(() => ({
      engine: {
        backgroundState: {
          NetworkController: {
            ...mockNetworkState(
              {
                chainId: '0x1',
                id: 'Mainnet',
                nickname: 'Mainnet',
                ticker: 'ETH',
              },
              {
                ...existingNetworkConfiguration,
              },
            ),
          },
        },
      },
    })),
  },
}));

const correctParams = {
  chainId: '0x1',
};

const otherOptions: Record<string, unknown> = {
  res: {},
  switchCustomNetworkRequest: {},
  requestUserApproval: jest.fn(),
  analytics: {},
  hooks: {
    getCurrentChainIdForDomain: jest.fn(),
    getNetworkConfigurationByChainId: jest.fn(),
    getCaveat: jest.fn(),
    requestPermittedChainsPermissionIncrementalForOrigin: jest.fn(),
    hasApprovalRequestsForOrigin: jest.fn(),
  },
};

describe('RPC Method - wallet_switchEthereumChain', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should report missing params', async () => {
    try {
      await wallet_switchEthereumChain({
        req: {
          params: null,
          origin: '',
        },
        ...otherOptions,
      } as unknown as Parameters<typeof wallet_switchEthereumChain>[0]);
    } catch (error) {
      expect((error as Error).message).toContain('Expected single, object parameter.');
    }
  });

  it('should report extra keys', async () => {
    try {
      await wallet_switchEthereumChain({
        req: {
          params: [{ ...correctParams, extraKey: 10 }],
          origin: '',
        },
        ...otherOptions,
      } as unknown as Parameters<typeof wallet_switchEthereumChain>[0]);
    } catch (error) {
      expect((error as Error).message).toContain(
        'Received unexpected keys on object parameter. Unsupported keys',
      );
    }
  });

  it('should report invalid chainId', async () => {
    try {
      await wallet_switchEthereumChain({
        req: {
          params: [{ ...correctParams, chainId: '10' }],
          origin: '',
        },
        ...otherOptions,
      } as unknown as Parameters<typeof wallet_switchEthereumChain>[0]);
    } catch (error) {
      expect((error as Error).message).toContain(
        `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'.`,
      );
    }
  });

  it('should report unsafe chainId', async () => {
    try {
      await wallet_switchEthereumChain({
        req: {
          params: [{ ...correctParams, chainId: '0xFFFFFFFFFFFED' }],
          origin: '',
        },
        ...otherOptions,
      } as unknown as Parameters<typeof wallet_switchEthereumChain>[0]);
    } catch (error) {
      expect((error as Error).message).toContain(
        'numerical value greater than max safe value.',
      );
    }
  });

  it('should should show a modal for user approval and not grant permissions', async () => {
    (otherOptions.hooks as Record<string, jest.Mock>).hasApprovalRequestsForOrigin.mockReturnValue(true);
    const spyOnGrantPermissionsIncremental = jest.spyOn(
      Engine.context.PermissionController,
      'grantPermissionsIncremental',
    );
    jest
      .spyOn(
        Engine.context.SelectedNetworkController,
        'getNetworkClientIdForDomain',
      )
      .mockReturnValue('mainnet');
    jest
      .spyOn(Engine.context.NetworkController, 'getNetworkClientById')
      .mockReturnValue({ configuration: { chainId: '0x1' } } as never);
    const spyOnSetActiveNetwork = jest.spyOn(
      Engine.context.MultichainNetworkController,
      'setActiveNetwork',
    );
    await wallet_switchEthereumChain({
      req: {
        params: [{ chainId: '0x64' }],
        origin: '',
      },
      ...otherOptions,
    } as unknown as Parameters<typeof wallet_switchEthereumChain>[0]);
    expect(otherOptions.requestUserApproval).toHaveBeenCalled();
    expect(spyOnGrantPermissionsIncremental).not.toHaveBeenCalled();
    expect(spyOnSetActiveNetwork).toHaveBeenCalledWith(
      'test-network-configuration-id',
    );
  });

  describe('MM_CHAIN_PERMISSIONS is enabled', () => {
    beforeAll(() => {
      process.env.MM_CHAIN_PERMISSIONS = 'true';
    });
    afterAll(() => {
      process.env.MM_CHAIN_PERMISSIONS = 'false';
    });
    it('should not change network permissions and should switch without user approval when chain is already permitted', async () => {
      const spyOnGrantPermissionsIncremental = jest.spyOn(
        Engine.context.PermissionController,
        'grantPermissionsIncremental',
      );
      jest
        .spyOn(
          Engine.context.SelectedNetworkController,
          'getNetworkClientIdForDomain',
        )
        .mockReturnValue('mainnet');
      jest
        .spyOn(Engine.context.NetworkController, 'getNetworkClientById')
        .mockReturnValue({ configuration: { chainId: '0x1' } } as never);
      (otherOptions.hooks as Record<string, jest.Mock>).getCaveat.mockReturnValue({
        type: Caip25CaveatType,
        value: {
          requiredScopes: {},
          optionalScopes: {
            'eip155:100': {
              accounts: [],
            },
          },
          isMultichainOrigin: false,
          sessionProperties: {},
        },
      });
      (otherOptions.hooks as Record<string, jest.Mock>).hasApprovalRequestsForOrigin.mockReturnValue(false);
      const spyOnSetActiveNetwork = jest.spyOn(
        Engine.context.MultichainNetworkController,
        'setActiveNetwork',
      );
      await wallet_switchEthereumChain({
        req: {
          params: [{ chainId: '0x64' }],
          origin: '',
        },
        ...otherOptions,
      } as unknown as Parameters<typeof wallet_switchEthereumChain>[0]);

      expect(otherOptions.requestUserApproval).not.toHaveBeenCalled();
      expect(spyOnGrantPermissionsIncremental).not.toHaveBeenCalled();
      expect(spyOnSetActiveNetwork).toHaveBeenCalledWith(
        'test-network-configuration-id',
      );
    });

    it('should add network permission and should switch with user approval when requested chain is not permitted', async () => {
      const origin = 'https://test.com';
      const spyOnGrantPermissionsIncremental = jest.spyOn(
        Engine.context.PermissionController,
        'grantPermissionsIncremental',
      );
      jest
        .spyOn(
          Engine.context.SelectedNetworkController,
          'getNetworkClientIdForDomain',
        )
        .mockReturnValue('mainnet');
      jest
        .spyOn(Engine.context.NetworkController, 'getNetworkClientById')
        .mockReturnValue({ configuration: { chainId: '0x1' } } as never);
      const spyOnSetActiveNetwork = jest.spyOn(
        Engine.context.MultichainNetworkController,
        'setActiveNetwork',
      );
      (otherOptions.hooks as Record<string, jest.Mock>).hasApprovalRequestsForOrigin.mockReturnValue(true);
      (otherOptions.hooks as Record<string, jest.Mock>).getCaveat.mockReturnValue({
        type: Caip25CaveatType,
        value: {
          requiredScopes: {},
          optionalScopes: {},
          isMultichainOrigin: false,
          sessionProperties: {},
        },
      });
      await wallet_switchEthereumChain({
        req: {
          params: [{ chainId: '0x64' }],
          origin,
        },
        ...otherOptions,
      } as unknown as Parameters<typeof wallet_switchEthereumChain>[0]);
      expect(otherOptions.requestUserApproval).toHaveBeenCalled();
      expect(spyOnGrantPermissionsIncremental).toHaveBeenCalledTimes(1);
      expect(spyOnGrantPermissionsIncremental).toHaveBeenCalledWith({
        approvedPermissions: {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  isMultichainOrigin: false,
                  optionalScopes: {
                    'eip155:100': {
                      accounts: [],
                    },
                  },
                  requiredScopes: {},
                  sessionProperties: {},
                },
              },
            ],
          },
        },
        subject: {
          origin,
        },
      });
      expect(spyOnSetActiveNetwork).toHaveBeenCalledWith(
        'test-network-configuration-id',
      );
    });
  });
});
