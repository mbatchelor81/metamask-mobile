import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { GasEducationCarousel } from '.';

const mockNavigation = {
  getParam: () => false,
  setOptions: () => null,
  goBack: jest.fn(),
  navigate: jest.fn(),
} as any;

describe('GasEducationCarousel', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <GasEducationCarousel 
        navigation={mockNavigation}
        conversionRate={1}
        currentCurrency="USD"
        ticker="ETH"
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
