interface ApproveHostAction {
  type: 'APPROVE_HOST';
  hostname: string;
}

interface RejectHostAction {
  type: 'REJECT_HOST';
  hostname: string;
}

interface RecordSRPRevealTimestampAction {
  type: 'RECORD_SRP_REVEAL_TIMESTAMP';
  timestamp: number;
}

export function approveHost(hostname: string): ApproveHostAction {
  return {
    type: 'APPROVE_HOST',
    hostname,
  };
}

export function rejectHost(hostname: string): RejectHostAction {
  return {
    type: 'REJECT_HOST',
    hostname,
  };
}

export function recordSRPRevealTimestamp(timestamp: number): RecordSRPRevealTimestampAction {
  return {
    type: 'RECORD_SRP_REVEAL_TIMESTAMP',
    timestamp,
  };
}
