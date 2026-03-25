import Clipboard from '@react-native-clipboard/clipboard';
import Device from '../util/device';

const EXPIRE_TIME_MS = 60000;

const ClipboardManager: {
  getString(): Promise<string>;
  setString(text: string): Promise<void>;
  expireTime: ReturnType<typeof setTimeout> | null;
  setStringExpire(text: string): Promise<void>;
} = {
  async getString(): Promise<string> {
    return await Clipboard.getString();
  },
  async setString(text: string): Promise<void> {
    await Clipboard.setString(text);
  },
  expireTime: null,
  async setStringExpire(text: string): Promise<void> {
    if (Device.isIos()) {
      await (Clipboard as unknown as { setStringExpire: (s: string) => Promise<void> }).setStringExpire(text);
    } else {
      await this.setString(text);
      if (this.expireTime) {
        clearTimeout(this.expireTime);
      }
      this.expireTime = setTimeout(async () => {
        const currentString = await this.getString();

        if (!currentString) return;

        await (Clipboard as unknown as { clearString: () => Promise<void> }).clearString();
      }, EXPIRE_TIME_MS);
    }
  },
};

export default ClipboardManager;
