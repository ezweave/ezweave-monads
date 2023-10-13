import { toUpper } from 'lodash';

import { MostestMidMonad } from './MostestMidMonad';

describe(MostestMidMonad, () => {
  it('can use map', () => {
    const two = MostestMidMonad.some('foo')
      .map(toUpper)
      .map((n) => `${n}_MOSTEST_MID`);

    expect(two).toMatchSnapshot();
  });
});
