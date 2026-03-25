export default function migrate(state: Record<string, unknown>): Record<string, unknown> {
  // This migration ensures that ignored tokens are in the correct form
  const allIgnoredTokens =
    (state as any).engine.backgroundState.TokensController.allIgnoredTokens || {};
  const ignoredTokens =
    (state as any).engine.backgroundState.TokensController.ignoredTokens || [];

  const reduceTokens = (tokens: any[]): string[] =>
    tokens.reduce((final: string[], token: any) => {
      const tokenAddress =
        (typeof token === 'string' && token) || token?.address || '';
      tokenAddress && final.push(tokenAddress);
      return final;
    }, []);

  const newIgnoredTokens = reduceTokens(ignoredTokens);

  const newAllIgnoredTokens: Record<string, Record<string, string[]>> = {};
  Object.entries(allIgnoredTokens).forEach(
    ([chainId, tokensByAccountAddress]: [string, any]) => {
      Object.entries(tokensByAccountAddress).forEach(
        ([accountAddress, tokens]: [string, any]) => {
          const newTokens = reduceTokens(tokens);
          if (newAllIgnoredTokens[chainId] === undefined) {
            newAllIgnoredTokens[chainId] = { [accountAddress]: newTokens };
          } else {
            newAllIgnoredTokens[chainId] = {
              ...newAllIgnoredTokens[chainId],
              [accountAddress]: newTokens,
            };
          }
        },
      );
    },
  );

  (state as any).engine.backgroundState.TokensController = {
    ...(state as any).engine.backgroundState.TokensController,
    allIgnoredTokens: newAllIgnoredTokens,
    ignoredTokens: newIgnoredTokens,
  };

  return state;
}
