import React from 'react';
import { StyleSheet, View, ViewStyle, ImageStyle, StyleProp } from 'react-native';
import AssetIcon from '../AssetIcon';
import Identicon from '../Identicon';
import isUrl from 'is-url';
import { connect, useSelector } from 'react-redux';
import { selectTokenList } from '../../../selectors/tokenListController';
import { selectIsIpfsGatewayEnabled } from '../../../selectors/preferencesController';
import { isIPFSUri } from '../../../util/general';

const styles = StyleSheet.create({
  itemLogoWrapper: {
    width: 50,
    height: 50,
  },
  roundImage: {
    overflow: 'hidden',
    borderRadius: 25,
  },
});

interface TokenImageAsset {
  image?: string;
  address?: string;
}

interface TokenImageProps {
  asset?: TokenImageAsset;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ImageStyle>;
  tokenList?: Record<string, { iconUrl?: string }>;
}

const TokenImage = ({ asset, containerStyle, iconStyle, tokenList = {} }: TokenImageProps): React.JSX.Element => {
  const isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);

  const assetImage = isUrl(asset?.image ?? '') ? asset!.image : null;
  const iconUrl =
    assetImage ||
    tokenList[asset?.address ?? '']?.iconUrl ||
    tokenList[asset?.address?.toLowerCase() ?? '']?.iconUrl ||
    '';

  const isIpfsDisabledAndUriIsIpfs =
    !isIpfsGatewayEnabled && isIPFSUri(iconUrl);

  return (
    <View style={[styles.itemLogoWrapper, containerStyle, styles.roundImage]}>
      {iconUrl || !isIpfsDisabledAndUriIsIpfs ? (
        <AssetIcon
          address={asset?.address}
          logo={iconUrl}
          customStyle={iconStyle}
        />
      ) : (
        <Identicon address={asset?.address} customStyle={iconStyle} />
      )}
    </View>
  );
};

const mapStateToProps = (state: any) => ({
  tokenList: selectTokenList(state),
});

export default connect(mapStateToProps)(TokenImage);
