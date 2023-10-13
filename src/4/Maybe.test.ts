import { toLower } from 'lodash';

import { Maybe } from './Maybe';
import { MostestMidMonad } from '@ezweave/3/MostestMidMonad';

describe(Maybe, () => {
  it('does nothing if there is no value', () => {
    const monad = Maybe.none().map(toLower);

    expect(monad).toMatchSnapshot();
  });
  it('does not break if a function returns nothing', () => {
    const monad = Maybe.some(1)
      .map((n) => n! % 2 === 0 ? n : undefined)
      .map((n) => n.toFixed());

    expect(monad).toMatchSnapshot();
  });
  it('would break if we used a different Monad', () => {
    expect(() => MostestMidMonad.some(1)
      .map((n) => n! % 2 === 0 ? n : undefined)
      // @ts-ignore
      .map((n) => n.toFixed())).toThrowErrorMatchingSnapshot();
  })
});
