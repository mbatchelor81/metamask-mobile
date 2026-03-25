import React from 'react';
import { View, StyleSheet, Image, ViewStyle, StyleProp, ViewProps } from 'react-native';
import Text from '../../../Base/Text';
import { useTheme } from '../../../../util/theme';

interface HeaderProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  savings?: boolean;
  children?: React.ReactNode;
}

interface BodyProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
}

interface HeaderTextProps {
  style?: StyleProp<ViewStyle>;
  [key: string]: unknown;
}

interface SeparatorProps {
  style?: StyleProp<ViewStyle>;
}

interface QuotesSummaryComponent extends React.FC<ViewProps> {
  Body: React.FC<BodyProps>;
  Header: React.FC<HeaderProps>;
  HeaderText: React.FC<HeaderTextProps>;
  Separator: React.FC<SeparatorProps>;
}

// eslint-disable-next-line import/no-commonjs
const piggyBank = require('../../../../images/piggybank.png');

const createStyles = (colors: Record<string, Record<string, string>>) =>
  StyleSheet.create({
    header: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderColor: colors.primary.default,
      borderTopRightRadius: 10,
      borderTopLeftRadius: 10,
      backgroundColor: colors.primary.muted,
    },
    headerWithPiggy: {
      paddingLeft: 15 + 32 + 10,
    },
    piggyBar: {
      position: 'absolute',
      top: -1,
      left: 21,
      height: 0,
      width: 19,
      borderTopWidth: 1,
      borderColor: colors.primary.muted,
    },
    piggyBank: {
      position: 'absolute',
      top: -12,
      left: 15,
      width: 32,
      height: 44,
    },
    headerText: {
      color: colors.primary.default,
    },
    body: {
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderWidth: 1,
      borderTopWidth: 0,
      borderColor: colors.primary.default,
      borderBottomRightRadius: 10,
      borderBottomLeftRadius: 10,
    },
    separator: {
      height: 0,
      width: '100%',
      borderTopWidth: 1,
      marginVertical: 6,
      borderTopColor: colors.border.muted,
    },
  });

const QuotesSummary: QuotesSummaryComponent = ((props: ViewProps) => <View {...props} />) as QuotesSummaryComponent;

const Header: React.FC<HeaderProps> = ({ style, savings, children, ...props }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <View
      style={[styles.header, savings && styles.headerWithPiggy, style]}
      {...props}
    >
      {savings && (
        <>
          <View style={styles.piggyBar} />
          <Image style={styles.piggyBank} source={piggyBank} />
        </>
      )}
      {children}
    </View>
  );
};

const Body: React.FC<BodyProps> = ({ style, ...props }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={[styles.body, style]} {...props} />;
};
const HeaderText: React.FC<HeaderTextProps> = ({ style, ...props }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <Text style={[styles.headerText, style]} {...props} />;
};
const Separator: React.FC<SeparatorProps> = ({ style }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return <View style={[styles.separator, style]} />;
};

QuotesSummary.Body = Body;
QuotesSummary.Header = Header;
QuotesSummary.HeaderText = HeaderText;
QuotesSummary.Separator = Separator;

export default QuotesSummary;
