import { toLower } from 'lodash';

import { MostestMidMonad } from '@ezweave/3/MostestMidMonad';

import { Maybe } from './Maybe';

describe(Maybe, () => {
  it('does nothing if there is no value', () => {
    const monad = Maybe.none<string>().map(toLower);

    expect(monad).toMatchSnapshot();
  });
  it('does not break if a function returns nothing', () => {
    const monad = Maybe.some<number>(1)
      .map((n) => (n! % 2 === 0 ? n : undefined))
      .map((n) => n.toFixed());

    expect(monad).toMatchSnapshot();
  });
  it('would break if we used a different Monad', () => {
    expect(() =>
      MostestMidMonad.some(1)
        .map((n) => (n! % 2 === 0 ? n : undefined))
        // @ts-ignore
        .map((n) => n.toFixed()),
    ).toThrowErrorMatchingSnapshot();
  });
  it('returns a value if none is defined', () => {
    const foo = Maybe.none();

    expect(foo.valueOr('foo')).toEqual('foo');
  });
  it('can be composed to do useful things', () => {
    const applyTaxes = (price: number): number =>
      Maybe.some(price)
        .map((p) => p * 1.05)
        .valueOr(0);

    expect(applyTaxes(undefined as unknown as number)).toEqual(0);

    const applyTaxesByRate =
      (taxRate: number) =>
        (price: number): number =>
          Maybe.some(price)
            .map((p) => p * Maybe.some(taxRate).valueOr(1))
            .valueOr(0);

    class ApplyTaxesByRate {
      constructor(public readonly value: number) { }

      bind(callback: (n: number) => ApplyTaxesByRate) {
        const newValue = callback(this.value).value;
        return new ApplyTaxesByRate(newValue);
      }

      isNone() {
        return this.value === null || this.value === undefined;
      }

      isSome() {
        return !this.isNone();
      }

      map(callback: (n: number) => number) {
        return this.isSome() ? new ApplyTaxesByRate(
          callback(this.value)
        ) : this;
      }

      valueOrZero() {
        return this.isSome() ? this.value : 0;
      }

      static from(n: number) {
        return new ApplyTaxesByRate(n);
      }
    }

    const foo = (taxRate: number) => (price: number) => ApplyTaxesByRate.from(taxRate).map(n => n * price).valueOrZero();

    const fooTenpercent = foo(1.1);

    const total = fooTenpercent(100);

    const applyTaxesAtTwoPercent = applyTaxesByRate(1.02);
    expect(applyTaxesAtTwoPercent(100)).toEqual(102);
  });
});
