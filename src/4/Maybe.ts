interface IMonad<A> {
  bind<B>(callback: (value?: A) => Monad<B>): IMonad<B>;
  map<B>(callback: (value?: A) => B): IMonad<B>;
}

abstract class Monad<A> implements IMonad<A> {
  abstract bind<B>(fn: (value?: A) => IMonad<B>): IMonad<B>;
  abstract map<B>(callback: (value?: A) => B): IMonad<B>;

  public static some<A>(value: A) {
    return new Maybe<A>(value);
  }

  public static none() {
    return new Maybe<undefined>();
  }
}

export class Maybe<A> extends Monad<A> {
  myValue?: A;

  constructor(t?: A) {
    super();
    if (t) {
      this.myValue = t;
    }
  }

  public bind<B>(callback: (value?: A) => IMonad<B>) {
    return callback(this.myValue);
  }

  public map<B>(callback: (value?: A) => B) {
    return this.isSome() ? Maybe.some(callback(this.myValue)) : Maybe.none();
  }

  public isSome(): boolean {
    return !this.isNone();
  }

  public isNone(): boolean {
    return this.myValue === null || this.myValue === undefined;
  }
}
