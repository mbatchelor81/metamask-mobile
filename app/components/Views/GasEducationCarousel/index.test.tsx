import React from 'react';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import renderWithProvider from '../../../util/test/renderWithProvider';
import GasEducationCarousel from '.';

describe('GasEducationCarousel', () => {
  it('should render correctly', () => {
    const mockNavigation = {
      setOptions: () => null,
      goBack: () => null,
    } as unknown as NavigationProp<ParamListBase>;

    const { toJSON } = renderWithProvider(
      <GasEducationCarousel
        navigation={mockNavigation}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
