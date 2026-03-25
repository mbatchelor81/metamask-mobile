import React, { PureComponent } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { strings } from '../../../../../locales/i18n';
import { getNavigationOptionsTitle } from '../../../UI/Navbar';
import { connect } from 'react-redux';
import AddressList from '../../confirmations/legacy/SendFlow/AddressList';
import StyledButton from '../../../UI/StyledButton';
import Engine from '../../../../core/Engine';
import ActionSheet from '@metamask/react-native-actionsheet';
import { mockTheme, ThemeContext } from '../../../../util/theme';
import { selectChainId } from '../../../../selectors/networkController';
import Routes from '../../../../../app/constants/navigation/Routes';

import { ContactsViewSelectorIDs } from '../../../../../e2e/selectors/Settings/Contacts/ContacsView.selectors';
import { selectAddressBook } from '../../../../selectors/addressBookController';
import { RootState } from '../../../../reducers';

const createStyles = (colors: any) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
      marginTop: 16,
    },
    addContact: {
      marginHorizontal: 24,
      marginBottom: 16,
    },
  });

const EDIT = 'edit';
const ADD = 'add';

/**
 * View that contains app information
 */
interface ContactsProps {
  addressBook: Record<string, Record<string, { name: string; address: string; memo?: string }>>;
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    setOptions: (options: Record<string, unknown>) => void;
  };
  chainId: string;
}

interface ContactsState {
  reloadAddressList: boolean;
}

class Contacts extends PureComponent<ContactsProps, ContactsState> {
  state: ContactsState = {
    reloadAddressList: false,
  };

  actionSheet: any;
  contactAddressToRemove: string | undefined;

  updateNavBar = () => {
    const { navigation } = this.props;
    const colors = (this.context as any).colors || mockTheme.colors;
    navigation.setOptions(
      getNavigationOptionsTitle(
        strings('app_settings.contacts_title'),
        navigation as any,
        false,
        colors,
      ),
    );
  };

  componentDidMount = () => {
    this.updateNavBar();
  };

  componentDidUpdate = (prevProps: ContactsProps) => {
    this.updateNavBar();
    const { chainId } = this.props;
    if (
      prevProps.addressBook &&
      this.props.addressBook &&
      JSON.stringify(prevProps.addressBook[chainId]) !==
        JSON.stringify(this.props.addressBook[chainId])
    )
      this.updateAddressList();
  };

  updateAddressList = () => {
    this.setState({ reloadAddressList: true });
    setTimeout(() => {
      this.setState({ reloadAddressList: false });
    }, 100);
  };

  onAddressLongPress = (address: string) => {
    this.contactAddressToRemove = address;
    this.actionSheet && this.actionSheet.show();
  };

  deleteContact = () => {
    const { AddressBookController } = Engine.context;
    const { chainId } = this.props;
    AddressBookController.delete(chainId as `0x${string}`, this.contactAddressToRemove as string);
    this.updateAddressList();
  };

  onAddressPress = (address: string) => {
    this.props.navigation.navigate('ContactForm', {
      mode: EDIT,
      editMode: EDIT,
      address,
      onDelete: () => this.updateAddressList(),
    });
  };

  goToAddContact = () => {
    this.props.navigation.navigate('ContactForm', { mode: ADD });
  };

  createActionSheetRef = (ref: any) => {
    this.actionSheet = ref;
  };

  onIconPress = () => {
    const { navigation } = this.props;
    navigation.navigate(Routes.MODAL.ROOT_MODAL_FLOW, {
      screen: Routes.SHEET.AMBIGUOUS_ADDRESS,
    });
  };

  render = () => {
    const { reloadAddressList } = this.state;
    const colors = (this.context as any).colors || mockTheme.colors;
    const themeAppearance = (this.context as any).themeAppearance;
    const styles = createStyles(colors);
    const { chainId } = this.props;

    return (
      <SafeAreaView
        style={styles.wrapper}
        testID={ContactsViewSelectorIDs.CONTAINER}
      >
        <AddressList
          chainId={chainId}
          inputSearch={''}
          onlyRenderAddressBook
          reloadAddressList={reloadAddressList}
          onAccountPress={this.onAddressPress}
          onIconPress={this.onIconPress}
          onAccountLongPress={this.onAddressLongPress}
        />
        <StyledButton
          type={'confirm'}
          containerStyle={styles.addContact}
          onPress={this.goToAddContact}
          testID={ContactsViewSelectorIDs.ADD_BUTTON}
        >
          {strings('address_book.add_contact')}
        </StyledButton>
        <ActionSheet
          ref={this.createActionSheetRef}
          title={strings('address_book.delete_contact')}
          options={[
            strings('address_book.delete'),
            strings('address_book.cancel'),
          ]}
          cancelButtonIndex={1}
          destructiveButtonIndex={0}
          // eslint-disable-next-line react/jsx-no-bind
          onPress={(index: any) => (index === 0 ? this.deleteContact() : null)}
          theme={themeAppearance}
        />
      </SafeAreaView>
    );
  };
}

Contacts.contextType = ThemeContext;

const mapStateToProps = (state: RootState) => ({
  addressBook: selectAddressBook(state),
  chainId: selectChainId(state),
});

export default connect(mapStateToProps)(Contacts);
