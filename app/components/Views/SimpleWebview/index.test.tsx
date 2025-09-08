import React from 'react';
import { shallow } from 'enzyme';
import SimpleWebview from './';

describe('SimpleWebview', () => {
  it('should render correctly', () => {
    const mockNavigation = {
      dispatch: jest.fn(),
      navigate: jest.fn(),
      reset: jest.fn(),
      goBack: jest.fn(),
      isFocused: jest.fn(),
      canGoBack: jest.fn(),
      getId: jest.fn(),
      getParent: jest.fn(),
      getState: jest.fn(),
      setParams: jest.fn(),
      setOptions: jest.fn(),
    } as any;

    const mockRoute = {
      key: 'test-key',
      name: 'SimpleWebview',
      params: { url: 'https://etherscan.io', title: 'etherscan' },
    } as any;

    const wrapper = shallow(
      <SimpleWebview
        navigation={mockNavigation}
        route={mockRoute}
      />,
    );
    expect(wrapper).toMatchSnapshot();
  });
});
