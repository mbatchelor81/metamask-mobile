interface SetSearchEngineAction {
  type: 'SET_SEARCH_ENGINE';
  searchEngine: string;
}

interface SetShowHexDataAction {
  type: 'SET_SHOW_HEX_DATA';
  showHexData: boolean;
}

interface SetShowCustomNonceAction {
  type: 'SET_SHOW_CUSTOM_NONCE';
  showCustomNonce: boolean;
}

interface SetShowFiatOnTestnetsAction {
  type: 'SET_SHOW_FIAT_ON_TESTNETS';
  showFiatOnTestnets: boolean;
}

interface SetHideZeroBalanceTokensAction {
  type: 'SET_HIDE_ZERO_BALANCE_TOKENS';
  hideZeroBalanceTokens: boolean;
}

interface SetLockTimeAction {
  type: 'SET_LOCK_TIME';
  lockTime: number;
}

interface SetPrimaryCurrencyAction {
  type: 'SET_PRIMARY_CURRENCY';
  primaryCurrency: string;
}

interface SetUseBlockieIconAction {
  type: 'SET_USE_BLOCKIE_ICON';
  useBlockieIcon: boolean;
}

interface ToggleBasicFunctionalityAction {
  type: 'TOGGLE_BASIC_FUNCTIONALITY';
  basicFunctionalityEnabled: boolean;
}

interface ToggleDeviceNotificationAction {
  type: 'TOGGLE_DEVICE_NOTIFICATIONS';
  deviceNotificationEnabled: boolean;
}

interface TokenSortConfig {
  key: string;
  order: string;
}

interface SetTokenSortConfigAction {
  type: 'SET_TOKEN_SORT_CONFIG';
  tokenSortConfig: TokenSortConfig;
}

export function setSearchEngine(searchEngine: string): SetSearchEngineAction {
  return {
    type: 'SET_SEARCH_ENGINE',
    searchEngine,
  };
}

export function setShowHexData(showHexData: boolean): SetShowHexDataAction {
  return {
    type: 'SET_SHOW_HEX_DATA',
    showHexData,
  };
}

export function setShowCustomNonce(showCustomNonce: boolean): SetShowCustomNonceAction {
  return {
    type: 'SET_SHOW_CUSTOM_NONCE',
    showCustomNonce,
  };
}

export function setShowFiatOnTestnets(showFiatOnTestnets: boolean): SetShowFiatOnTestnetsAction {
  return {
    type: 'SET_SHOW_FIAT_ON_TESTNETS',
    showFiatOnTestnets,
  };
}

export function setHideZeroBalanceTokens(hideZeroBalanceTokens: boolean): SetHideZeroBalanceTokensAction {
  return {
    type: 'SET_HIDE_ZERO_BALANCE_TOKENS',
    hideZeroBalanceTokens,
  };
}

export function setLockTime(lockTime: number): SetLockTimeAction {
  return {
    type: 'SET_LOCK_TIME',
    lockTime,
  };
}

export function setPrimaryCurrency(primaryCurrency: string): SetPrimaryCurrencyAction {
  return {
    type: 'SET_PRIMARY_CURRENCY',
    primaryCurrency,
  };
}

export function setUseBlockieIcon(useBlockieIcon: boolean): SetUseBlockieIconAction {
  return {
    type: 'SET_USE_BLOCKIE_ICON',
    useBlockieIcon,
  };
}

export function toggleBasicFunctionality(basicFunctionalityEnabled: boolean): ToggleBasicFunctionalityAction {
  return {
    type: 'TOGGLE_BASIC_FUNCTIONALITY',
    basicFunctionalityEnabled,
  };
}

export function toggleDeviceNotification(deviceNotificationEnabled: boolean): ToggleDeviceNotificationAction {
  return {
    type: 'TOGGLE_DEVICE_NOTIFICATIONS',
    deviceNotificationEnabled,
  };
}

export function setTokenSortConfig(tokenSortConfig: TokenSortConfig): SetTokenSortConfigAction {
  return {
    type: 'SET_TOKEN_SORT_CONFIG',
    tokenSortConfig,
  };
}
