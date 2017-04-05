import { Middleware, Action } from 'redux'
import { Stream } from 'xstream'
import { Sources, Sinks } from '@cycle/run'

type CycleMiddleware = Middleware & {
  makeActionDriver<T>(): (outgoing$: Stream<Action>) => T
  makeStateDriver<T>(): () => T
}

type Main<So, Si> = (sources: So) => Si

export function createCycleMiddleware(): CycleMiddleware

export function combineCycles<A1 extends Sources, A2 extends Sinks>(main: Main<A1, A2>[]): Main<A1, A2>
export function combineCycles<A1 extends Sources, A2 extends Sinks, B1 extends Sources, B2 extends Sinks>(main1: Main<A1, A2>, main2: Main<B1, B2>): Main<A1 & B1, A2 & B2>
export function combineCycles<A1 extends Sources, A2 extends Sinks, B1 extends Sources, B2 extends Sinks, C1 extends Sources, C2 extends Sinks>(main1: Main<A1, A2>, main2: Main<B1, B2>, main3: Main<C1, C2>): Main<A1 & B1 & C1, A2 & B2 & C2>
export function combineCycles<A1 extends Sources, A2 extends Sinks, B1 extends Sources, B2 extends Sinks, C1 extends Sources, C2 extends Sinks, D1 extends Sources, D2 extends Sinks>(main1: Main<A1, A2>, main2: Main<B1, B2>, main3: Main<C1, C2>, main4: Main<D1, D2>): Main<A1 & B1 & C1 & D1, A2 & B2 & C2 & D2>
export function combineCycles<A1 extends Sources, A2 extends Sinks, B1 extends Sources, B2 extends Sinks, C1 extends Sources, C2 extends Sinks, D1 extends Sources, D2 extends Sinks, E1 extends Sources, E2 extends Sinks>(main1: Main<A1, A2>, main2: Main<B1, B2>, main3: Main<C1, C2>, main4: Main<D1, D2>, main5: Main<E1, E2>): Main<A1 & B1 & C1 & D1 & E1, A2 & B2 & C2 & D2 & E2>
export function combineCycles<A1 extends Sources, A2 extends Sinks, B1 extends Sources, B2 extends Sinks, C1 extends Sources, C2 extends Sinks, D1 extends Sources, D2 extends Sinks, E1 extends Sources, E2 extends Sinks, F1 extends Sources, F2 extends Sinks>(main1: Main<A1, A2>, main2: Main<B1, B2>, main3: Main<C1, C2>, main4: Main<D1, D2>, main5: Main<E1, E2>, main6: Main<F1, F2>): Main<A1 & B1 & C1 & D1 & E1 & F1, A2 & B2 & C2 & D2 & E2 & F2>
export function combineCycles<A1 extends Sources, A2 extends Sinks, B1 extends Sources, B2 extends Sinks, C1 extends Sources, C2 extends Sinks, D1 extends Sources, D2 extends Sinks, E1 extends Sources, E2 extends Sinks, F1 extends Sources, F2 extends Sinks, G1 extends Sources, G2 extends Sinks>(main1: Main<A1, A2>, main2: Main<B1, B2>, main3: Main<C1, C2>, main4: Main<D1, D2>, main5: Main<E1, E2>, main6: Main<F1, F2>, main7: Main<G1, G2>): Main<A1 & B1 & C1 & D1 & E1 & F1 & G1, A2 & B2 & C2 & D2 & E2 & F2 & G2>
export function combineCycles<A1 extends Sources, A2 extends Sinks, B1 extends Sources, B2 extends Sinks, C1 extends Sources, C2 extends Sinks, D1 extends Sources, D2 extends Sinks, E1 extends Sources, E2 extends Sinks, F1 extends Sources, F2 extends Sinks, G1 extends Sources, G2 extends Sinks, H1 extends Sources, H2 extends Sinks>(main1: Main<A1, A2>, main2: Main<B1, B2>, main3: Main<C1, C2>, main4: Main<D1, D2>, main5: Main<E1, E2>, main6: Main<F1, F2>, main7: Main<G1, G2>, main8: Main<H1, H2>): Main<A1 & B1 & C1 & D1 & E1 & F2 & G2 & H2, A2 & B2 & C2 & D2 & E2 & F2 & G2 & H2>
export function combineCycles<A1 extends Sources, A2 extends Sinks, B1 extends Sources, B2 extends Sinks, C1 extends Sources, C2 extends Sinks, D1 extends Sources, D2 extends Sinks, E1 extends Sources, E2 extends Sinks, F1 extends Sources, F2 extends Sinks, G1 extends Sources, G2 extends Sinks, H1 extends Sources, H2 extends Sinks, I1 extends Sources, I2 extends Sinks>(main1: Main<A1, A2>, main2: Main<B1, B2>, main3: Main<C1, C2>, main4: Main<D1, D2>, main5: Main<E1, E2>, main6: Main<F1, F2>, main7: Main<G1, G2>, main8: Main<H1, H2>, main9: Main<I1, I2>): Main<A1 & B1 & C1 & D1 & E1 & F1 & G1 & H1 & I1, A2 & B2 & C2 & D2 & E2 & F2 & G2 & H2 & I2>