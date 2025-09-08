import React, { PureComponent } from 'react';
import { View } from 'react-native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';
import { WebView } from '@metamask/react-native-webview';
import { getWebviewNavbar } from '../../UI/Navbar';
import Share from 'react-native-share'; // eslint-disable-line  import/default
import Logger from '../../../util/Logger';
import { baseStyles } from '../../../styles/common';
import { ThemeContext, mockTheme } from '../../../util/theme';
import type { Theme } from '../../../util/theme/models';

interface SimpleWebviewProps {
  navigation?: NavigationProp<any>;
  route?: RouteProp<any, string>;
}

export default class SimpleWebview extends PureComponent<SimpleWebviewProps> {

  updateNavBar = (): void => {
    const { navigation, route } = this.props;
    const colors = (this.context as Theme).colors || mockTheme.colors;
    navigation?.setOptions(getWebviewNavbar(navigation, route, colors));
  };

  componentDidMount = (): void => {
    const { navigation } = this.props;
    this.updateNavBar();
    navigation?.setParams({ dispatch: this.share });
  };

  componentDidUpdate = (): void => {
    this.updateNavBar();
  };

  share = (): void => {
    const { route } = this.props;
    const url = route?.params?.url;
    if (url) {
      Share.open({
        url,
      }).catch((err: unknown) => {
        Logger.log('Error while trying to share simple web view', err);
      });
    }
  };

  render(): JSX.Element | undefined {
    const uri = this.props.route?.params?.url;
    if (uri) {
      return (
        <View style={baseStyles.flexGrow}>
          <WebView source={{ uri }} />
        </View>
      );
    }
  }
}

export { default as createWebviewNavDetails } from './SimpleWebview.types';

SimpleWebview.contextType = ThemeContext;
