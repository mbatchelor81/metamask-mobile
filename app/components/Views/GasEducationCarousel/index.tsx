import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { connect } from 'react-redux';
import { strings } from '../../../../locales/i18n';
import { useTheme } from '../../../util/theme';
import Device from '../../../util/device';
import {
  selectConversionRate,
  selectCurrentCurrency,
} from '../../../selectors/currencyRateController';
import { selectEvmTicker } from '../../../selectors/networkController';
import {
  renderFromWei,
  weiToFiat,
  hexToBN,
  renderFiat,
} from '../../../util/number';
import { getTicker } from '../../../util/transactions';
import Engine from '../../../core/Engine';
import type { EngineContext } from '../../../core/Engine/types';
import TransactionTypes from '../../../core/TransactionTypes';
import { GAS_ESTIMATE_TYPES } from '@metamask/gas-fee-controller';
import { isTestNet } from '../../../util/networks';
import { BN } from 'ethereumjs-util';
import { WALLET_CONNECT_ORIGIN } from '../../../util/walletconnect';
import AppConstants from '../../../core/AppConstants';
import { MetaMetricsEvents } from '../../../core/Analytics';
import type { RootState } from '../../../reducers';

const createStyles = (colors: any) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    content: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      width: Device.getDeviceWidth(),
      height: Device.getDeviceHeight() - 200,
    },
    contentContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 24,
    },
    title: {
      fontSize: 24,
      marginBottom: 12,
      color: colors.text.default,
      justifyContent: 'center',
      textAlign: 'center',
      ...Device.isAndroid() ? {} : { fontWeight: '600' },
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text.alternative,
      textAlign: 'center',
      marginBottom: 32,
    },
    tabUnderlineStyle: {
      backgroundColor: colors.primary.default,
      height: 2,
      width: 20,
    },
    tabStyle: {
      paddingBottom: 0,
      backgroundColor: colors.background.default,
    },
    tabBar: {
      borderColor: colors.border.muted,
      marginTop: 16,
    },
    textStyle: {
      fontSize: 16,
      letterSpacing: 0.5,
      ...Device.isAndroid() ? {} : { fontWeight: '600' },
    },
    activeTextStyle: {
      color: colors.primary.default,
    },
    inactiveTextStyle: {
      color: colors.text.alternative,
    },
    loader: {
      backgroundColor: colors.background.default,
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: 250,
      height: 250,
    },
    tabContent: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 500,
    },
    tabLabel: {
      fontSize: 14,
      lineHeight: 16,
      color: colors.text.alternative,
      textAlign: 'center',
      marginBottom: 4,
    },
    tabDescription: {
      fontSize: 12,
      lineHeight: 16,
      color: colors.text.muted,
      textAlign: 'center',
      marginBottom: 16,
    },
    gasEstimateContainer: {
      backgroundColor: colors.background.alternative,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    gasEstimateText: {
      fontSize: 14,
      color: colors.text.default,
      textAlign: 'center',
    },
  });

const carousel_images = [
  require('../../../images/gas-education-1.png'),
  require('../../../images/gas-education-2.png'),
  require('../../../images/gas-education-3.png'),
];

interface GasEducationCarouselProps {
  /**
   * The navigator object
   */
  navigation: any;
  /**
   * conversion rate of ETH - FIAT
   */
  conversionRate: number | null | undefined;
  /**
   * Selected currency
   */
  currentCurrency: string;
  /**
   * Object that represents the current route info like params passed to it
   */
  route: any;
  /**
   * Current provider ticker
   */
  ticker: string;
}

/**
 * View that is displayed to first time (new) users
 */
const GasEducationCarousel: React.FC<GasEducationCarouselProps> = ({
  navigation,
  route,
  conversionRate,
  currentCurrency,
  ticker,
}) => {
  const [currentTab, setCurrentTab] = useState<number>(1);
  const [gasFiat, setGasFiat] = useState<string | null>(null);
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Sets gas estimates for the carousel
   */
  const setGasEstimates = async (): Promise<void> => {
    const { GasFeeController } = Engine.context as EngineContext;
    const gas = hexToBN(TransactionTypes.CUSTOM_GAS.DEFAULT_GAS_LIMIT);
    try {
      const gasEstimates = await GasFeeController.fetchGasFeeEstimates();

      const gasFeeEstimates = gasEstimates?.gasFeeEstimates as any;
      const estimatedBaseFeeHex = gasFeeEstimates?.estimatedBaseFee;
      const suggestedMaxPriorityFeePerGasHex =
        gasFeeEstimates?.medium?.suggestedMaxPriorityFeePerGas;
      const suggestedMaxFeePerGasHex =
        gasFeeEstimates?.medium?.suggestedMaxFeePerGas;

      const gasHexes = {
        gasPrice: undefined as string | undefined,
        maxFeePerGas: suggestedMaxFeePerGasHex,
        maxPriorityFeePerGas: suggestedMaxPriorityFeePerGasHex,
        estimatedBaseFee: estimatedBaseFeeHex,
      };

      let gasPrice: string | undefined;
      if (gasEstimates?.gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY) {
        gasPrice = gasFeeEstimates?.medium;
      } else if (gasEstimates?.gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE) {
        gasPrice = gasFeeEstimates?.gasPrice;
      } else {
        gasPrice = renderFromWei(
          gas.mul(hexToBN(gasHexes.maxFeePerGas || '0x0')),
        );
      }

      const maxFeePerGasConversion = weiToFiat(
        hexToBN(gasHexes.maxFeePerGas || '0x0').mul(gas),
        conversionRate || 0,
        currentCurrency,
      );

      const gasConversion = renderFiat(
        Number(maxFeePerGasConversion),
        currentCurrency,
      );

      setGasFiat(gasConversion);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setGasEstimates();
  }, []);

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
        {[1, 2, 3].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabStyle,
              {
                marginHorizontal: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
              },
            ]}
            onPress={() => setCurrentTab(tab)}
          >
            <View
              style={[
                styles.tabUnderlineStyle,
                {
                  backgroundColor:
                    currentTab === tab
                      ? colors.primary.default
                      : colors.border.muted,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderContent = () => {
    const tabContent = [
      {
        image: carousel_images[0],
        title: strings('gas_education_carousel.what_is_gas'),
        description: strings('gas_education_carousel.gas_explanation'),
      },
      {
        image: carousel_images[1],
        title: strings('gas_education_carousel.why_do_i_pay_gas'),
        description: strings('gas_education_carousel.gas_purpose'),
      },
      {
        image: carousel_images[2],
        title: strings('gas_education_carousel.how_much_gas'),
        description: strings('gas_education_carousel.gas_amount_explanation'),
      },
    ];

    const content = tabContent[currentTab - 1];

    return (
      <View style={styles.tabContent}>
        <Image source={content.image} style={styles.image} />
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.description}</Text>
        {currentTab === 3 && !isLoading && gasFiat && (
          <View style={styles.gasEstimateContainer}>
            <Text style={styles.gasEstimateText}>
              {strings('gas_education_carousel.current_gas_estimate', {
                estimate: gasFiat,
              })}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <Text>{strings('gas_education_carousel.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.content}>
          {renderContent()}
          {renderTabBar()}
        </View>
      </ScrollView>
    </View>
  );
};

const mapStateToProps = (state: RootState) => ({
  conversionRate: selectConversionRate(state),
  currentCurrency: selectCurrentCurrency(state),
  ticker: selectEvmTicker(state),
});

export default connect(mapStateToProps)(GasEducationCarousel as any);
