import React from 'react';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import AppInformation from './';

const mockNavigation = {
  navigate: jest.fn(),
  setOptions: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(() => true),
  canGoBack: jest.fn(() => false),
  getId: jest.fn(() => 'test'),
  getParent: jest.fn(),
  getState: jest.fn(() => ({ routes: [], index: 0 })),
} as any;

describe('AppInformation', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <AppInformation navigation={mockNavigation} />,
      { state: {} },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
