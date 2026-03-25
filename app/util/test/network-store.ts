import axios, { AxiosResponse } from 'axios';
import { getFixturesServerPortInApp } from './utils';

const FETCH_TIMEOUT = 40000; // Timeout in milliseconds

// Configure Axios with CORS headers
axios.defaults.headers.common['Access-Control-Allow-Origin'] = '*';
axios.defaults.headers.common['Access-Control-Allow-Methods'] =
  'GET, POST, PUT, DELETE';
axios.defaults.headers.common['Access-Control-Allow-Headers'] =
  'Origin, X-Requested-With, Content-Type, Accept';

const fetchWithTimeout = (url: string): Promise<AxiosResponse> =>
  new Promise((resolve, reject) => {
    axios
      .get(url)
      .then((response) => resolve(response))
      .catch((error) => reject(error));
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, FETCH_TIMEOUT);
  });

const FIXTURE_SERVER_HOST = 'localhost';
const BROWSERSTACK_LOCALHOST = 'bs-local.com';
const FIXTURE_SERVER_URL = `http://${FIXTURE_SERVER_HOST}:${getFixturesServerPortInApp()}/state.json`;

class ReadOnlyNetworkStore {
  _initialized: boolean;
  _state: unknown;
  _asyncState: Record<string, unknown> | undefined;

  constructor() {
    this._initialized = false;
    this._state = undefined;
    this._asyncState = undefined;
  }

  // Redux Store
  async getState(): Promise<unknown> {
    await this._initIfRequired();
    return this._state;
  }

  async setState(state: unknown): Promise<void> {
    if (!state) {
      throw new Error('MetaMask - updated state is missing');
    }
    await this._initIfRequired();
    this._state = state;
  }

  // Async Storage
  async getString(key: string): Promise<unknown | null> {
    await this._initIfRequired();
    const value = this._asyncState?.[key];
    return value !== undefined ? value : null;
  }

  async set(key: string, value: unknown): Promise<void> {
    await this._initIfRequired();
    if (this._asyncState) {
      this._asyncState[key] = value;
    }
  }

  async delete(key: string): Promise<void> {
    await this._initIfRequired();
    if (this._asyncState) {
      delete this._asyncState[key];
    }
  }

  async clearAll(): Promise<void> {
    await this._initIfRequired();
    this._asyncState = undefined;
  }

  async _initIfRequired(): Promise<void> {
    if (!this._initialized) {
      await this._init();
    }
  }

  async _init(): Promise<void> {
    // List of URLs to check for Fixture Server availability.
    // Browserstack requires that the HOST is bs-local.com instead of localhost.
    const urls: string[] = [
      FIXTURE_SERVER_URL,
      FIXTURE_SERVER_URL.replace(FIXTURE_SERVER_HOST, BROWSERSTACK_LOCALHOST)
    ];

    try {
      for (const url of urls) {
        try {
          const response = await fetchWithTimeout(url);
          if (response.status === 200) {
            this._state = response.data?.state;
            this._asyncState = response.data?.asyncState;
            return;
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.debug(`Error loading network state from ${url}: '${error}'`);
          // Continue to next URL if this one failed
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.debug(`Error loading network state: '${error}'`);
    } finally {
      this._initialized = true;
    }
  }
}

export default new ReadOnlyNetworkStore();
