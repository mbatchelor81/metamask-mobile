import { useMemo } from 'react';
import { CURRENCIES, CurrencyConfig } from './constants';
import createKeypadRule from './createKeypadRule';

interface UseCurrencyResult {
  handler: (currentAmount: string, inputKey: string) => string;
  symbol: string | null;
  decimalSeparator: string | null;
}

function useCurrency(
  currency: string | undefined,
  decimals: number | undefined,
): UseCurrencyResult {
  const currencyData = useMemo((): CurrencyConfig => {
    if (!currency) {
      return CURRENCIES.default;
    }

    const existingCurrency =
      CURRENCIES[currency] || CURRENCIES[currency.toUpperCase()];

    if (existingCurrency) {
      return existingCurrency;
    }

    if (decimals !== undefined && decimals > 0) {
      return {
        decimalSeparator: '.',
        handler: createKeypadRule({ decimalSeparator: '.', decimals }),
        symbol: null,
      };
    }

    return CURRENCIES.default;
  }, [currency, decimals]);

  const handler = currencyData.handler;
  const symbol = currencyData.symbol;
  const decimalSeparator = currencyData.decimalSeparator;

  return { handler, symbol, decimalSeparator };
}

export default useCurrency;
