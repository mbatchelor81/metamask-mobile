import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import GasEducationCarousel from '.';

describe('GasEducationCarousel', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <GasEducationCarousel
        navigation={{ setOptions: () => null } as any} // eslint-disable-line @typescript-eslint/no-explicit-any
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
