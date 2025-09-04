import Engine from '../../../../../core/Engine';

export const setupIntegrationTests = () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    Engine.context.BridgeController = {
      updateBridgeQuoteRequestParams: jest.fn(),
      resetState: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
};
