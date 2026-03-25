import React from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { fontStyles, baseStyles } from '../../../styles/common';
import AntIcon from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Identicon from '../Identicon';
import {
  renderShortAddress,
  renderSlightlyLongAddress,
  isENS,
  getLabelTextByAddress,
} from '../../../util/address';
import { strings } from '../../../../locales/i18n';
import { hasZeroWidthPoints } from '../../../util/confusables';
import { useTheme } from '../../../util/theme';
import AddToAddressBookWrapper from '../AddToAddressBookWrapper/AddToAddressBookWrapper';
import { SendViewSelectorsIDs } from '../../../../e2e/selectors/SendFlow/SendView.selectors';
import Text, {
  TextVariant,
} from '../../../component-library/components/Texts/Text';

const createStyles = (colors: any, layout = 'horizontal') => {
  const isVerticalLayout = layout === 'vertical';
  return StyleSheet.create({
    wrapper: {
      flexDirection: isVerticalLayout ? 'column' : 'row',
      marginHorizontal: 8,
      minHeight: isVerticalLayout ? 82 : 52,
    },
    marginedWrapper: {
      marginTop: 8,
    },
    selectWrapper: {
      flex: 1,
      marginLeft: isVerticalLayout ? 0 : 8,
      paddingHorizontal: 10,
      minHeight: 52,
      flexDirection: 'row',
      borderWidth: 1,
      borderRadius: 8,
      marginVertical: 8,
    },
    inputWrapper: {
      flex: 1,
      marginLeft: isVerticalLayout ? 0 : 8,
      padding: 10,
      minHeight: 52,
      flexDirection: 'row',
      borderWidth: 1,
      borderRadius: 8,
      marginTop: 8,
      borderColor: colors.border.default,
    },
    input: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    identiconWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addressToInformation: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    identIcon: { marginRight: 8 },
    exclamation: {
      backgroundColor: colors.background.default,
      borderRadius: 12,
      position: 'absolute',
      bottom: 8,
      left: 20,
    },
    address: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginHorizontal: 8,
    },
    addressWrapper: { flexDirection: 'row' },
    textAddress: {
      ...fontStyles.normal,
      color: colors.text.default,
      fontSize: 14,
    },
    accountNameLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    accountNameLabelText: {
      marginLeft: 4,
      textAlign: 'center',
      paddingHorizontal: 8,
      color: colors.text.alternative,
      borderWidth: 1,
      borderRadius: 8,
      borderColor: colors.border.default,
    },
    textBalance: {
      ...fontStyles.normal,
      fontSize: 12,
      color: colors.text.alternative,
    },
    label: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '15%',
    },
    labelText: {
      ...fontStyles.normal,
      color: colors.text.default,
      fontSize: 16,
    },
    textInput: {
      ...fontStyles.normal,
      paddingLeft: 0,
      paddingRight: 6,
      color: colors.text.default,
      flex: 1,
    },
    addressReadyWrapper: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      flex: 1,
      alignItems: 'center',
    },
    checkIcon: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingRight: 8,
    },
    inputIcon: {
      flexDirection: 'column',
      alignItems: 'center',
    },
    inputIconOpaque: {
      color: colors.icon.default,
    },
    iconHighlighted: {
      color: colors.primary.default,
    },
    borderOpaque: {
      borderColor: colors.border.default,
    },
    borderHighlighted: {
      borderColor: colors.primary.default,
    },
    iconWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dropdownIconWrapper: {
      height: 23,
      width: 23,
    },
    dropdownIcon: {
      alignSelf: 'center',
    },
    checkIconWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkAddress: {
      flex: 0.9,
      // maxWidth: '90%'
    },
    toInputWrapper: {
      flexDirection: 'row',
    },
    checkCleanWrapper: { flexDirection: 'row', alignItems: 'center' },
    toAddressTextWrapper: {
      height: 25,
    },
  });
};

interface AddressNameProps {
  toAddressName?: string;
  confusableCollection?: string[];
}

const AddressName = ({ toAddressName, confusableCollection = [] }: AddressNameProps): React.JSX.Element => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  if (confusableCollection.length) {
    const texts = toAddressName?.split('').map((char, index) => {
      // if text has a confusable highlight it red
      if (confusableCollection.includes(char)) {
        // if the confusable is zero width, replace it with `?`
        const replacement = hasZeroWidthPoints(char) ? '?' : char;
        return (
          <Text red key={index}>
            {replacement}
          </Text>
        );
      }
      return (
        <Text black key={index}>
          {char}
        </Text>
      );
    });
    return (
      <Text style={styles.textAddress} numberOfLines={1}>
        {texts}
      </Text>
    );
  }
  return (
    <View style={styles.accountNameLabel}>
      <Text style={styles.textAddress} numberOfLines={1}>
        {toAddressName}
      </Text>
    </View>
  );
};

interface AddressToProps {
  addressToReady?: boolean;
  highlighted?: boolean;
  inputRef?: React.RefObject<TextInput>;
  toSelectedAddress?: string;
  onToSelectedAddressChange?: (text: string) => void;
  onScan?: () => void;
  onClear?: () => void;
  toAddressName?: string;
  onInputFocus?: () => void;
  onSubmit?: () => void;
  onInputBlur?: () => void;
  inputWidth?: StyleProp<ViewStyle>;
  confusableCollection?: string[];
  displayExclamation?: boolean;
  isConfirmScreen?: boolean;
  isFromAddressBook?: boolean;
  layout?: string;
}

export const AddressTo = (props: AddressToProps): React.JSX.Element => {
  const {
    addressToReady,
    highlighted,
    inputRef,
    toSelectedAddress,
    onToSelectedAddressChange,
    onScan,
    onClear,
    toAddressName,
    onInputFocus,
    onSubmit,
    onInputBlur,
    inputWidth,
    confusableCollection,
    displayExclamation,
    isConfirmScreen = false,
    isFromAddressBook = false,
    layout = 'horizontal',
  } = props;
  const { colors, themeAppearance } = useTheme();
  const styles = createStyles(colors, layout);

  const isInputFilled = toSelectedAddress?.length;

  if (isConfirmScreen) {
    const wrapperStyles: StyleProp<ViewStyle>[] = [styles.wrapper];
    if (layout === 'vertical') {
      wrapperStyles.push(styles.marginedWrapper);
    }
    return (
      <View style={wrapperStyles}>
        <View style={styles.label}>
          <Text style={styles.labelText}>To:</Text>
        </View>
        <View
          style={[
            styles.selectWrapper,
            highlighted ? styles.borderHighlighted : styles.borderOpaque,
          ]}
        >
          <AddToAddressBookWrapper address={toSelectedAddress}>
            <View style={styles.addressToInformation}>
              <Identicon address={toSelectedAddress} diameter={30} />
              {displayExclamation && (
                <View style={styles.exclamation}>
                  <FontAwesome
                    color={colors.error.default}
                    name="exclamation-circle"
                    size={14}
                  />
                </View>
              )}
              <View style={styles.toInputWrapper}>
                <View style={[styles.address, styles.checkAddress]}>
                  {toAddressName && (
                    <AddressName
                      toAddressName={toAddressName}
                      confusableCollection={confusableCollection}
                    />
                  )}
                  <View style={styles.addressWrapper}>
                    <Text
                      style={
                        toAddressName ? styles.textBalance : styles.textAddress
                      }
                      numberOfLines={1}
                    >
                      {renderShortAddress(toSelectedAddress)}
                    </Text>
                    <View
                      style={
                        (styles.checkIconWrapper,
                        isENS(toAddressName) ? {} : { paddingTop: 2 })
                      }
                    >
                      <AntIcon
                        name="check"
                        color={colors.success.default}
                        size={15}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </AddToAddressBookWrapper>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.label}>
        <Text style={styles.labelText}>To:</Text>
      </View>
      {!addressToReady ? (
        <View
          style={[
            styles.selectWrapper,
            highlighted ? styles.borderHighlighted : styles.borderOpaque,
          ]}
        >
          <View style={styles.input}>
            <TextInput
              ref={inputRef}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={onToSelectedAddressChange}
              placeholder={strings('transactions.address_to_placeholder')}
              placeholderTextColor={colors.text.muted}
              spellCheck={false}
              style={[styles.textInput, inputWidth]}
              numberOfLines={1}
              onFocus={onInputFocus}
              autoFocus
              onBlur={onInputBlur}
              onSubmitEditing={onSubmit}
              value={toSelectedAddress}
              testID={SendViewSelectorsIDs.ADDRESS_INPUT}
              keyboardAppearance={themeAppearance}
            />
          </View>
          {!isInputFilled ? (
            <TouchableOpacity onPress={onScan} style={styles.iconWrapper}>
              <AntIcon
                name="scan1"
                size={20}
                style={[
                  styles.inputIcon,
                  highlighted ? styles.iconHighlighted : styles.inputIconOpaque,
                ]}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onClear}
              style={styles.iconWrapper}
              testID={SendViewSelectorsIDs.ADDRESS_REMOVE_BUTTON}
            >
              <AntIcon
                name="close"
                size={20}
                style={[styles.inputIcon, styles.inputIconOpaque]}
              />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View
          style={[
            styles.selectWrapper,
            highlighted ? styles.borderHighlighted : styles.borderOpaque,
          ]}
        >
          <View style={styles.addressToInformation}>
            <AddToAddressBookWrapper address={toSelectedAddress}>
              <Identicon
                address={toSelectedAddress}
                diameter={30}
                customStyle={styles.identIcon}
              />
              {displayExclamation && (
                <View style={styles.exclamation}>
                  <FontAwesome
                    color={colors.error.default}
                    name="exclamation-circle"
                    size={14}
                  />
                </View>
              )}
            </AddToAddressBookWrapper>
            <View style={styles.addressReadyWrapper}>
              {isFromAddressBook ? (
                <View style={styles.toInputWrapper}>
                  <View style={[styles.address, styles.checkAddress]}>
                    <AddressName
                      toAddressName={toAddressName}
                      confusableCollection={confusableCollection}
                    />

                    <View style={styles.addressWrapper}>
                      <Text
                        style={
                          isENS(toAddressName)
                            ? styles.textBalance
                            : styles.textAddress
                        }
                        numberOfLines={1}
                      >
                        {renderShortAddress(toSelectedAddress)}
                      </Text>
                      <View
                        style={
                          (styles.checkIconWrapper,
                          isENS(toAddressName) ? {} : { paddingTop: 2 })
                        }
                      >
                        <AntIcon
                          name="check"
                          color={colors.success.default}
                          size={15}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              ) : isENS(toAddressName) ? (
                <TextInput
                  ref={inputRef}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={onToSelectedAddressChange}
                  placeholder={strings('transactions.address_to_placeholder')}
                  placeholderTextColor={colors.text.muted}
                  spellCheck={false}
                  style={styles.textInput}
                  numberOfLines={1}
                  autoFocus
                  onFocus={onInputFocus}
                  onBlur={onInputBlur}
                  onSubmitEditing={onSubmit}
                  value={toAddressName}
                  testID={SendViewSelectorsIDs.ADDRESS_INPUT}
                  keyboardAppearance={themeAppearance}
                />
              ) : (
                <AddToAddressBookWrapper address={toSelectedAddress}>
                  <View style={styles.toAddressTextWrapper}>
                    <Text style={styles.textInput} numberOfLines={1}>
                      {toSelectedAddress
                        ? renderSlightlyLongAddress(toSelectedAddress, 4, 9)
                        : ''}
                    </Text>
                  </View>
                </AddToAddressBookWrapper>
              )}
              {!!onClear && !isFromAddressBook && (
                <AntIcon
                  name="checkcircle"
                  color={colors.success.default}
                  size={15}
                  style={styles.checkIcon}
                />
              )}
            </View>
          </View>
          {!!onClear && (
            <View style={styles.checkCleanWrapper}>
              <TouchableOpacity
                onPress={onClear}
                style={styles.iconWrapper}
                testID={SendViewSelectorsIDs.ADDRESS_REMOVE_BUTTON}
              >
                <AntIcon
                  name="close"
                  size={20}
                  style={[styles.inputIcon, styles.inputIconOpaque]}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

interface AddressFromProps {
  highlighted?: boolean;
  onPressIcon?: () => void;
  fromAccountAddress?: string;
  fromAccountName?: string;
  fromAccountBalance?: string;
  layout?: string;
}

export const AddressFrom = (props: AddressFromProps): React.JSX.Element => {
  const {
    highlighted,
    onPressIcon,
    fromAccountName,
    fromAccountBalance,
    fromAccountAddress,
    layout = 'horizontal',
  } = props;
  const { colors } = useTheme();
  const styles = createStyles(colors, layout);

  return (
    <View style={styles.wrapper}>
      <View style={styles.label}>
        <Text style={styles.labelText}>From:</Text>
      </View>
      <View
        style={[
          styles.inputWrapper,
          highlighted ? styles.borderHighlighted : styles.borderOpaque,
        ]}
      >
        <View style={styles.identiconWrapper}>
          <Identicon address={fromAccountAddress} diameter={30} />
        </View>
        <View style={[baseStyles.flexGrow, styles.address]}>
          <View style={styles.accountNameLabel}>
            <Text style={styles.textAddress}>{fromAccountName}</Text>
          </View>
          <Text style={styles.textBalance}>{`${strings(
            'transactions.address_from_balance',
          )} ${fromAccountBalance}`}</Text>
        </View>

        {!!onPressIcon && (
          <TouchableOpacity onPress={onPressIcon} style={styles.iconWrapper}>
            <View style={styles.dropdownIconWrapper}>
              <FontAwesome
                name={'caret-down'}
                size={20}
                style={[
                  styles.dropdownIcon,
                  highlighted ? styles.iconHighlighted : styles.inputIconOpaque,
                ]}
              />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
