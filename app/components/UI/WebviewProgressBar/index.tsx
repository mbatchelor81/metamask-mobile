import React, { PureComponent } from 'react';
import ProgressBar from 'react-native-progress/Bar';
import FadeView from '../FadeView';
import { ThemeContext, mockTheme } from '../../../util/theme';

interface WebviewProgressBarProps {
  progress?: number;
}

interface WebviewProgressBarState {
  visible: boolean;
}

/**
 * PureComponent that wraps the ProgressBar
 * and allows to fade it in / out
 * via the boolean prop visible
 */
export default class WebviewProgressBar extends PureComponent<WebviewProgressBarProps, WebviewProgressBarState> {
  declare context: React.ContextType<typeof ThemeContext>;
  mounted = false;

  state: WebviewProgressBarState = {
    visible: true,
  };

  componentDidMount(): void {
    this.mounted = true;
  }

  componentWillUnmount(): void {
    this.mounted = false;
  }

  componentDidUpdate(): void {
    if (this.props.progress === 1) {
      this.hide();
    } else if (!this.state.visible && this.props.progress !== 1) {
      this.show();
    }
  }

  hide(): void {
    setTimeout(() => {
      this.mounted && this.setState({ visible: false });
    }, 300);
  }

  show(): void {
    this.mounted && this.setState({ visible: true });
  }

  render = (): React.JSX.Element => {
    const colors = this.context?.colors || mockTheme.colors;

    return (
      <FadeView visible={this.state.visible}>
        <ProgressBar
          progress={this.props.progress}
          color={colors.primary.default}
          width={null}
          height={3}
          borderRadius={0}
          borderWidth={0}
          useNativeDriver
        />
      </FadeView>
    );
  };
}

WebviewProgressBar.contextType = ThemeContext;
