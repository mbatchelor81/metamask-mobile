import React from 'react';
import { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import GasEducationCarousel from '.';

const mockNavigation = {
  setOptions: jest.fn(),
  goBack: jest.fn(),
  navigate: jest.fn(),
} as unknown as NavigationProp<ParamListBase>;

const mockRoute = {
  params: {
    navigateTo: jest.fn(),
  },
} as unknown as RouteProp<{ params: { navigateTo?: () => void } }, 'params'>;

describe('GasEducationCarousel', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <GasEducationCarousel
        navigation={mockNavigation}
        route={mockRoute}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
