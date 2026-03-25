import isUrl from 'is-url';
import React, { PureComponent } from 'react';
import { StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';
import { strings } from '../../../../locales/i18n';
import Text, {
  TextVariant,
} from '../../../component-library/components/Texts/Text';
import SDKConnect from '../../../core/SDKConnect/SDKConnect';
import { selectAccounts } from '../../../selectors/accountTrackerController';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../selectors/currencyRateController';
import { selectEvmTicker } from '../../../selectors/networkController';
import { fontStyles } from '../../../styles/common';
import {
  getLabelTextByAddress,
  renderAccountName,
  renderShortAddress,
  safeToChecksumAddress,
} from '../../../util/address';
import Device from '../../../util/device';
import { hexToBN, renderFromWei, weiToFiat } from '../../../util/number';
import { ThemeContext, mockTheme } from '../../../util/theme';
import {
  getActiveTabUrl,
  getNormalizedTxState,
  getTicker,
} from '../../../util/transactions';
import ApproveTransactionHeader from '../../Views/confirmations/legacy/components/ApproveTransactionHeader';
import Identicon from '../Identicon';
import { selectInternalAccounts } from '../../../selectors/accountsController';

const createStyles = (colors: any) =>
  StyleSheet.create({
    accountInformation: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border.default,
      borderRadius: 10,
      padding: Device.isMediumDevice() ? 8 : 16,
      alignItems: 'center',
    },
    identicon: {
      marginRight: 8,
    },
    accountInfoRow: {
      flexGrow: 1,
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      marginRight: 8,
    },
    accountNameAndAddress: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    accountName: {
      maxWidth: Device.isMediumDevice() ? '35%' : '45%',
      ...fontStyles.bold,
      fontSize: 16,
      marginRight: 2,
      color: colors.text.default,
    },
    accountNameSmall: {
      fontSize: 12,
    },
    accountAddress: {
      flexGrow: 1,
      ...fontStyles.bold,
      fontSize: 16,
      color: colors.text.default,
    },
    accountAddressSmall: {
      fontSize: 12,
    },
    balanceText: {
      ...fontStyles.thin,
      fontSize: 14,
      alignSelf: 'flex-start',
      color: colors.text.default,
    },
    balanceTextSmall: {
      fontSize: 12,
    },
    tag: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.text.default,
      padding: 4,
      minWidth: 42,
    },
    tagText: {
      textAlign: 'center',
      color: colors.text.default,
    },
  });

interface AccountInfoCardProps {
  fromAddress: string;
  accounts?: Record<string, { balance?: string }>;
  internalAccounts?: any[];
  conversionRate?: number;
  currentCurrency?: string;
  operation?: string;
  showFiatBalance?: boolean;
  ticker?: string;
  transaction?: any;
  origin?: string;
}

class AccountInfoCard extends PureComponent<AccountInfoCardProps> {
  declare context: React.ContextType<typeof ThemeContext>;

  render(): React.JSX.Element {
    const {
      accounts,
      internalAccounts,
      conversionRate,
      currentCurrency,
      operation,
      ticker,
      showFiatBalance = true,
      fromAddress: rawFromAddress,
      transaction,
      origin,
    } = this.props;

    const fromAddress = safeToChecksumAddress(rawFromAddress);
    const accountLabelTag = getLabelTextByAddress(fromAddress);
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);
    const weiBalance = accounts?.[fromAddress]?.balance
      ? hexToBN(accounts[fromAddress].balance)
      : 0;
    const balance = `${renderFromWei(weiBalance)} ${getTicker(ticker)}`;
    const accountLabel = renderAccountName(fromAddress, internalAccounts);
    const address = renderShortAddress(fromAddress);
    const dollarBalance = showFiatBalance
      ? weiToFiat(weiBalance, conversionRate, currentCurrency, 2)?.toUpperCase()
      : undefined;

    const sdkConnections = SDKConnect.getInstance().getConnections();

    const currentConnection = sdkConnections[origin ?? ''];

    const isOriginUrl = isUrl(origin ?? '');

    const originatorInfo = currentConnection?.originatorInfo;

    const sdkDappMetadata = {
      url: isOriginUrl ? origin : originatorInfo?.url ?? strings('sdk.unknown'),
      icon: originatorInfo?.icon,
    };
    const actualOriginUrl = isOriginUrl
      ? origin
      : originatorInfo?.url ?? strings('sdk.unknown');

    return operation === 'signing' && transaction !== undefined ? (
      <ApproveTransactionHeader
        origin={actualOriginUrl}
        url={actualOriginUrl}
        from={rawFromAddress}
        sdkDappMetadata={sdkDappMetadata}
      />
    ) : (
      <View style={styles.accountInformation}>
        <Identicon
          address={fromAddress}
          diameter={40}
          customStyle={styles.identicon}
        />
        <View style={styles.accountInfoRow}>
          <View style={styles.accountNameAndAddress}>
            <Text
              numberOfLines={1}
              style={[
                styles.accountName,
                accountLabelTag ? styles.accountNameSmall : undefined,
              ]}
            >
              {accountLabel}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.accountAddress,
                accountLabelTag ? styles.accountAddressSmall : undefined,
              ]}
            >
              ({address})
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.balanceText,
              accountLabelTag ? styles.balanceTextSmall : undefined,
            ]}
          >
            {strings('signature_request.balance_title')}{' '}
            {dollarBalance !== undefined
              ? `${dollarBalance} (${balance})`
              : balance}
          </Text>
        </View>
        {accountLabelTag && (
          <View style={styles.tag}>
            <Text variant={TextVariant.BodySMBold} style={styles.tagText}>
              {accountLabelTag}
            </Text>
          </View>
        )}
      </View>
    );
  }
}

const mapStateToProps = (state: any) => ({
  accounts: selectAccounts(state),
  internalAccounts: selectInternalAccounts(state),
  conversionRate: selectConversionRate(state),
  currentCurrency: selectCurrentCurrency(state),
  ticker: selectEvmTicker(state),
  transaction: getNormalizedTxState(state),
  activeTabUrl: getActiveTabUrl(state),
});

AccountInfoCard.contextType = ThemeContext;

export default connect(mapStateToProps)(AccountInfoCard);
