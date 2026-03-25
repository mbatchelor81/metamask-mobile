import { multiplyHexes } from './conversions';

describe('multiplyHexes', () => {
  it('should correctly multiply two hex numbers', () => {
    const hex1: string = '0x5';
    const hex2: string = '0x5';
    const expectedResult: string = '19';

    const result: string = multiplyHexes(hex1, hex2);
    expect(result).toBe(expectedResult);
  });
});
