export type Try<T, E = Error> = [T, null] | [null, E];
