import { toUpper } from 'lodash';

import { MostMidMonad } from './MostMidMonad';

describe(MostMidMonad, () => {
  it('can use some to create a new Monad statically', () => {
    const one = MostMidMonad.some('foo');

    const two = one.bind(
      (value) => new MostMidMonad(`${toUpper(value)}_SO_MID`),
    );

    expect(two).toMatchSnapshot();
  });
  it('can use none to create a new Monad statically', () => {
    const one = MostMidMonad.none();

    const two = one.bind(
      (value) => new MostMidMonad(`${toUpper(value)}_SO_MID`),
    );

    expect(two).toMatchSnapshot();
  });
  it('can bind a bunch of functions', () => {
    const one = MostMidMonad.some('foo');

    const two = one
      .bind((value) => new MostMidMonad(toUpper(value)))
      .bind((value) => new MostMidMonad(`${value}_SO_MID`));

    expect(two).toMatchSnapshot();
  });
});
