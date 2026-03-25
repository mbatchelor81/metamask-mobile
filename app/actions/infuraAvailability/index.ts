import {
  INFURA_AVAILABILITY_BLOCKED,
  INFURA_AVAILABILITY_NOT_BLOCKED,
} from '../../reducers/infuraAvailability';

interface InfuraAvailabilityBlockedAction {
  type: typeof INFURA_AVAILABILITY_BLOCKED;
}

interface InfuraAvailabilityNotBlockedAction {
  type: typeof INFURA_AVAILABILITY_NOT_BLOCKED;
}

export function setInfuraAvailabilityBlocked(): InfuraAvailabilityBlockedAction {
  return {
    type: INFURA_AVAILABILITY_BLOCKED,
  };
}

export function setInfuraAvailabilityNotBlocked(): InfuraAvailabilityNotBlockedAction {
  return {
    type: INFURA_AVAILABILITY_NOT_BLOCKED,
  };
}
