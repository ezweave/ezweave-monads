interface IMonad<A> {
  bind<B>(callback: (value?: A) => Monad<B>): IMonad<B>;
}

abstract class Monad<A> implements IMonad<A> {
  abstract bind<B>(fn: (value?: A) => IMonad<B>): IMonad<B>;

  public static some<A>(value: A) {
    return new MostMidMonad<A>(value);
  }

  public static none() {
    return new MostMidMonad<undefined>();
  }
}

export class MostMidMonad<A> extends Monad<A> {
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
}
