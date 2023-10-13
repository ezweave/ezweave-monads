import { toUpper } from 'lodash';

import { MostBasicMonad } from './MostBasicMonad';

describe(MostBasicMonad, () => {
  it('can bind', () => {
    const one = new MostBasicMonad('foo');

    const two = one.bind((value) => new MostBasicMonad(toUpper(value)));

    expect(two).toMatchSnapshot();
  });
});
