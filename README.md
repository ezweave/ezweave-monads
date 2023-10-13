# @ezweave/monads

The first rule of FP is that you have to write a confusing tutorial/article on monads.

## What the fuck is a monad?

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

`bind` takes in _one_ parameter, a function. This function takes, as an argument, the current value in the box, and returns a value (wrapped in a Monad)... what value is based on what that function is supposed to do.

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
  constructor(private readonly value: A) {
    super();
  }

  public bind<B>(callback: (value: A) => IMonad<B>) {
    return callback(this.value);
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

  public static some<A>(value: NonNullable<A>): Maybe<A> {
    return new Maybe<A>(value);
  }

  public static none<A>(): Maybe<A> {
    return new Maybe<A>();
  }
}
```

The big additions are `isSome` and `isNone` as well as an update to `map`.

> [!IMPORTANT]  
> The TypeScript utility type, `NotNullable` is useful here as without it TS will not be happy with our `none` function on `Maybe`. Even with `NotNullable` we still have to do some casting...

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

The `Maybe` monad we have thus far defined, has some useful tricks up its sleeves.

Now, you may have noticed that we still don't actually return our value.

Let's fix that by enhancing our `Maybe`

```ts
public valueOr(value: NonNullable<A>): A {
  return this.isSome() ? this.myValue as A : value;
}
```

Now, we can return something at the end, even if the `Maybe` monads at any point were empty.

E.g:

```ts
Maybe.none().valueOr('foo');
```

Well, that's pretty neat... but how can we actually use this?

### Doing Something Useful

So now that we have our own version of `Maybe`, how would we actually use this?

Let's pull back and define a use case.

> As a user I expect to be charged sales tax so the gub'ment doesn't hunt me down.

Jokes aside, we can probably assume we need some type of function that takes in a price and returns the new price, with taxes applied.

Something like this:

```ts
const applyTaxes = (price: number): number => {
  // ???
};
```

If we say our tax rate is 5% (`0.05`) a _naive_ implementation without a monad would look like this:

```ts
const applyTaxes = (price: number): number => n * 0.05;
```

This is fine, but what if `price` comes in as `undefined`? Remember, TypeScript _does not exist at runtime_ so that is possible.

And if you type `undefined * 1.05` into a JS console, you will get `NaN`,

So if we wrap this in our `Maybe` monad, that looks more like this:

```ts
const applyTaxes = (price: number): number =>
  Maybe.some(price)
    .map((p) => p * 1.05)
    .valueOr(0);
```

This is still pretty simple, but we can see what is happening. If the `price` is `undefined`, we still get a `0` at the end.

Now what if the tax rate is variable... what if we want to curry that in?

Without _exposing_ our `Maybe` that could be done like this:

```ts
const applyTaxesByRate =
  (taxRate: number) =>
  (price: number): number =>
    Maybe.some(price)
      .map((p) => p * Maybe.some(taxRate).valueOr(1))
      .valueOr(0);
```

Where this can get _really_ powerful is when we start tying it into multiple layers of functions and bringing in more monads! Which brings us to...
