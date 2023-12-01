import { Either, Left, Right } from 'monet';

import { getCustomerPriceFromReponse, parseJSON } from './Either';

describe(parseJSON, () => {
  it('returns a JSON object if the string contains valid JSON', () => {
    const json = {
      firstName: 'Spike',
      lastName: 'Spiegel',
    };
    const jsonString = JSON.stringify(json);

    const parsedJSON = parseJSON(jsonString).right();
    expect(parsedJSON).toEqual(json);
  });

  it('returns an error if the JSON is invalid', () => {
    const jsonString = 'a;sdklfajdsfafkldf { /// ###';

    const error = parseJSON(jsonString).left();
    expect(error.message).toEqual('Unexpected token a in JSON at position 0');
  });

  interface StarWarsCharacter {
    name: string;
    height: string;
    mass: string;
    hairColor: string;
    skinColor: string;
    eyeColor: string;
    birthYear: string;
    gender: string;
    homeworld: string;
    films: string[];
    species: any[];
    vehicles: string[];
    starships: string[];
    created: Date;
    edited: Date;
    url: string;
  }

  it('returns an Either that isLeft immediately if the value cant be parsed', async () => {
    const badResponse = { data: '{$$$$$$$}' };

    const error = parseJSON<StarWarsCharacter>(badResponse.data)
      .bind(
        (character: StarWarsCharacter): Either<Error, string> =>
          character
            ? Right(character.height)
            : Left(new Error('no data in response')),
      )
      .map((height) => parseInt(height))
      .left().message;

    expect(error).toEqual('Unexpected token $ in JSON at position 1');
  });

  it('returns an Either that isLefts if there is no data', async () => {
    const badResponse = { data: '{}' };

    const error = parseJSON<StarWarsCharacter>(badResponse.data)
      .bind(
        (character: StarWarsCharacter): Either<Error, string> =>
          character.height
            ? Right(character.height)
            : Left(new Error('no data in response')),
      )
      .map((height) => parseInt(height))
      .left();

    expect(error.message).toEqual('no data in response');
  });

  it('can be used inside other functions', () => {
    interface User {
      firstName: string;
      lastName: string;
      email: string;
    }

    const homer: User = {
      firstName: 'Homer',
      lastName: 'Simpson',
      email: 'homer.j.simpson@springfield.org',
    };

    const rawJson = JSON.stringify(homer);

    const getUserEmail = (json: string): Either<Error, string> =>
      parseJSON<User>(json).cata(
        (_) => Left(new Error('No data in user')),
        (user) => Right(user.email),
      );

    const eitherEmailOrError = getUserEmail(rawJson);

    expect(eitherEmailOrError.right()).toEqual(homer.email);
  });
});

describe(getCustomerPriceFromReponse, () => {
  it('gets a rate from a response', () => {
    const response = JSON.stringify({
      customerPrice: 69,
      id: 'adfadsfdf',
    });

    expect(getCustomerPriceFromReponse(response).right()).toEqual(69);
  });
  it('gets no rate if there is an error', () => {
    const response = '{{notjson';

    const priceEither = getCustomerPriceFromReponse(response);

    const printPrice = jest
      .fn()
      .mockImplementation((price: number) => console.info(price));
    const printError = jest
      .fn()
      .mockImplementation((_) => console.error('DIDNT FIND A PRICE'));

    priceEither.cata(printError, printPrice);

    expect(printPrice).not.toHaveBeenCalled();
    expect(printError).toHaveBeenCalled();
  });
});
