import { NativeModules, Platform } from 'react-native';

// eslint-disable-next-line dot-notation
const METAMASK_ENVIRONMENT = process.env['METAMASK_ENVIRONMENT'];

const isQa = METAMASK_ENVIRONMENT === 'qa';
const isAndroid = Platform.OS === 'android';

interface PreventScreenshotModule {
  forbid: () => boolean;
  allow: () => boolean;
}

const nativeModule = NativeModules.PreventScreenshot as PreventScreenshotModule | undefined;

export default {
  forbid: isQa
    ? (): boolean => true
    : isAndroid
    ? nativeModule!.forbid
    : (): boolean => true,
  allow: isQa
    ? (): boolean => true
    : isAndroid
    ? nativeModule!.allow
    : (): boolean => true,
};
