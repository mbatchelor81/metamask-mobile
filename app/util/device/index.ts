'use strict';

import { Dimensions, Platform } from 'react-native';
import { hasNotch, getApiLevel } from 'react-native-device-info';

export default class Device {
  static getDeviceWidth(): number {
    return Dimensions.get('window').width;
  }

  static getDeviceHeight(): number {
    return Dimensions.get('window').height;
  }

  static isIos(): boolean {
    return Platform.OS === 'ios';
  }

  static isAndroid(): boolean {
    return Platform.OS === 'android';
  }

  static isIpad(): boolean {
    return this.getDeviceWidth() >= 1000 || this.getDeviceHeight() >= 1000;
  }

  static isLandscape(): boolean {
    return this.getDeviceWidth() > this.getDeviceHeight();
  }

  static isIphone5(): boolean {
    return this.getDeviceWidth() === 320;
  }

  static isIphone5S(): boolean {
    return this.getDeviceWidth() === 320;
  }

  static isIphone6(): boolean {
    return this.getDeviceWidth() === 375;
  }

  static isIphone6Plus(): boolean {
    return this.getDeviceWidth() === 414;
  }

  static isIphone6SPlus(): boolean {
    return this.getDeviceWidth() === 414;
  }

  static isIphoneX(): boolean {
    return this.getDeviceWidth() >= 375 && this.getDeviceHeight() >= 812;
  }

  static isIpadPortrait9_7(): boolean {
    return this.getDeviceHeight() === 1024 && this.getDeviceWidth() === 736;
  }
  static isIpadLandscape9_7(): boolean {
    return this.getDeviceHeight() === 736 && this.getDeviceWidth() === 1024;
  }

  static isIpadPortrait10_5(): boolean {
    return this.getDeviceHeight() === 1112 && this.getDeviceWidth() === 834;
  }
  static isIpadLandscape10_5(): boolean {
    return this.getDeviceWidth() === 1112 && this.getDeviceHeight() === 834;
  }

  static isIpadPortrait12_9(): boolean {
    return this.getDeviceWidth() === 1024 && this.getDeviceHeight() === 1366;
  }

  static isIpadLandscape12_9(): boolean {
    return this.getDeviceWidth() === 1366 && this.getDeviceHeight() === 1024;
  }

  static isSmallDevice(): boolean {
    return this.getDeviceHeight() < 600;
  }

  static isMediumDevice(): boolean {
    return this.getDeviceHeight() < 736;
  }

  static isLargeDevice(): boolean {
    return this.getDeviceHeight() > 736;
  }

  static hasNotch(): boolean {
    return hasNotch();
  }

  static async getDeviceAPILevel(): Promise<number> {
    const apiLevel = await getApiLevel();
    return apiLevel;
  }
}
