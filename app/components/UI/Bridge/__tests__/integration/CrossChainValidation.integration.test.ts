import { renderHookWithProvider } from '../../../../../util/test/renderWithProvider';
import { createBridgeTestState } from '../../testUtils';
import { 
  selectIsEvmToSolana, 
  selectIsSolanaToEvm, 
  selectIsEvmSolanaBridge,
  selectIsSolanaSwap,
} from '../../../../../core/redux/slices/bridge';
import { useSelector } from 'react-redux';
import { setupIntegrationTests } from './setup';
import { isSolanaChainId } from '@metamask/bridge-controller';

jest.mock('@metamask/bridge-controller', () => ({
  ...jest.requireActual('@metamask/bridge-controller'),
  isSolanaChainId: jest.fn(),
}));

const mockIsSolanaChainId = isSolanaChainId as jest.MockedFunction<typeof isSolanaChainId>;

describe('Cross-Chain Validation Integration Tests', () => {
  setupIntegrationTests();

  beforeEach(() => {
    mockIsSolanaChainId.mockReset();
  });

  describe('EVM to Solana Bridge Validation', () => {
    it('should correctly identify EVM to Solana bridge transactions', () => {
      const solanaDestChainId = '0xfa';
      const evmSourceChainId = '0x1';

      // Mock isSolanaChainId to return true for Solana chain and false for EVM
      mockIsSolanaChainId.mockImplementation((chainId: string | number) => {
        return chainId === solanaDestChainId;
      });

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: evmSourceChainId,
            name: 'Ethereum',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'SOL',
            decimals: 9,
            chainId: solanaDestChainId,
            name: 'Solana',
          },
          selectedDestChainId: solanaDestChainId,
        },
      });

      const TestComponent = () => {
        const isEvmToSolana = useSelector(selectIsEvmToSolana);
        const isEvmSolanaBridge = useSelector(selectIsEvmSolanaBridge);
        const isSolanaSwap = useSelector(selectIsSolanaSwap);
        
        return {
          isEvmToSolana,
          isEvmSolanaBridge,
          isSolanaSwap,
        };
      };

      const { result } = renderHookWithProvider(TestComponent, {
        state: testState,
      });

      expect(result.current.isEvmToSolana).toBe(true);
      expect(result.current.isEvmSolanaBridge).toBe(true);
      expect(result.current.isSolanaSwap).toBe(false);
    });

    it('should validate destination addresses for Solana chains', () => {
      const solanaDestChainId = '0xfa';
      const evmSourceChainId = '0x1';
      const validSolanaAddress = 'FakeS0LanaAddr3ss111111111111111111111111111';

      // Mock isSolanaChainId to return true for Solana chain
      mockIsSolanaChainId.mockImplementation((chainId: string | number) => {
        return chainId === solanaDestChainId;
      });

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: evmSourceChainId,
            name: 'Ethereum',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'SOL',
            decimals: 9,
            chainId: solanaDestChainId,
            name: 'Solana',
          },
          destAddress: validSolanaAddress,
          selectedDestChainId: solanaDestChainId,
        },
      });

      const TestComponent = () => {
        const isEvmToSolana = useSelector(selectIsEvmToSolana);
        return { isEvmToSolana };
      };

      const { result } = renderHookWithProvider(TestComponent, {
        state: testState,
      });

      expect(result.current.isEvmToSolana).toBe(true);
    });

    it('should handle invalid destination addresses gracefully', () => {
      const solanaDestChainId = '0xfa';
      const evmSourceChainId = '0x1';
      const invalidAddress = 'invalid-address';

      // Mock isSolanaChainId to return true for Solana chain
      mockIsSolanaChainId.mockImplementation((chainId: string | number) => {
        return chainId === solanaDestChainId;
      });

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: evmSourceChainId,
            name: 'Ethereum',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'SOL',
            decimals: 9,
            chainId: solanaDestChainId,
            name: 'Solana',
          },
          destAddress: invalidAddress,
          selectedDestChainId: solanaDestChainId,
        },
      });

      const TestComponent = () => {
        const isEvmToSolana = useSelector(selectIsEvmToSolana);
        return { isEvmToSolana };
      };

      const { result } = renderHookWithProvider(TestComponent, {
        state: testState,
      });

      expect(result.current.isEvmToSolana).toBe(true);
    });
  });

  describe('Solana to EVM Bridge Validation', () => {
    it('should correctly identify Solana to EVM bridge transactions', () => {
      const evmDestChainId = '0x1';
      const solanaSourceChainId = '0xfa';

      // Mock isSolanaChainId to return true for Solana source chain
      mockIsSolanaChainId.mockImplementation((chainId: string | number) => {
        return chainId === solanaSourceChainId;
      });

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'SOL',
            decimals: 9,
            chainId: solanaSourceChainId,
            name: 'Solana',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: evmDestChainId,
            name: 'Ethereum',
          },
          selectedDestChainId: evmDestChainId,
        },
      });

      const TestComponent = () => {
        const isSolanaToEvm = useSelector(selectIsSolanaToEvm);
        const isEvmSolanaBridge = useSelector(selectIsEvmSolanaBridge);
        const isSolanaSwap = useSelector(selectIsSolanaSwap);
        
        return {
          isSolanaToEvm,
          isEvmSolanaBridge,
          isSolanaSwap,
        };
      };

      const { result } = renderHookWithProvider(TestComponent, {
        state: testState,
      });

      expect(result.current.isSolanaToEvm).toBe(true);
      expect(result.current.isEvmSolanaBridge).toBe(true);
      expect(result.current.isSolanaSwap).toBe(false);
    });

    it('should validate EVM destination addresses', () => {
      const evmDestChainId = '0x1';
      const solanaSourceChainId = '0xfa';
      const validEvmAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';

      // Mock isSolanaChainId to return true for Solana source chain
      mockIsSolanaChainId.mockImplementation((chainId: string | number) => {
        return chainId === solanaSourceChainId;
      });

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'SOL',
            decimals: 9,
            chainId: solanaSourceChainId,
            name: 'Solana',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: evmDestChainId,
            name: 'Ethereum',
          },
          destAddress: validEvmAddress,
          selectedDestChainId: evmDestChainId,
        },
      });

      const TestComponent = () => {
        const isSolanaToEvm = useSelector(selectIsSolanaToEvm);
        return { isSolanaToEvm };
      };

      const { result } = renderHookWithProvider(TestComponent, {
        state: testState,
      });

      expect(result.current.isSolanaToEvm).toBe(true);
    });
  });

  describe('Solana Swap Validation', () => {
    it('should correctly identify Solana to Solana swaps', () => {
      const solanaChainId = '0xfa';

      // Mock isSolanaChainId to return true for Solana chain
      mockIsSolanaChainId.mockImplementation((chainId: string | number) => {
        return chainId === solanaChainId;
      });

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: 'So11111111111111111111111111111111111111112',
            symbol: 'SOL',
            decimals: 9,
            chainId: solanaChainId,
            name: 'Solana',
          },
          destToken: {
            address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            symbol: 'USDC',
            decimals: 6,
            chainId: solanaChainId,
            name: 'USD Coin',
          },
          selectedDestChainId: solanaChainId,
        },
      });

      const TestComponent = () => {
        const isSolanaSwap = useSelector(selectIsSolanaSwap);
        const isEvmSolanaBridge = useSelector(selectIsEvmSolanaBridge);
        const isEvmToSolana = useSelector(selectIsEvmToSolana);
        const isSolanaToEvm = useSelector(selectIsSolanaToEvm);
        
        return {
          isSolanaSwap,
          isEvmSolanaBridge,
          isEvmToSolana,
          isSolanaToEvm,
        };
      };

      const { result } = renderHookWithProvider(TestComponent, {
        state: testState,
      });

      expect(result.current.isSolanaSwap).toBe(true);
      expect(result.current.isEvmSolanaBridge).toBe(false);
      expect(result.current.isEvmToSolana).toBe(false);
      expect(result.current.isSolanaToEvm).toBe(false);
    });
  });

  describe('EVM to EVM Bridge Validation', () => {
    it('should correctly identify EVM to EVM bridge transactions', () => {
      const ethereumChainId = '0x1';
      const polygonChainId = '0x89';

      mockIsSolanaChainId.mockImplementation(() => false);

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: ethereumChainId,
            name: 'Ethereum',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'MATIC',
            decimals: 18,
            chainId: polygonChainId,
            name: 'Polygon',
          },
          selectedDestChainId: polygonChainId,
        },
      });

      const TestComponent = () => {
        const isEvmSolanaBridge = useSelector(selectIsEvmSolanaBridge);
        const isSolanaSwap = useSelector(selectIsSolanaSwap);
        const isEvmToSolana = useSelector(selectIsEvmToSolana);
        const isSolanaToEvm = useSelector(selectIsSolanaToEvm);
        
        return {
          isEvmSolanaBridge,
          isSolanaSwap,
          isEvmToSolana,
          isSolanaToEvm,
        };
      };

      const { result } = renderHookWithProvider(TestComponent, {
        state: testState,
      });

      expect(result.current.isEvmSolanaBridge).toBe(false);
      expect(result.current.isSolanaSwap).toBe(false);
      expect(result.current.isEvmToSolana).toBe(false);
      expect(result.current.isSolanaToEvm).toBe(false);
    });
  });

  describe('Chain ID Validation', () => {
    it('should handle missing chain IDs gracefully', () => {
      mockIsSolanaChainId.mockImplementation((chainId: string | number) => {
        return chainId === '0xfa';
      });

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            chainId: undefined as any,
            name: 'Ethereum',
          },
          destToken: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'SOL',
            decimals: 9,
            chainId: '0xfa',
            name: 'Solana',
          },
          selectedDestChainId: '0xfa',
        },
      });

      const TestComponent = () => {
        const isEvmToSolana = useSelector(selectIsEvmToSolana);
        const isSolanaToEvm = useSelector(selectIsSolanaToEvm);
        
        return {
          isEvmToSolana,
          isSolanaToEvm,
        };
      };

      const { result } = renderHookWithProvider(TestComponent, {
        state: testState,
      });

      expect(result.current.isEvmToSolana).toBe(undefined);
      expect(result.current.isSolanaToEvm).toBe(undefined);
    });

    it('should handle null tokens gracefully', () => {
      mockIsSolanaChainId.mockImplementation(() => false);

      const testState = createBridgeTestState({
        bridgeReducerOverrides: {
          sourceToken: undefined,
          destToken: undefined,
          selectedDestChainId: '0xfa',
        },
      });

      const TestComponent = () => {
        const isEvmToSolana = useSelector(selectIsEvmToSolana);
        const isSolanaToEvm = useSelector(selectIsSolanaToEvm);
        const isEvmSolanaBridge = useSelector(selectIsEvmSolanaBridge);
        const isSolanaSwap = useSelector(selectIsSolanaSwap);
        
        return {
          isEvmToSolana,
          isSolanaToEvm,
          isEvmSolanaBridge,
          isSolanaSwap,
        };
      };

      const { result } = renderHookWithProvider(TestComponent, {
        state: testState,
      });

      expect(result.current.isEvmToSolana).toBe(undefined);
      expect(result.current.isSolanaToEvm).toBe(undefined);
      expect(result.current.isEvmSolanaBridge).toBe(undefined);
      expect(result.current.isSolanaSwap).toBe(undefined);
    });
  });
});
