import React from 'react';
import { View } from 'react-native';
import Text from '../../Base/Text';
import InfoModal from '../Swaps/components/InfoModal';
import { strings } from '../../../../locales/i18n';
import AppConstants from '../../../core/AppConstants';

interface TimeEstimateInfoModalProps {
  timeEstimateId?: string;
  isVisible?: boolean;
  onHideModal?: (...args: any[]) => any;
}

const TimeEstimateInfoModal = ({ timeEstimateId, isVisible, onHideModal }: TimeEstimateInfoModalProps) => (
  <InfoModal
    isVisible={isVisible}
    toggleModal={onHideModal}
    title={
      timeEstimateId === AppConstants.GAS_TIMES.MAYBE
        ? strings('times_eip1559.warning_low_title')
        : timeEstimateId === AppConstants.GAS_TIMES.UNKNOWN
        ? strings('times_eip1559.warning_unknown_title')
        : timeEstimateId === AppConstants.GAS_TIMES.VERY_LIKELY
        ? strings('times_eip1559.warning_very_likely_title')
        : null
    }
    body={
      <View>
        <Text>
          {timeEstimateId === AppConstants.GAS_TIMES.UNKNOWN &&
            strings('times_eip1559.warning_unknown')}
          {timeEstimateId === AppConstants.GAS_TIMES.MAYBE &&
            strings('times_eip1559.warning_low')}
          {timeEstimateId === AppConstants.GAS_TIMES.VERY_LIKELY &&
            strings('times_eip1559.warning_very_likely')}
        </Text>
      </View>
    }
  />
);

export default TimeEstimateInfoModal;
