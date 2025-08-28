import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import GasEducationCarousel from '.';

describe('GasEducationCarousel', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <GasEducationCarousel
        navigation={{ setOptions: () => null, goBack: () => null } as any}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
