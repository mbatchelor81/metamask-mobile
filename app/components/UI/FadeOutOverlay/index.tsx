import React, { PureComponent } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';

const createStyles = (colors: any) =>
  StyleSheet.create({
    view: {
      backgroundColor: colors.background.default,
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  });

interface FadeOutOverlayProps {
  style?: ViewStyle;
  duration?: number;
}

interface FadeOutOverlayState {
  done: boolean;
}

/**
 * View that is displayed to first time (new) users
 */
export default class FadeOutOverlay extends PureComponent<FadeOutOverlayProps, FadeOutOverlayState> {
  declare context: React.ContextType<typeof ThemeContext>;

  static defaultProps = {
    style: null,
    duration: Device.isAndroid() ? 300 : 300,
  };

  state: FadeOutOverlayState = {
    done: false,
  };

  opacity = new Animated.Value(1);

  componentDidMount(): void {
    Animated.timing(this.opacity, {
      toValue: 0,
      duration: this.props.duration,
      useNativeDriver: true,
      isInteraction: false,
    }).start(() => {
      this.setState({ done: true });
    });
  }

  render(): React.JSX.Element | null {
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    if (this.state.done) return null;
    return (
      <Animated.View
        style={[{ opacity: this.opacity }, styles.view, this.props.style]}
      />
    );
  }
}

FadeOutOverlay.contextType = ThemeContext;
