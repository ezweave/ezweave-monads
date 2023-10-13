interface IMonad<A> {
  bind<B>(callback: (value: A) => Monad<B>): IMonad<B>;
}

abstract class Monad<A> implements IMonad<A> {
  abstract bind<B>(fn: (value: A) => IMonad<B>): IMonad<B>;
}

export class MostBasicMonad<A> extends Monad<A> {
  myValue: A;

  constructor(t: A) {
    super();
    this.myValue = t;
  }

  public bind<B>(callback: (value: A) => IMonad<B>) {
    return callback(this.myValue);
  }
}
