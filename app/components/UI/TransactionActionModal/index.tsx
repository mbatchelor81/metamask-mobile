import React from 'react';
import { strings } from '../../../../locales/i18n';
import ActionModal from '../ActionModal';
import TransactionActionContent from './TransactionActionContent';

interface TransactionActionModalProps {
  isVisible?: boolean;
  cancelText?: string;
  confirmDisabled?: boolean;
  confirmText?: string;
  onCancelPress?: () => void;
  onConfirmPress?: () => void;
  cancelButtonMode?: string;
  confirmButtonMode?: string;
  feeText?: string;
  titleText?: string;
  gasTitleText?: string;
  descriptionText?: string;
}

/**
 * View that renders a modal to be used for speed up or cancel transaction modal
 */
export default function TransactionActionModal({
  isVisible,
  confirmDisabled,
  onCancelPress,
  onConfirmPress,
  confirmText,
  cancelText,
  feeText,
  titleText,
  gasTitleText,
  descriptionText,
  cancelButtonMode,
  confirmButtonMode,
}: TransactionActionModalProps): React.JSX.Element {
  return (
    <ActionModal
      modalVisible={isVisible}
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirmPress={onConfirmPress}
      onCancelPress={onCancelPress}
      onRequestClose={onCancelPress}
      cancelButtonMode={cancelButtonMode}
      confirmButtonMode={confirmButtonMode}
      confirmDisabled={confirmDisabled}
    >
      <TransactionActionContent
        confirmDisabled={confirmDisabled}
        feeText={feeText}
        titleText={titleText}
        gasTitleText={gasTitleText}
        descriptionText={descriptionText}
      />
    </ActionModal>
  );
}

TransactionActionModal.defaultProps = {
  cancelButtonMode: 'neutral',
  confirmButtonMode: 'warning',
  cancelText: strings('action_view.cancel'),
  confirmText: strings('action_view.confirm'),
  confirmDisabled: false,
  displayCancelButton: true,
  displayConfirmButton: true,
};
