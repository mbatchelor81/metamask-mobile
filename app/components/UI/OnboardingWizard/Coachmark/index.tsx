import React, { PureComponent } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import {
  colors as importedColors,
  fontStyles,
} from '../../../../styles/common';
import StyledButton from '../../StyledButton';
import { strings } from '../../../../../locales/i18n';
import { mockTheme, ThemeContext } from '../../../../util/theme';
import ButtonIcon, {
  ButtonIconSizes,
} from '../../../../component-library/components/Buttons/ButtonIcon';
import {
  IconName,
  IconColor,
} from '../../../../component-library/components/Icons/Icon';
import { typography } from '@metamask/design-tokens';
import {
  ButtonSize,
  ButtonVariants,
  ButtonWidthTypes,
} from '../../../../component-library/components/Buttons/Button';
import Button from '../../../../component-library/components/Buttons/Button/Button';
import { OnboardingWizardModalSelectorsIDs } from '../../../../../e2e/selectors/Onboarding/OnboardingWizardModal.selectors';
import {
  getFontFamily,
  TextVariant,
} from '../../../../component-library/components/Texts/Text';

interface CoachmarkProps {
  coachmarkStyle?: Record<string, any>;
  style?: Record<string, any>;
  content?: Record<string, any>;
  title?: string;
  currentStep?: number;
  onNext?: (...args: any[]) => any;
  onBack?: (...args: any[]) => any;
  action?: boolean;
  topIndicatorPosition?: false | 'topCenter' | 'topLeft' | 'topLeftCorner' | 'topRight' | 'topRightCorner';
  bottomIndicatorPosition?: false | 'bottomCenter' | 'bottomLeft' | 'bottomLeftCorner' | 'bottomRight';
  onClose?: (...args: any[]) => any;
}

interface CoachmarkState {
  ready: boolean;
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    coachmark: {
      backgroundColor: colors.primary.default,
      borderRadius: 8,
      padding: 20,
    },
    progress: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    actions: {
      flexDirection: 'row',
    },
    actionButtonPrimary: {
      flex: 0.5,
      borderWidth: 1,
      borderColor: colors.primary.inverse,
      marginRight: 4,
    },
    actionButtonSecondary: {
      flex: 0.5,
      backgroundColor: colors.primary.inverse,
      marginLeft: 4,
    },
    title: {
      ...fontStyles.bold,
      color: colors.primary.inverse,
      fontSize: 18,
      alignSelf: 'center',
    },
    triangle: {
      width: 0,
      height: 0,
      backgroundColor: importedColors.transparent,
      borderStyle: 'solid',
      borderLeftWidth: 15,
      borderRightWidth: 15,
      borderBottomWidth: 12,
      borderLeftColor: importedColors.transparent,
      borderRightColor: importedColors.transparent,
      borderBottomColor: colors.primary.default,
      position: 'absolute',
    },
    triangleDown: {
      width: 0,
      height: 0,
      backgroundColor: importedColors.transparent,
      borderStyle: 'solid',
      borderLeftWidth: 15,
      borderRightWidth: 15,
      borderTopWidth: 12,
      borderLeftColor: importedColors.transparent,
      borderRightColor: importedColors.transparent,
      borderTopColor: colors.primary.default,
      position: 'absolute',
    },
    progressButton: {
      width: 75,
      height: 45,
      padding: 5,
    },
    leftProgessButton: {
      left: 0,
    },
    rightProgessButton: {
      right: 0,
    },
    topCenter: {
      marginBottom: 10,
      bottom: -2,
      alignItems: 'center',
    },
    topLeft: {
      marginBottom: 10,
      bottom: -2,
      alignItems: 'flex-start',
      marginLeft: 30,
    },
    topRight: {
      marginBottom: 10,
      bottom: -2,
      alignItems: 'flex-end',
      marginRight: 38,
    },
    topLeftCorner: {
      marginBottom: 10,
      bottom: -2,
      alignItems: 'flex-start',
      marginLeft: 12,
    },
    topRightCorner: {
      marginBottom: 10,
      bottom: -2,
      alignItems: 'flex-end',
      marginRight: 12,
    },
    bottomCenter: {
      marginBottom: 10,
      top: -2,
      alignItems: 'center',
    },
    bottomLeft: {
      marginBottom: 10,
      top: -2,
      alignItems: 'flex-start',
      marginLeft: 60,
    },
    bottomLeftCorner: {
      marginBottom: 10,
      top: -2,
      alignItems: 'flex-start',
      marginLeft: 30,
    },
    bottomRight: {
      marginBottom: 10,
      top: -2,
      alignItems: 'flex-end',
      marginRight: 90,
    },
    circle: {
      width: 6,
      height: 6,
      borderRadius: 6 / 2,
      backgroundColor: colors.primary.inverse,
      opacity: 0.4,
      margin: 3,
    },
    solidCircle: {
      opacity: 1,
    },
    progessContainer: {
      flexDirection: 'row',
      alignSelf: 'center',
    },
    stepCounter: {
      ...typography.BodyMD,
      fontFamily: getFontFamily(TextVariant.BodyMD),
      color: colors.info.inverse,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });

export default class Coachmark extends PureComponent<CoachmarkProps, CoachmarkState> {

  state = {
    ready: false,
  };

  opacity = new Animated.Value(0);

  componentDidMount = () => {
    Animated.timing(this.opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  };

  componentWillUnmount = () => {
    Animated.timing(this.opacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  };

  /**
   * Calls props onNext
   */
  onNext = () => {
    const { onNext } = this.props;
    onNext && onNext();
  };

  /**
   * Calls props onBack
   */
  onBack = () => {
    const { onBack } = this.props;
    onBack && onBack();
  };

  getStyles = () => {
    const colors = this.context.colors || mockTheme.colors;
    return createStyles(colors);
  };

  /**
   * Gets top indicator style according to 'topIndicatorPosition'
   *
   * @param {string} topIndicatorPosition - Indicator position
   * @returns {Object} - Corresponding style object
   */
  getIndicatorStyle = (topIndicatorPosition: string) => {
    const styles = this.getStyles();

    const positions = {
      topCenter: styles.topCenter,
      topLeft: styles.topLeft,
      topRight: styles.topRight,
      topLeftCorner: styles.topLeftCorner,
      topRightCorner: styles.topRightCorner,
      [undefined]: styles.topCenter,
    };
    return positions[topIndicatorPosition];
  };

  /**
   * Gets top indicator style according to 'bottomIndicatorPosition'
   *
   * @param {string} bottomIndicatorPosition - Indicator position
   * @returns {Object} - Corresponding style object
   */
  getBotttomIndicatorStyle = (bottomIndicatorPosition: string) => {
    const styles = this.getStyles();

    const positions = {
      bottomCenter: styles.bottomCenter,
      bottomLeft: styles.bottomLeft,
      bottomLeftCorner: styles.bottomLeftCorner,
      bottomRight: styles.bottomRight,
      [undefined]: styles.bottomCenter,
    };
    return positions[bottomIndicatorPosition];
  };

  /**
   * Returns progress bar, back and next buttons. According to currentStep
   *
   * @returns {Object} - Corresponding view object
   */
  renderProgressButtons = () => {
    const { currentStep } = this.props;
    const styles = this.getStyles();
    return (
      <View style={styles.progress}>
        <View style={styles.progessContainer}>
          {currentStep !== 0 && (
            <Text style={styles.stepCounter}>{currentStep}/6</Text>
          )}
        </View>

        <StyledButton
          containerStyle={[styles.progressButton, styles.rightProgessButton]}
          type={'inverse'}
          onPress={this.onNext}
          testID={OnboardingWizardModalSelectorsIDs.GOT_IT_BUTTON}
        >
          {strings('onboarding_wizard_new.coachmark.progress_next')}
        </StyledButton>
      </View>
    );
  };

  /**
   * Returns horizontal action buttons
   *
   * @returns {Object} - Corresponding view object
   */
  renderActionButtons = () => {
    const styles = this.getStyles();

    return (
      <View style={styles.actions}>
        <Button
          size={ButtonSize.Sm}
          width={ButtonWidthTypes.Full}
          onPress={this.onBack}
          label={strings('onboarding_wizard_new.coachmark.action_back')}
          style={styles.actionButtonPrimary}
          variant={ButtonVariants.Primary}
          testID={OnboardingWizardModalSelectorsIDs.NO_THANKS_BUTTON}
        />

        <Button
          size={ButtonSize.Sm}
          width={ButtonWidthTypes.Full}
          onPress={this.onNext}
          label={strings('onboarding_wizard_new.coachmark.action_next')}
          variant={ButtonVariants.Secondary}
          style={styles.actionButtonSecondary}
          testID={OnboardingWizardModalSelectorsIDs.TAKE_TOUR_BUTTON}
        />
      </View>
    );
  };

  render() {
    const {
      content,
      title,
      topIndicatorPosition,
      bottomIndicatorPosition,
      action,
      currentStep,
      onClose,
    } = this.props;
    const style = this.props.style || {};
    const coachmarkStyle = this.props.coachmarkStyle || {};
    const styles = this.getStyles();

    return (
      <Animated.View style={[style, { opacity: this.opacity }]}>
        {topIndicatorPosition && (
          <View style={this.getIndicatorStyle(topIndicatorPosition)}>
            <View style={styles.triangle} />
          </View>
        )}
        <View style={[styles.coachmark, coachmarkStyle]}>
          <View style={styles.titleContainer}>
            {currentStep ? (
              <ButtonIcon
                iconName={IconName.Arrow2Left}
                size={ButtonIconSizes.Sm}
                onPress={this.onBack}
                iconColor={IconColor.Inverse}
                testID={OnboardingWizardModalSelectorsIDs.BACK_BUTTON}
              />
            ) : (
              <View />
            )}
            <Text style={styles.title}>{title}</Text>
            <ButtonIcon
              iconName={IconName.Close}
              size={ButtonIconSizes.Sm}
              onPress={onClose}
              iconColor={IconColor.Inverse}
            />
          </View>
          {content}
          {action ? this.renderActionButtons() : this.renderProgressButtons()}
        </View>
        {bottomIndicatorPosition && (
          <View style={this.getBotttomIndicatorStyle(bottomIndicatorPosition)}>
            <View style={styles.triangleDown} />
          </View>
        )}
      </Animated.View>
    );
  }
}

Coachmark.contextType = ThemeContext;
