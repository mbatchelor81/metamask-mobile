import React, { PureComponent } from 'react';
import type { StyleProp, TextStyle, ViewStyle, GestureResponderEvent } from 'react-native';
import Button from '@metamask/react-native-button';
import getStyles from './styledButtonStyles';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface StyledButtonProps {
  /** Children components of the Button */
  children?: React.ReactNode;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Styles to be applied to the Button Text */
  style?: StyleProp<TextStyle>;
  /** Styles to be applied to the Button disabled state text */
  styleDisabled?: StyleProp<TextStyle>;
  /** Styles to be applied to the Button disabled container */
  disabledContainerStyle?: StyleProp<ViewStyle>;
  /** Styles to be applied to the Button Container */
  containerStyle?: StyleProp<ViewStyle>;
  /** Function to be called on press */
  onPress?: (event: GestureResponderEvent) => void;
  /** Function to be called on press out */
  onPressOut?: (event: GestureResponderEvent) => void;
  /** Type of the button */
  type?: string;
  /** ID of the element to be used on e2e tests */
  testID?: string;
}

/**
 * @deprecated The `<StyledButton>` component has been deprecated in favor of the new `<Button>` component from the component-library.
 * Please update your code to use the new `<Button>` component instead, which can be found at app/component-library/components/Buttons/Button/Button.tsx.
 * You can find documentation for the new Button component in the README:
 * {@link https://github.com/MetaMask/metamask-mobile/tree/main/app/component-library/components/Buttons/Button/README.md}
 * If you would like to help with the replacement of the old `Button` component, please submit a pull request against this GitHub issue:
 * {@link https://github.com/MetaMask/metamask-mobile/issues/8106}
 */
export default class StyledButton extends PureComponent<StyledButtonProps> {
  static defaultProps = {
    ...PureComponent.defaultProps,
    styleDisabled: { opacity: 0.6 },
    disabledContainerStyle: { opacity: 0.6 },
  };

  declare context: React.ContextType<typeof ThemeContext>;

  render = (): React.ReactElement => {
    const {
      type,
      onPress,
      onPressOut,
      style,
      children,
      disabled,
      styleDisabled,
      testID,
      disabledContainerStyle,
    } = this.props;
    const colors = this.context?.colors || mockTheme.colors;
    const { fontStyle, containerStyle } = getStyles(type!, colors);

    return (
      <Button
        testID={testID}
        accessibilityRole="button"
        disabled={disabled}
        styleDisabled={disabled ? styleDisabled : null}
        disabledContainerStyle={disabled ? disabledContainerStyle : null}
        onPress={onPress}
        onPressOut={onPressOut}
        style={[...fontStyle, style]}
        containerStyle={[...containerStyle, this.props.containerStyle]}
      >
        {children}
      </Button>
    );
  };
}

StyledButton.contextType = ThemeContext;
