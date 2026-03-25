import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CHAIN_ID_NETWORK_URL = 'https://chainid.network/chains.json';

interface SafeChain {
  chainId: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpc: string[];
  [key: string]: unknown;
}

export interface MatchedChainNetwork {
  safeChainsList: SafeChain[];
}

const withIsOriginalNativeToken = <P extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<P & { matchedChainNetwork: MatchedChainNetwork | null }>,
): React.FC<Omit<P, 'matchedChainNetwork'>> => {
  // This is the functional component wrapper that can use hooks
  const WithIsOriginalNativeTokenWrapper = (props: Omit<P, 'matchedChainNetwork'>): React.ReactElement => {
    // Use the useSelector hook to access Redux state
    const [matchedChainNetwork, setMatchedChainNetwork] = useState<MatchedChainNetwork | null>(null);

    useEffect(() => {
      axios.get(CHAIN_ID_NETWORK_URL).then(({ data: safeChainsList }: { data: SafeChain[] }) => {
        setMatchedChainNetwork({
          safeChainsList: [...safeChainsList],
        });
      });
    }, []);

    // Pass the value from useSelector as a prop to the WrappedComponent
    return (
      <WrappedComponent {...(props as P)} matchedChainNetwork={matchedChainNetwork} />
    );
  };

  return WithIsOriginalNativeTokenWrapper;
};

export default withIsOriginalNativeToken;
