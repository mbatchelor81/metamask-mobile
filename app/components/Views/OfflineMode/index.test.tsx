import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import OfflineMode from './';

describe('OfflineMode', () => {
  it('should render correctly', () => {
    const mockNavigation = {
      navigate: jest.fn(),
      pop: jest.fn(),
    } as any;
    
    const { toJSON } = renderWithProvider(<OfflineMode navigation={mockNavigation} />);
    expect(toJSON()).toMatchSnapshot();
  });
});
