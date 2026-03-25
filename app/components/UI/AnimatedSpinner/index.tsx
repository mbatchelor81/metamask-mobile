import React, { PureComponent } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Device from '../../../util/device';
import { ThemeContext, mockTheme } from '../../../util/theme';

export const SpinnerSize = {
  MD: 'MD',
  SM: 'SM',
} as const;

type SpinnerSizeType = (typeof SpinnerSize)[keyof typeof SpinnerSize];

interface SpinnerMeasures {
  Android: { height: number; width: number };
  iOS: { height: number; width: number };
  static: { borderRadius: number; width: number; height: number; iconSize: number };
}

const measures: Record<SpinnerSizeType, SpinnerMeasures> = {
  [SpinnerSize.SM]: {
    Android: {
      height: 30.5,
      width: 30.5,
    },
    iOS: {
      height: 28,
      width: 28,
    },
    static: {
      borderRadius: 48,
      width: 24,
      height: 24,
      iconSize: 24,
    },
  },
  [SpinnerSize.MD]: {
    Android: {
      height: 41.5,
      width: 41.5,
    },
    iOS: {
      height: 40,
      width: 40,
    },
    static: {
      borderRadius: 64,
      width: 36,
      height: 36,
      iconSize: 36,
    },
  },
};

const createStyles = (colors: any, m: SpinnerMeasures) =>
  StyleSheet.create({
    view: {
      position: 'relative',
      height: Device.isAndroid()
        ? m.Android.height
        : m.iOS.height,
      width: Device.isAndroid() ? m.Android.width : m.iOS.width,
      top: Device.isAndroid() ? -6 : -5.5,
      left: Device.isAndroid() ? -6 : -5.5,
    },
    static: {
      borderWidth: 3.5,
      borderColor: colors.background.alternative,
      borderRadius: m.static.borderRadius,
      width: m.static.width,
      height: m.static.height,
    },
  });

interface AnimatedSpinnerProps {
  size?: SpinnerSizeType;
}

interface AnimatedSpinnerState {
  spinning: boolean;
}

export default class AnimatedSpinner extends PureComponent<AnimatedSpinnerProps, AnimatedSpinnerState> {
  declare context: React.ContextType<typeof ThemeContext>;
  spinValue = new Animated.Value(0);
  mounted = false;

  state: AnimatedSpinnerState = {
    spinning: false,
  };

  componentDidMount(): void {
    this.mounted = true;
    this.spin();
  }

  componentWillUnmount(): void {
    this.mounted = false;
  }

  spin = (): void => {
    this.spinValue.setValue(0);

    if (this.state.spinning === false) {
      this.setState({ spinning: true });
      this.animation();
    } else {
      this.setState({ spinning: false });
    }
  };

  animation = (): void => {
    this.spinValue.setValue(0);

    Animated.timing(this.spinValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
      isInteraction: false,
    }).start(() => {
      if (this.state.spinning && this.mounted) {
        this.animation();
      } else {
        this.mounted && this.setState({ spinning: false });
      }
    });
  };

  render(): React.JSX.Element {
    const { size = SpinnerSize.MD } = this.props;
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors, measures[size]);
    const spin = this.spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.static}>
        <Animated.View style={[styles.view, { transform: [{ rotate: spin }] }]}>
          <Icon
            name="loading"
            size={measures[size].static.iconSize}
            color={colors.primary.default}
          />
        </Animated.View>
      </View>
    );
  }
}

AnimatedSpinner.contextType = ThemeContext;
