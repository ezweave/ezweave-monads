# @ezweave/monads

The first rule of FP is that you have to write a confusing tutorial/article on monads.

## Table of Contents
* [What the fuck is a monad?](#what-the-fuck-is-a-monad)
* [Maybe](#maybe)
  * [Practicality](#doing-something-useful)
* [Either](#either)
  * [Catamorphize](#cata)

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

[Table of Contents](#table-of-contents)

## Maybe

<p align="center">
  <img width="500" src="./img/maeby.jpg" />
</p>

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


[Table of Contents](#table-of-contents)

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

Where this can get _really_ powerful is when we start tying it into multiple layers of functions and bringing in more monads!

Now let's bake your noodle a bit.

`applyTaxesByRate` is _also_ a monad.

Let's rewrite it to fit our monad semantics:

```ts
class ApplyTaxesByRate {
  constructor(public readonly value: number) {}

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
    return this.isSome()
      ? new ApplyTaxesByRate(callback(this.value))
      : this;
  }

  valueOrZero() {
    return this.isSome() ? this.value : 0;
  }

  static from(n: number) {
    return new ApplyTaxesByRate(n);
  }
}
```

Then you could use it like so:

```ts
const foo = (taxRate: number) => (price: number) =>
  ApplyTaxesByRate.from(taxRate)
    .map((n) => n * price)
    .valueOrZero();

const fooTenpercent = foo(1.1);
```

[Table of Contents](#table-of-contents)


## Either

Elliot Smith's "Either/Or" is consid... oh sorry.  We're talking about monads, not about [sad songs](https://open.spotify.com/track/6L9uay2MM8qACwI1yQHnw2?si=d1c4ff544da147ad).

`Either` is a particularly powerful monad you may end up using a bit.  Similar to `Maybe` the implied context is just more extended.

* `Maybe`: this monad may give you an error.
* `Either`: will tell you why.

It's handy to think of `Either` as being _branching logic_ while `Maybe` is more like "safety" logic.

Let's explore `Either` and _then_ we can compare `Either` and `Maybe`.

We need a new function. This one parses JSON.  Let's call it `parseJSON`.

In plain TS, we would do something like this:

```ts
const parseJSON = <T>(json: string): T => <T>JSON.parse(json);
```

This is great, until we try to call it with a string that doesn't contain JSON:

```ts
parseJSON('not json');
```

As you would expect, this throws an error.

Now we have some options:
* The caller can wrap the `parseJSON` call in a `try/catch`.
* `parseJSON` could return `undefined`` if it cannot parse JSON.

The former is not great.  It requires the caller to code two paths, increasing [_cyclomatic complexity_](https://en.wikipedia.org/wiki/Cyclomatic_complexity) which adds to cognitive load for a maintainer.

E.g. 

```ts 
let user;
try {
  user = parseJSON(user);
} catch {
  user = undefined;
}
...

if(user !== undefined) {
  // do stuff
}
```

A few lines of this can be okay, but it quickly turns code into soup as context (the `user` assignment) gets lost.

Now consider the other option, returning `undefined`:

```ts
const parseJSON = <T>(json: string): T | undefined => {
  try {
    return <T>JSON.parse(json);
  } catch {
    return undefined;
  }
};
```

This is definitely _safer_, but it still requires the caller to understand that the value may be `undefined`, which puts us right back to where we were before.

Enter `Either`.

```ts
const parseJSON = <T>(json: string): Either<Error, T> => {
  try {
    return Right(<T>JSON.parse(json));
  } catch (e: any) {
    return Left(e);
  }
};
```

Now we return a new `Either` which may have our object or it may have an error.

Let's use it!

Here's a sequence that will give us a `Right`: 

```ts
const jsonString = JSON.stringify('{"firstName":"Spike","lastName":"Spiegel"}');

const parsedJSON = parseJSON(jsonString).right();
```

In this case, we got a valid value.

Here, similarly, is a `Left`:

```ts
const jsonString = JSON.stringify('a;sdklfajdsfafkldf { /// ###');

const error = parseJSON(jsonString).left();
```

Now, I know what you're thinking:

> How is this any better than before?

There's a few things.  For one `isRight` and `isLeft` are still around.  So we can use this with imperitive style code and remove the `let` sort of assignment we had before.

But that's not where this gets really neat.  That's when we start to build _more functions_ that speak monad.

You can find more in the [example](./src/5/Either.test.ts), but let's say we have a function that will get user info from an external API, `getUserById`.  This takes in a string that cointains a user id.

Now, this function only returns stringified JSON.  You are asked to write a new function that gets the user's email address from this object.  How would we do that monadically?

```ts
const getUserEmail = (json: string): Either<Error, string> => 
  parseJSON<User>(json).bind(
    (user: user): Either<Error, string> => user ? Right(user.email) : Left(new Error('no data in response'))
  );
```

Now, we're using `parseJSON` first, to get us either an object or an error.  Then we're using `bind` on the `Either<Error, User>` returned to create a new `Either` that has either the email address _or_ an error message.

Then that gives us the following scenarios:

```ts
const email = getUserEmail('a;sdklfajdsfafkldf { /// ###');

if(email.isLeft()) {
  console.error(email.left().message); // oh no!
}
```

And in the positive case:

```ts
const email = getUserEmail('{"email":"homer.j.simpson@springfield.org"}');

if(email.isRight()) {
  sendMessage(email.right().value(), 'Hi, Homer!');
}
```

This is obviously a bit silly, but you can start to see how chains of monads can make logical processing simpler.

Let's introduce a new monadic functor...

[Table of Contents](#table-of-contents)

### Cata

Meow.

`cata` is short for "Catamorphize", which means a few things, but we're going to ignore the text book definition and use it practically.

In Monet, `cata` takes in two functions. One operates on the _left_ of an `Either` and one on the _right_.  Neither operates if the conditions are not meant.  

If we use our email example, from above, we _could_ use `cata` to fire IO.

```ts
getUserEmail(json).cata(
  logError,
  sendEmail
)
```

This will return a new `Either` that either has the output of the `sendEmail` call _or_ an error.

> [!IMPORTANT]  
> It's not a good idea to drop IO into a monad.  Because IO has _side-effects_.  But you can pass or curry IO functions in as arguments _where_ you need them, and use monads to transform and process.

Now, since you know you should _not_ use IO here let's go back and revisit `getUserEmail`, because now we can use `cata` to clean it up!

```ts
const getUserEmail = (json: string): Either<Error, string> =>
  parseJSON<User>(json).cata(
    _ => Left(new Error('No data in user')),
    user => Right(user.email)
  );
```

And if you really wanted, you could make some utility functions to make this even cleaner:

```ts
const buildLeftError = (message: string) => _ => Left(new Error(message));
const parseEmail = (user) => Right(user.email);

const getUserEmail = (json: string): Either<Error, string> =>
  parseJSON<User>(json).cata(
   buildLeftError('No data in user'),
   parseEmail,
  );
```

Going back to our earlier example, we can rewrite an entire "email service" by being smart with our IO:

```ts
const buildLeftError = (message: string) => _ => Left<Error, string>(new Error(message));
const parseEmail = (user: User) => Right<Error, string>(user.email);

const getEmail = (json: string): Either<Error, string> =>
  parseJSON<User>(json).cata(
   buildLeftError('No data in user'),
   parseEmail,
  );

export const getUserEmail = async (userId: string, ioFunction: IOFunction): Either<Error, string> => 
  await ioFunction(userId).then(getEmail).catch(buildLeftError('Io failure'));
```

So you can imagine we support a few cases now:
* If the IO call fails, we return a `Left(new Error('Io failure'))`
* If the object returned cannot be parsed, we get a `Left(new Error('some json parsing error'))`
* If the user object is empty, a `Left(new Error('No data in user'))`

Hmmm... but what if our email isn't valid?  We should probably catch that!

Let's say we have a custom function, `isUserEmailValid` that returns `true` if the email is valid and `false` if it is not (we won't bother writing that here).  If we enhance our `parseEmail` function, we can catch this error case:

```ts
const parseEmail = (user: User) => isUserEmailValid(user) ? Right(user.email) : Left(new Error('Invalid email'));
```

Or maybe you want `isUserEmailValid` to throw an error?

```ts
const parseEmail = (user: User) => {
  try {
    isUserEmailValid(user);
    return Right(user.email);
   } catch (e: Error) {
    return Left(e);
   }
}; 
```

In either, event, we now cover 4 error cases without having a litany of disjointed `try/catch` blocks.

* If the IO call fails, we return a `Left(new Error('Io failure'))`
* If the object returned cannot be parsed, we get a `Left(new Error('some json parsing error'))`
* If the user object is empty, a `Left(new Error('No data in user'))`
* If the email is invalid, we get a `Left(new Error('Invalid email'))`

Let's compare both approaches.

First, iterative code:

```ts
export const getUserEmail = async (userId: string, ioFunction: IOFunction): string | Error => {
  const rawUser = await ioFunction(userId);

  let user;
  try {
    user = JSON.parse<User>(rawUser);
  } catch (e) {
    return e;
  }

  if(user) {
    const email = get(user, 'email', undefined);

    if(email) {
      if(isUserEmailValid(email)) {
        return email;
      } else {
        return new Error('Invalid email');
      }
    } else {
      return new Error('No email found');
    }
  }
}
```

It's not _terrible_ to look at, but notice how the logical controls mix heirarchy around.  It's hard for a developer
to grok where things are happening.  

Now consider the entirity of our monadic solution:

```ts
const parseJSON = <T>(json: string): Either<Error, T> => {
  try {
    return Right(<T>JSON.parse(json));
  } catch (e: any) {
    return Left(e);
  }
}

const buildLeftError = (message: string) => _ => Left<Error, string>(new Error(message));
const parseEmail = (user: User) => isUserEmailValid(user) ? Right(user.email) : Left(new Error('Invalid email'));

const getEmail = (json: string): Either<Error, string> =>
  parseJSON<User>(json).cata(
   buildLeftError('No data in user'),
   parseEmail,
  );

export const getUserEmail = async (userId: string, ioFunction: IOFunction): Either<Error, string> => 
  await ioFunction(userId).then(getEmail).catch(buildLeftError('Io failure'));
```

Now you might be saying, _you're cheating!  You broke the monadic solution into multiple functions!_

You're right.  I did.

_But..._

It brings up an interesting point: monadic code, like functional programming itself, _encourages_ developers to break up logic into smaller functions.  It is actually _harder_ to write

[Table of Contents](#table-of-contents)

