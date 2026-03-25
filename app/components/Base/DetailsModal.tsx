import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
  ViewProps,
  TouchableOpacityProps,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { fontStyles } from '../../styles/common';
import Text from './Text';
import { useTheme } from '../../util/theme';
import { TransactionDetailsModalSelectorsIDs } from '../../../e2e/selectors/Transactions/TransactionDetailsModal.selectors';
import { Colors } from '../../util/theme/models';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    modalContainer: {
      width: '100%',
      backgroundColor: colors.background.default,
      borderRadius: 10,
    },
    modalView: {
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border.muted,
      flexDirection: 'row',
      paddingHorizontal: 16,
    },
    title: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      marginVertical: 12,
      marginHorizontal: 24,
      color: colors.text.default,
      ...fontStyles.bold,
    },
    closeIcon: { paddingTop: 4, position: 'absolute' as const, right: 16 },
    body: {
      paddingHorizontal: 15,
    },
    section: {
      paddingVertical: 16,
      flexDirection: 'row',
    },
    sectionBorderBottom: {
      borderBottomColor: colors.border.muted,
      borderBottomWidth: 1,
    },
    column: {
      flex: 1,
    },
    columnEnd: {
      alignItems: 'flex-end' as const,
    },
    sectionTitle: {
      ...fontStyles.normal,
      fontSize: 10,
      color: colors.text.alternative,
      marginBottom: 8,
    },
  });

interface DetailsModalProps {
  children?: React.ReactNode;
}

interface StyledViewProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
}

interface DetailsModalSectionProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  borderBottom?: boolean;
}

interface DetailsModalColumnProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  end?: boolean;
}

interface DetailsModalComponent extends React.FC<DetailsModalProps> {
  Header: React.FC<StyledViewProps>;
  Title: React.FC<StyledViewProps>;
  CloseIcon: React.FC<TouchableOpacityProps & { style?: StyleProp<ViewStyle> }>;
  Body: React.FC<StyledViewProps>;
  Section: React.FC<DetailsModalSectionProps>;
  SectionTitle: React.FC<StyledViewProps>;
  Column: React.FC<DetailsModalColumnProps>;
}

const DetailsModal: DetailsModalComponent = ({
  children,
}: DetailsModalProps): React.JSX.Element => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.modalView}>
      <View style={styles.modalContainer}>{children}</View>
    </View>
  );
};

const DetailsModalHeader: React.FC<StyledViewProps> = ({
  style,
  ...props
}: StyledViewProps): React.JSX.Element => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <View style={[styles.header, style]} {...props} />;
};
const DetailsModalTitle: React.FC<StyledViewProps> = ({
  style,
  ...props
}: StyledViewProps): React.JSX.Element => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Text
      testID={TransactionDetailsModalSelectorsIDs.TITLE}
      style={[styles.title, style]}
      {...props}
    />
  );
};
const DetailsModalCloseIcon: React.FC<
  TouchableOpacityProps & { style?: StyleProp<ViewStyle> }
> = ({ style, ...props }): React.JSX.Element => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <TouchableOpacity
      style={[styles.closeIcon, style]}
      {...props}
      testID={TransactionDetailsModalSelectorsIDs.CLOSE_ICON}
    >
      <Ionicons color={colors.text.default} name={'close'} size={38} />
    </TouchableOpacity>
  );
};
const DetailsModalBody: React.FC<StyledViewProps> = ({
  style,
  ...props
}: StyledViewProps): React.JSX.Element => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      testID={TransactionDetailsModalSelectorsIDs.BODY}
      style={[styles.body, style]}
      {...props}
    />
  );
};
const DetailsModalSection: React.FC<DetailsModalSectionProps> = ({
  style,
  borderBottom,
  ...props
}: DetailsModalSectionProps): React.JSX.Element => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View
      style={[styles.section, borderBottom && styles.sectionBorderBottom]}
      {...props}
    />
  );
};
const DetailsModalSectionTitle: React.FC<StyledViewProps> = ({
  style,
  ...props
}: StyledViewProps): React.JSX.Element => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return <Text style={[styles.sectionTitle, style]} {...props} />;
};
const DetailsModalColumn: React.FC<DetailsModalColumnProps> = ({
  style,
  end,
  ...props
}: DetailsModalColumnProps): React.JSX.Element => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={[styles.column, end && styles.columnEnd, style]} {...props} />
  );
};

DetailsModal.Header = DetailsModalHeader;
DetailsModal.Title = DetailsModalTitle;
DetailsModal.CloseIcon = DetailsModalCloseIcon;
DetailsModal.Body = DetailsModalBody;
DetailsModal.Section = DetailsModalSection;
DetailsModal.SectionTitle = DetailsModalSectionTitle;
DetailsModal.Column = DetailsModalColumn;

export default DetailsModal;
