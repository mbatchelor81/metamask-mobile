import { GOERLI } from '../../../app/constants/network';

// NetworksChainId was removed from @metamask/controller-utils in a later version
const GOERLI_CHAIN_ID = '5';

export default function migrate(state: Record<string, any>): Record<string, any> {
  const chainId =
    state.engine.backgroundState.NetworkController.providerConfig.chainId;
  // Deprecate rinkeby, ropsten and Kovan, any user that is on those we fallback to goerli
  if (chainId === '4' || chainId === '3' || chainId === '42') {
    state.engine.backgroundState.NetworkController.providerConfig = {
      chainId: GOERLI_CHAIN_ID,
      ticker: 'GoerliETH',
      type: GOERLI,
    };
  }
  return state;
}
