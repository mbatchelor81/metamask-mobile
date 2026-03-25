import AppConstants from '../../core/AppConstants';
import { toLowerCaseEquals } from '../../util/general';

/**
 * MakerDAO DAI => SAI
 *
 **/
export default function migrate(state: Record<string, unknown>): Record<string, unknown> {
  const tokens = (state as any).engine.backgroundState.TokensController.tokens;
  const migratedTokens: any[] = [];
  tokens.forEach((token: any) => {
    if (
      token.symbol === 'DAI' &&
      toLowerCaseEquals(token.address, AppConstants.SAI_ADDRESS)
    ) {
      token.symbol = 'SAI';
    }
    migratedTokens.push(token);
  });
  (state as any).engine.backgroundState.TokensController.tokens = migratedTokens;

  return state;
}
