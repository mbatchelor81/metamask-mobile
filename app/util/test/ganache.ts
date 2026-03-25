import { getGanachePort } from '../../../e2e/fixtures/utils';
import ganache from 'ganache';

export const DEFAULT_GANACHE_PORT = 8545;

interface GanacheOptions {
  blockTime?: number;
  network_id?: number;
  port?: number;
  vmErrorsOnRPCResponse?: boolean;
  hardfork?: string;
  quiet?: boolean;
  mnemonic?: string;
  [key: string]: unknown;
}

const defaultOptions: GanacheOptions = {
  blockTime: 2,
  network_id: 1337,
  port: DEFAULT_GANACHE_PORT,
  vmErrorsOnRPCResponse: false,
  hardfork: 'muirGlacier',
  quiet: false,
};

export default class Ganache {
  _server: ReturnType<typeof ganache.server> | undefined;

  async start(opts: GanacheOptions): Promise<void> {
    if (!opts.mnemonic) {
      throw new Error('Missing required mnemonic');
    }
    const options = { ...defaultOptions, ...opts, port: getGanachePort() };
    const { port } = options;
    try {
      this._server = ganache.server(options as unknown as Parameters<typeof ganache.server>[0]);
      await this._server.listen(port);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  getProvider(): ReturnType<NonNullable<typeof this._server>['provider']> | undefined {
    return this._server?.provider;
  }

  async getAccounts(): Promise<unknown> {
    return await this.getProvider()!.request({
      method: 'eth_accounts',
      params: [],
    });
  }

  async getBalance(): Promise<number | string> {
    const accounts = (await this.getAccounts()) as string[];
    const balanceHex = (await this.getProvider()!.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest'],
    })) as string;
    const balanceInt = parseInt(balanceHex, 16) / 10 ** 18;

    const balanceFormatted =
      balanceInt % 1 === 0 ? balanceInt : balanceInt.toFixed(4);

    return balanceFormatted;
  }

  async quit(): Promise<void> {
    if (!this._server) {
      throw new Error('Server not running yet');
    }
    await this._server.close();
    this._server = undefined;
  }
}
