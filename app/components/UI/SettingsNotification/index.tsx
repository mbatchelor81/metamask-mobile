import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../util/theme';

interface SettingsNotificationProps {
  style?: Record<string, any>;
  isWarning?: boolean;
  isNotification?: boolean;
  children?: React.ReactNode;
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    menuItemWarning: {
      flex: 1,
      alignSelf: 'center',
      justifyContent: 'flex-end',
      flexDirection: 'row',
      marginRight: 24,
    },
    wrapper: {
      padding: 12,
      borderRadius: 10,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      marginTop: 10,
    },
    icon: {
      marginRight: 4,
    },
    red: {
      backgroundColor: colors.error.muted,
    },
    normal: {
      backgroundColor: colors.background.alternative,
    },
    check: {
      color: colors.success.default,
    },
  });

const WarningIcon = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Icon
      style={styles.icon}
      size={16}
      color={colors.error.default}
      name="exclamation-triangle"
    />
  );
};
const CheckIcon = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <MaterialIcon
      style={[styles.icon, styles.check]}
      size={16}
      name="check-circle"
    />
  );
};

const SettingsNotification = ({
  style,
  isWarning,
  isNotification,
  children,
}: SettingsNotificationProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[
        isNotification
          ? Object.assign({}, styles.menuItemWarning, style)
          : styles.wrapper,
        isNotification ? null : isWarning ? styles.red : styles.normal,
      ]}
    >
      {isWarning ? <WarningIcon /> : <CheckIcon />}
      {children}
    </View>
  );
};

export default SettingsNotification;
