# @ezweave/monads

The first rule of FP is that you have to write a confusing tutorial/article on monads.

## What the fuck is a Monad?

<p align="center">
  <img width="800" src="./img/wtf.jpeg" />
</p>

Well, there's a [definition](https://en.wikipedia.org/wiki/Monad_%28functional_programming%29) you can find out there in the wild, but it's probably more confusing without context. One of those things where you need to read one article, then a book, then on and on until you are more confused than ever.

You _should_ do that, but I'm going to cut to the chase.

_What is a Monad?_

It's a box that contains a value.

Now that just sounds like a wrapper, e.g.

```ts
const isThisAMonad = {
  value: 'foo',
};
```

Obviously you wouldn't be here if that is all a monad was.

A monad has one function that binds behavior to the value in the box. This function is called `bind`.

`bind` takes in _one_ parameter, a function. This function takes, as an argument, the current value in the box, and returns a value... what value is based on what that function is supposed to do.

> [!IMPORTANT]  
> `bind` is also called `flatMap` in some libraries.

While I'm not a huge fan of classes, they can make our life easier here.

If we define the interface for a `Monad` as such:

```ts
interface IMonad<A> {
  bind<B>(callback: (value: A) => Monad<B>): IMonad<B>;
}
```

We can then make an abstract class definition that matches:

```ts
abstract class Monad<A> implements IMonad<A> {
  abstract bind<B>(fn: (value: A) => IMonad<B>): IMonad<B>;
}
```

And our most basic `Monad` would look like this:

```ts
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
```

You can see that `bind` attaches a function to our `MostBasicMonad` and spits out a new `Monad` that is based on a transformation of the old value.

That looks like:

```ts
const one = new MostBasicMonad('foo');

const two = one.bind((value) => new MostBasicMonad(toUpper(value)));
```

And if we take a look inside, we can see that `myValue` is now `"FOO"`.

This example is found in the [`src/1`](./src/1) folder.

Now `new` is gross and feels pretty OO (Object Oriented) so another set of common monadic functions are `some` and `none`.

There's more to it than avoiding, `new`, but for now, let's take a look at what those look like:

```ts
abstract class Monad<A> implements IMonad<A> {
  abstract bind<B>(fn: (value?: A) => IMonad<B>): IMonad<B>;

  public static some<A>(value: A) {
    return new MostMidMonad<A>(value);
  }

  public static none() {
    return new MostMidMonad<undefined>();
  }
}
```

- `some`: if there _is_ a value, or we think there is, we are saying "put this in da box!"
- `none`: if we know we have no value, we are making a box full of nothing. [_"You so stupid!"_](https://www.youtube.com/watch?v=hXOjyv4d998)

Now, if we look at the tests ([under `src/2`](./src/2/)) we can see that the `none` example isn't so great. It doesn't do much and seems kinda silly, right?

The real power, of course, comes in being able to chain a bunch of behavior around the value in the original box.

E.g.

```ts
const one = MostMidMonad.some('foo');

const two = one
  .bind((value) => new MostMidMonad(toUpper(value)))
  .bind((value) => new MostMidMonad(`${value}_SO_MID`));
```

Okay so this is cool, though this is also kind of a _pain in the ass_ (PITA). I have to make a new `MostMidMonad` in my functions? Ick.

So, let's add `map`!

```ts
public map<B>(callback: (value?: A) => B) {
  return MostestMidMonad.some(callback(this.myValue));
}
```

Then we can use `map` to save some headaches:

```ts
MostestMidMonad.some('foo')
  .map(toUpper)
  .map((n) => `${n}_MOSTEST_MID`);
```

> [!IMPORTANT]  
> `map` doesn't necessarily operate over a collection like `map`s you may be used to. [They don't love you like I love you.](https://www.youtube.com/watch?v=oIIxlgcuQRU)

Now, let's make a _very incomplete_ version of the `Maybe` monad:

```ts
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
```

The big additions are `isSome` and `isNone` as well as an update to `map`.

_Why would we do this?_

Let's look at a very basic example. In this case, this `Maybe` has nothing in it.

```ts
Maybe.some(1)
  .map((n) => (n! % 2 === 0 ? n : undefined))
  .map((n) => n.toFixed());
```

If we were to run this code without checking to see `isSome`, we would get a divide by zero error. E.g. if we use a different monad, like our `MostestMidMonad`, we would expect that to blow up since the first function _will_ return `undefined`.

In other words:

```ts
MostestMidMonad.some(1)
  .map((n) => (n! % 2 === 0 ? n : undefined))
  .map((n) => n.toFixed());
```

And, as you can see from the [test](./src/4/Maybe.test.ts) it throws:

```sh
"Cannot read properties of undefined (reading 'toFixed')"
```
