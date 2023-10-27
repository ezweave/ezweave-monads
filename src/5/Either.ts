import axios from 'axios';
import { Either, Left, Right } from 'monet';

export const parseJSON = <T>(json: string): Either<Error, T> => {
  try {
    return Right(<T>JSON.parse(json));
  } catch (e: any) {
    return Left(e);
  }
};

interface Rate {
  customerPrice: number;
  id: string;
}

export const getCustomerPriceFromReponse = (
  json: string,
): Either<undefined, number> =>
  parseJSON<Rate>(json).cata(
    (_) => Left(undefined),
    (rate) => Right(rate.customerPrice),
  );

export const getCharacter = async (n: number) =>
  await axios.get(`https://swapi.dev/api/people/${n}/`);
