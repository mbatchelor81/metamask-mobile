export const flushPromises = (): Promise<void> =>
  new Promise(setImmediate);

export const FIXTURE_SERVER_PORT = 12345;

interface TestConfig {
  fixtureServerPort?: number;
}

// E2E test configuration required in app
export const testConfig: TestConfig = {};

// SEGMENT TRACK URL for E2E tests - this is not a real URL and is used for testing purposes only
export const E2E_METAMETRICS_TRACK_URL = 'https://metametrics.test/track';

/**
 * TODO: Update this condition once we change E2E builds to use release instead of debug
 */
export const isTest: boolean = process.env.METAMASK_ENVIRONMENT !== 'production';
export const isE2E: boolean = process.env.IS_TEST === 'true';
export const enableApiCallLogs: boolean = process.env.LOG_API_CALLS === 'true';
export const getFixturesServerPortInApp = (): number =>
  testConfig.fixtureServerPort ?? FIXTURE_SERVER_PORT;
