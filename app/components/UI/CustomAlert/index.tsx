import React, { PureComponent } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Modal from 'react-native-modal';
import StyledButton from '../StyledButton';
import { fontStyles } from '../../../styles/common';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface CustomAlertProps {
  headerStyle?: any;
  headerContent?: any;
  titleText?: string;
  bodyContent?: React.ReactElement;
  buttonText?: string;
  onPress?: (...args: any[]) => any;
  isVisible?: boolean;
  onBackdropPress?: (...args: any[]) => any;
  onSwipeComplete?: (...args: any[]) => any;
  swipeDirection?: string;
  children?: any;
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    modal: {
      padding: 20,
    },
    content: {
      backgroundColor: colors.background.default,
      borderRadius: 16,
    },
    header: {
      paddingVertical: 15,
      height: 130,
      alignItems: 'center',
      borderTopEndRadius: 16,
      borderTopLeftRadius: 16,
    },
    body: {
      paddingVertical: 20,
      paddingHorizontal: 35,
    },
    title: {
      textAlign: 'center',
      fontSize: 16,
      ...fontStyles.bold,
      marginBottom: 15,
    },
    footer: {
      padding: 20,
      paddingTop: 10,
    },
  });

/**
/* PureComponent that renders our custom alerts, which contains
/* a header with an image, body and footer with a button
*/
export default class CustomAlert extends PureComponent<CustomAlertProps> {

  render() {
    const colors = this.context.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <Modal
        style={styles.modal}
        isVisible={this.propTypes}
        onBackButtonPress={this.props.onPress}
        {...this.props}
        backdropColor={colors.overlay.default}
        backdropOpacity={1}
      >
        <View style={styles.content}>
          <View style={[styles.header, this.props.headerStyle]}>
            {this.props.headerContent}
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>{this.props.titleText}</Text>
            {this.props.children}
          </View>
          <View style={styles.footer}>
            <StyledButton type={'confirm'} onPress={this.props.onPress}>
              {this.props.buttonText}
            </StyledButton>
          </View>
        </View>
      </Modal>
    );
  }
}

CustomAlert.contextType = ThemeContext;
