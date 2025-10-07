import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { Alert } from 'react-native';
import { connect, useSelector } from 'react-redux';
import type { Dispatch } from 'redux';
import { ethers } from 'ethers';
import abi from 'human-standard-token-abi';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { Token } from '@metamask/assets-controllers';
import {
  TransactionMeta,
  TransactionParams as BaseTransactionParams,
} from '@metamask/transaction-controller';
import type { IMetaMetricsEvent } from '../../../core/Analytics/MetaMetrics.types';

import NotificationManager from '../../../core/NotificationManager';
import Engine from '../../../core/Engine';
import { strings } from '../../../../locales/i18n';
import { fromWei, isZeroValue } from '../../../util/number';
import {
  setEtherTransaction,
  setTransactionObject,
} from '../../../actions/transaction';
import WalletConnect from '../../../core/WalletConnect/WalletConnect';
import {
  getMethodData,
  TOKEN_METHOD_TRANSFER,
  getTokenValueParam,
  getTokenAddressParam,
  calcTokenAmount,
  getTokenValueParamAsHex,
  getIsSwapApproveOrSwapTransaction,
  isApprovalTransaction,
} from '../../../util/transactions';
import Logger from '../../../util/Logger';
import TransactionTypes from '../../../core/TransactionTypes';
import { swapsUtils } from '@metamask/swaps-controller';
import { query } from '@metamask/controller-utils';
import BigNumber from 'bignumber.js';
import { toLowerCaseEquals } from '../../../util/general';
import { KEYSTONE_TX_CANCELED } from '../../../constants/error';
import { MetaMetricsEvents } from '../../../core/Analytics';
import {
  getAddressAccountType,
  isHardwareAccount,
} from '../../../util/address';

import {
  selectEvmChainId,
  selectProviderType,
} from '../../../selectors/networkController';
import WatchAssetApproval from '../../Approvals/WatchAssetApproval';
import SignatureApproval from '../../Approvals/SignatureApproval';
import AddChainApproval from '../../Approvals/AddChainApproval';
import SwitchChainApproval from '../../Approvals/SwitchChainApproval';
import WalletConnectApproval from '../../Approvals/WalletConnectApproval';
import ConnectApproval from '../../Approvals/ConnectApproval';
import {
  TransactionApproval,
  TransactionModalType,
} from '../../Approvals/TransactionApproval';
import PermissionApproval from '../../Approvals/PermissionApproval';
import FlowLoaderModal from '../../Approvals/FlowLoaderModal';
import TemplateConfirmationModal from '../../Approvals/TemplateConfirmationModal';
import { selectTokenList } from '../../../selectors/tokenListController';
import { selectTokens } from '../../../selectors/tokensController';
import { getDeviceId } from '../../../core/Ledger/Ledger';
import { selectSelectedInternalAccountFormattedAddress } from '../../../selectors/accountsController';
import { createLedgerTransactionModalNavDetails } from '../../UI/LedgerModals/LedgerTransactionModal';
import ExtendedKeyringTypes from '../../../constants/keyringTypes';
import { ConfirmRoot } from '../../../components/Views/confirmations/components/confirm';
import { useMetrics } from '../../../components/hooks/useMetrics';
import { selectShouldUseSmartTransaction } from '../../../selectors/smartTransactionsController';
import { STX_NO_HASH_ERROR } from '../../../util/smart-transactions/smart-publish-hook';
import { getSmartTransactionMetricsProperties } from '../../../util/smart-transactions';
import { cloneDeep, isEqual } from 'lodash';
import { selectSwapsTransactions } from '../../../selectors/transactionController';
import { updateSwapsTransaction } from '../../../util/swaps/swaps-transactions';
import { RootState } from '../../../reducers';

import InstallSnapApproval from '../../Approvals/InstallSnapApproval';
import { getGlobalEthQuery } from '../../../util/networks/global-network';
import SnapDialogApproval from '../../Snaps/SnapDialogApproval/SnapDialogApproval';
import SnapAccountCustomNameApproval from '../../Approvals/SnapAccountCustomNameApproval';

const hstInterface = new ethers.utils.Interface(abi);

interface ExtendedTransactionParams extends BaseTransactionParams {
  readableValue?: string;
  assetType?: string;
}

interface MapStateToProps {
  selectedAddress: string;
  chainId: string;
  tokens: Token[];
  providerType: string;
  shouldUseSmartTransaction: boolean;
}

interface MapDispatchToProps {
  setEtherTransaction: (transaction: Record<string, unknown>) => void;
  setTransactionObject: (transaction: Record<string, unknown>) => void;
}

interface RootRPCMethodsUIProps extends MapStateToProps, MapDispatchToProps {
  navigation: NavigationProp<ParamListBase>;
}

interface SwapTransactionAnalytics {
  paramsForAnalytics: {
    sentAt: number;
    gasEstimate: string;
    ethAccountBalance: string;
    approvalTransactionMetaId?: string;
  };
  destinationToken: {
    address: string;
    symbol: string;
    decimals: number;
    [key: string]: unknown;
  };
  destinationTokenDecimals: number;
  destinationAmount: string;
  analytics: {
    isGasIncludedTrade?: boolean;
    available_quotes?: number;
    best_quote_source?: string;
    chain_id?: string;
    custom_slippage?: boolean;
    network_fees_USD?: string;
    other_quote_selected?: boolean;
    request_type?: string;
    token_from?: string;
    token_to?: string;
    token_from_amount?: string;
    token_to_amount?: string;
    network_fees_ETH?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface TrackSwapsParams {
  trackSwaps: (
    event: IMetaMetricsEvent,
    transactionMeta: TransactionMeta,
    swapsTransactions: Record<string, SwapTransactionAnalytics>
  ) => Promise<void>;
}

function useSwapsTransactions() {
  const swapTransactions = useSelector(selectSwapsTransactions, isEqual);

  return useMemo(() => swapTransactions ?? {}, [swapTransactions]);
}

export const useSwapConfirmedEvent = ({ trackSwaps }: TrackSwapsParams) => {
  const [transactionMetaIdsForListening, setTransactionMetaIdsForListening] =
    useState<string[]>([]);

  const addTransactionMetaIdForListening = useCallback((txMetaId: string) => {
    setTransactionMetaIdsForListening((prevIds) => [
      ...prevIds,
      txMetaId,
    ]);
  }, []);
  const swapsTransactions = useSwapsTransactions();

  useEffect(() => {
    const [txMetaId, ...restTxMetaIds] = transactionMetaIdsForListening;

    if (txMetaId && swapsTransactions[txMetaId]) {
      Engine.controllerMessenger.subscribeOnceIf(
        'TransactionController:transactionConfirmed',
        (transactionMeta) => {
          if (
            swapsTransactions[transactionMeta.id]?.analytics &&
            swapsTransactions[transactionMeta.id]?.paramsForAnalytics
          ) {
            trackSwaps(
              MetaMetricsEvents.SWAP_COMPLETED,
              transactionMeta,
              swapsTransactions,
            );
          }
        },
        (transactionMeta) => transactionMeta.id === txMetaId,
      );
      setTransactionMetaIdsForListening(restTxMetaIds);
    }
  }, [trackSwaps, transactionMetaIdsForListening, swapsTransactions]);

  return {
    addTransactionMetaIdForListening,
    transactionMetaIdsForListening,
  };
};

const RootRPCMethodsUI = (props: RootRPCMethodsUIProps) => {
  const { trackEvent, createEventBuilder } = useMetrics();
  const [transactionModalType, setTransactionModalType] = useState<
    TransactionModalType | undefined
  >(undefined);
  const tokenList = useSelector(selectTokenList);
  const setTransactionObjectAction = props.setTransactionObject;
  const setEtherTransactionAction = props.setEtherTransaction;

  const initializeWalletConnect = () => {
    WalletConnect.init();
  };

  const trackSwaps = useCallback(
    async (
      event: IMetaMetricsEvent,
      transactionMeta: TransactionMeta,
      swapsTransactions: Record<string, SwapTransactionAnalytics> = {}
    ) => {
      try {
        const { TransactionController, SmartTransactionsController } =
          Engine.context;
        const swapTransaction = swapsTransactions[transactionMeta.id];

        const {
          sentAt,
          gasEstimate,
          ethAccountBalance,
          approvalTransactionMetaId,
        } = swapTransaction.paramsForAnalytics;

        const approvalTransaction =
          TransactionController.state.transactions.find(
            ({ id }) => id === approvalTransactionMetaId,
          );

        const ethQuery = getGlobalEthQuery();

        const ethBalance = await query(ethQuery, 'getBalance', [
          props.selectedAddress,
        ]);
        const receipt = await query(ethQuery, 'getTransactionReceipt', [
          transactionMeta.hash,
        ]);

        const currentBlock = await query(ethQuery, 'getBlockByHash', [
          receipt.blockHash,
          false,
        ]);
        let approvalReceipt;
        if (approvalTransaction?.hash) {
          approvalReceipt = await query(ethQuery, 'getTransactionReceipt', [
            approvalTransaction.hash,
          ]);
        }
        const tokensReceived = swapsUtils.getSwapsTokensReceived(
          receipt,
          approvalReceipt,
          transactionMeta?.txParams,
          approvalTransaction?.txParams || null,
          swapTransaction.destinationToken,
          ethAccountBalance,
          ethBalance,
        );

        const timeToMine = currentBlock.timestamp - sentAt;
        const estimatedVsUsedGasRatio = `${new BigNumber(receipt.gasUsed)
          .div(gasEstimate)
          .times(100)
          .toFixed(2)}%`;
        const quoteVsExecutionRatio = `${swapsUtils
          .calcTokenAmount(
            new BigNumber(tokensReceived || '0x0'),
            swapTransaction.destinationTokenDecimals,
          )
          .div(swapTransaction.destinationAmount)
          .times(100)
          .toFixed(2)}%`;
        const tokenToAmountReceived = tokensReceived ? swapsUtils.calcTokenAmount(
          new BigNumber(tokensReceived),
          swapTransaction.destinationToken.decimals,
        ) : new BigNumber(0);

        const analyticsParams = {
          ...swapTransaction.analytics,
          account_type: getAddressAccountType(transactionMeta.txParams.from),
        };

        updateSwapsTransaction(transactionMeta.id, (swapsTransaction) => {
          swapsTransaction.gasUsed = receipt.gasUsed;

          if (tokensReceived) {
            swapsTransaction.receivedDestinationAmount = new BigNumber(
              tokensReceived,
              16,
            ).toString(10);
          }

          delete swapsTransaction.analytics;
          delete swapsTransaction.paramsForAnalytics;
        });

        const smartTransactionMetricsProperties =
          await getSmartTransactionMetricsProperties(
            SmartTransactionsController,
            transactionMeta,
            false,
          );

        const parameters = {
          time_to_mine: timeToMine,
          estimated_vs_used_gasRatio: estimatedVsUsedGasRatio,
          quote_vs_executionRatio: quoteVsExecutionRatio,
          token_to_amount_received: tokenToAmountReceived.toString(),
          is_smart_transaction: props.shouldUseSmartTransaction,
          gas_included: analyticsParams.isGasIncludedTrade,
          ...await smartTransactionMetricsProperties,
          available_quotes: analyticsParams.available_quotes,
          best_quote_source: analyticsParams.best_quote_source,
          chain_id: analyticsParams.chain_id,
          custom_slippage: analyticsParams.custom_slippage,
          network_fees_USD: analyticsParams.network_fees_USD,
          other_quote_selected: analyticsParams.other_quote_selected,
          request_type: analyticsParams.request_type,
          token_from: analyticsParams.token_from,
          token_to: analyticsParams.token_to,
        };
        const sensitiveParameters = {
          token_from_amount: analyticsParams.token_from_amount,
          token_to_amount: analyticsParams.token_to_amount,
          network_fees_ETH: analyticsParams.network_fees_ETH,
        };

        Logger.log('Swaps', 'Sending metrics event', event);

        trackEvent(
          createEventBuilder(event)
            .addProperties({ ...parameters })
            .addSensitiveProperties({ ...sensitiveParameters })
            .build(),
        );
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        Logger.error(error, MetaMetricsEvents.SWAP_TRACKING_FAILED);
        trackEvent(
          createEventBuilder(MetaMetricsEvents.SWAP_TRACKING_FAILED)
            .addProperties({
              error: error.message,
            })
            .build(),
        );
      }
    },
    [
      props.selectedAddress,
      props.shouldUseSmartTransaction,
      trackEvent,
      createEventBuilder,
    ],
  );

  const { addTransactionMetaIdForListening } = useSwapConfirmedEvent({
    trackSwaps,
  });
  const swapsTransactions = useSwapsTransactions();

  const autoSign = useCallback(
    async (transactionMeta: TransactionMeta) => {
      const { KeyringController } = Engine.context;
      const { id: transactionId } = transactionMeta;

      try {
        Engine.controllerMessenger.subscribeOnceIf(
          'TransactionController:transactionFinished',
          (finishedTxMeta) => {
            if (finishedTxMeta.status === 'submitted') {
              NotificationManager.watchSubmittedTransaction({
                ...finishedTxMeta,
                assetType: (finishedTxMeta.txParams as ExtendedTransactionParams).assetType,
              });
            } else {
              if (swapsTransactions[finishedTxMeta.id]?.analytics) {
                trackSwaps(
                  MetaMetricsEvents.SWAP_FAILED,
                  finishedTxMeta,
                  swapsTransactions,
                );
              }
              throw finishedTxMeta.error;
            }
          },
          (txMeta) => txMeta.id === transactionId,
        );

        addTransactionMetaIdForListening(transactionMeta.id);

        await KeyringController.resetQRKeyringState();

        const isLedgerAccount = isHardwareAccount(
          transactionMeta.txParams.from,
          [ExtendedKeyringTypes.ledger],
        );

        if (isLedgerAccount) {
          const deviceId = await getDeviceId();

          props.navigation.navigate(
            ...createLedgerTransactionModalNavDetails({
              transactionId: transactionMeta.id,
              deviceId,
              onConfirmationComplete: () => { // (important-comment)
                // Confirmation is handled by the Ledger modal
              },
            }),
          );
        } else {
          Engine.acceptPendingApproval(transactionMeta.id);
        }
      } catch (e) {
        const error = e as Error;
        if (
          !error?.message?.startsWith(KEYSTONE_TX_CANCELED) &&
          !error?.message?.startsWith(STX_NO_HASH_ERROR)
        ) {
          Alert.alert(
            strings('transactions.transaction_error'),
            error?.message || String(e),
            [{ text: strings('navigation.ok') }],
          );
          Logger.error(error, 'error while trying to send transaction (Main)');
        } else {
          trackEvent(
            createEventBuilder(
              MetaMetricsEvents.QR_HARDWARE_TRANSACTION_CANCELED,
            ).build(),
          );
        }
      }
    },
    [
      props.navigation,
      trackSwaps,
      trackEvent,
      swapsTransactions,
      addTransactionMetaIdForListening,
      createEventBuilder,
    ],
  );

  const onUnapprovedTransaction = useCallback(
    async (transactionMetaOriginal: TransactionMeta) => {
      const transactionMeta = cloneDeep(transactionMetaOriginal);

      if (transactionMeta.origin === TransactionTypes.MMM) return;

      const to = transactionMeta.txParams.to?.toLowerCase();
      const { data } = transactionMeta.txParams;

      if (
        getIsSwapApproveOrSwapTransaction(
          data,
          transactionMeta.origin,
          to,
          props.chainId,
        )
      ) {
        autoSign(transactionMeta);
      } else {
        const {
          chainId,
          networkClientId,
          txParams: { value, gas, gasPrice, data: txData },
        } = transactionMeta;
        const { AssetsContractController } = Engine.context;
        transactionMeta.txParams.gas = gas;
        transactionMeta.txParams.gasPrice = gasPrice;

        if (
          (value === '0x0' || !value) &&
          txData &&
          txData !== '0x' &&
          to &&
          (await getMethodData(txData, networkClientId)).name ===
            TOKEN_METHOD_TRANSFER
        ) {
          let asset = props.tokens.find(({ address }) =>
            toLowerCaseEquals(address, to),
          );
          if (!asset) {
            asset = tokenList[to];

            if (!asset) {
              try {
                const decimals = await AssetsContractController.getERC20TokenDecimals(to);
                const symbol = await AssetsContractController.getERC721AssetSymbol(to);
                asset = {
                  symbol,
                  decimals: Number(decimals),
                  address: to,
                } as Token;
              } catch (e) {
                asset = { symbol: 'ERC20', decimals: 0, address: to } as Token;
              }
            }
          }

          const tokenData = hstInterface.parseTransaction({ data: txData });
          const tokenValue = getTokenValueParam(tokenData);
          const toAddress = getTokenAddressParam(tokenData);
          const tokenAmount =
            tokenData && asset && tokenValue ? calcTokenAmount(tokenValue, asset.decimals).toFixed() : undefined;

          transactionMeta.txParams.value = getTokenValueParamAsHex(tokenData);
          (transactionMeta.txParams as ExtendedTransactionParams).readableValue = tokenAmount;
          transactionMeta.txParams.to = toAddress;

          setTransactionObjectAction({
            selectedAsset: asset,
            id: transactionMeta.id,
            origin: transactionMeta.origin,
            securityAlertResponse: transactionMeta.securityAlertResponse,
            networkClientId,
            chainId,
            ...transactionMeta.txParams,
          });
        } else {
          transactionMeta.txParams.value = value;
          (transactionMeta.txParams as ExtendedTransactionParams).readableValue = fromWei(
            value,
          );

          setEtherTransactionAction({
            id: transactionMeta.id,
            origin: transactionMeta.origin,
            securityAlertResponse: transactionMeta.securityAlertResponse,
            chainId,
            networkClientId,
            ...transactionMeta.txParams,
          });
        }

        if (txData && isApprovalTransaction(txData) && (!value || isZeroValue(value))) {
          setTransactionModalType(TransactionModalType.Transaction);
        } else {
          setTransactionModalType(TransactionModalType.Dapp);
        }
      }
    },
    [
      props.chainId,
      props.tokens,
      autoSign,
      setTransactionObjectAction,
      tokenList,
      setEtherTransactionAction,
    ],
  );

  const onTransactionComplete = useCallback(() => {
    setTransactionModalType(undefined);
  }, []);

  useEffect(() => {
    Engine.controllerMessenger.subscribe(
      'TransactionController:unapprovedTransactionAdded',
      onUnapprovedTransaction,
    );
    return () => {
      Engine.controllerMessenger.unsubscribe(
        'TransactionController:unapprovedTransactionAdded',
        onUnapprovedTransaction,
      );
    };
  }, [onUnapprovedTransaction]);

  useEffect(() => {
    initializeWalletConnect();

    return function cleanup() {
      // @ts-expect-error - hub property exists but not in types
      Engine.context.TokensController?.hub?.removeAllListeners();
      WalletConnect?.hub?.removeAllListeners();
    };
  }, []);

  return (
    <React.Fragment>
      <ConfirmRoot />
      <SignatureApproval />
      <WalletConnectApproval />
      <TransactionApproval
        transactionType={transactionModalType}
        navigation={props.navigation}
        onComplete={onTransactionComplete}
      />
      <AddChainApproval />
      <SwitchChainApproval />
      <WatchAssetApproval />
      <ConnectApproval navigation={props.navigation} />
      <PermissionApproval navigation={props.navigation} />
      <FlowLoaderModal />
      <TemplateConfirmationModal />
      {
      }
      <InstallSnapApproval />
      <SnapDialogApproval />
      {
      }
      {
      }
      <SnapAccountCustomNameApproval />
      {
      }
    </React.Fragment>
  );
};

const mapStateToProps = (state: RootState): MapStateToProps => ({
  selectedAddress: selectSelectedInternalAccountFormattedAddress(state) || '',
  chainId: selectEvmChainId(state),
  tokens: selectTokens(state),
  providerType: selectProviderType(state),
  shouldUseSmartTransaction: selectShouldUseSmartTransaction(
    state,
    selectEvmChainId(state),
  ),
});

const mapDispatchToProps = (dispatch: Dispatch): MapDispatchToProps => ({
  setEtherTransaction: (transaction: Record<string, unknown>) =>
    dispatch(setEtherTransaction(transaction)),
  setTransactionObject: (transaction: Record<string, unknown>) =>
    dispatch(setTransactionObject(transaction)),
});

export default connect(mapStateToProps, mapDispatchToProps)(RootRPCMethodsUI);
