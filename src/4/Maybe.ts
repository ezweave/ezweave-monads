interface IMonad<A> {
  bind<B>(callback: (value?: A) => Monad<B>): IMonad<B>;
  map<B>(callback: (value?: A) => B): IMonad<B>;
}

abstract class Monad<A> implements IMonad<A> {
  abstract bind<B>(fn: (value?: A) => IMonad<B>): IMonad<B>;
  abstract map<B>(callback: (value?: A) => B): IMonad<B>;
}

export class Maybe<A> extends Monad<A> {
  constructor(private readonly value?: A) {
    super();
  }

  public bind<B>(callback: (value: NonNullable<A>) => IMonad<B>) {
    return callback(this.value as NonNullable<A>);
  }

  public map<B>(callback: (value: NonNullable<A>) => B) {
    return this.isSome()
      ? new Maybe<B>(callback(this.value as NonNullable<A>))
      : new Maybe<B>();
  }

  public isSome(): boolean {
    return !this.isNone();
  }

  public isNone(): boolean {
    return this.value === null || this.value === undefined;
  }

  public valueOr(value: NonNullable<A>): A {
    return this.isSome() ? (this.value as A) : value;
  }

  public static some<A>(value: NonNullable<A>): Maybe<A> {
    return new Maybe<A>(value);
  }

  public static none<A>(): Maybe<A> {
    return new Maybe<A>();
  }
}
