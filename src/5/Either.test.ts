import { getCharacter, getCustomerPriceFromReponse, parseJSON } from "./Either";
import { Either, Left, Right } from "monet";

describe(parseJSON, () => {
  it('returns a JSON object if the string contains valid JSON', () => {
    const json = {
      firstName: 'Spike',
      lastName: 'Spiegel'
    };
    const jsonString = JSON.stringify(json);

    const parsedJSON = parseJSON(jsonString).right();
    expect(
      parsedJSON
    ).toEqual(json);
  })


  it('returns an error if the JSON is invalid', () => {
    const jsonString = 'a;sdklfajdsfafkldf { /// ###';

    const error = parseJSON(jsonString).left();
    expect(
      error.message
    ).toEqual('Unexpected token a in JSON at position 0');
  })


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

  it('gets the height of a Star Wars character', async () => {
    const lukeResponse = await getCharacter(1);

    const lukesHeight = parseJSON<StarWarsCharacter>(lukeResponse.data).bind(
      (luke: StarWarsCharacter): Either<Error, string> => luke ? Right(luke.height) : Left(new Error('no data in response'))
    ).map(height => parseInt(height)).right();

    expect(lukesHeight).toEqual(172);
  })

  it('returns an Either that isLeft immediately if the value cant be parsed', async () => {
    const badResponse = { data: '{$$$$$$$}' };

    const error = parseJSON<StarWarsCharacter>(badResponse.data).bind(
      (character: StarWarsCharacter): Either<Error, string> => character ? Right(character.height) : Left(new Error('no data in response'))
    ).map(height => parseInt(height)).left().message;

    expect(error).toEqual('Unexpected token $ in JSON at position 1');
  })

  it('returns an Either that isLeft immediately if the value cant be parsed', async () => {
    const badResponse = { data: '{}' };

    const error = parseJSON<StarWarsCharacter>(badResponse.data).bind(
      (character: StarWarsCharacter): Either<Error, string> => character.height ? Right(character.height) : Left(new Error('no data in response'))
    ).map(height => parseInt(height)).left();

    expect(error.message).toEqual('Error: no data in response');
  })
})

describe(getCustomerPriceFromReponse, () => {
  it('gets a rate from a response', () => {
    const response = JSON.stringify({
      customerPrice: 69,
      id: 'adfadsfdf',
    })

    expect(
      getCustomerPriceFromReponse(response).right()
    ).toEqual(69)
  })
  it.only('gets a rate from a response', () => {
    const response = JSON.stringify({
      customerPrice: 69,
      id: 'adfadsfdf',
    })

    const priceEither = getCustomerPriceFromReponse(response);

    const printPrice = (price: number) => console.info(price);
    const printError = (_) => console.error('DIDNT FIND A PRICE');

    priceEither.cata(printError, printPrice);
  })
})