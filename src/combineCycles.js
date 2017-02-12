import xs from 'xstream'

export default function combineCycles(...mains) {
  return sources => {
    const sinks = mains.map(main => main(sources))

    const drivers = Object.keys(
      sinks.reduce((drivers, sink) => Object.assign(drivers, sink), {})
    )

    const combinedSinks = drivers
      .reduce((combinedSinks, driver) => {
        const driverSinks = sinks
          .filter(sink => sink[driver])
          .map(sink => sink[driver])

        combinedSinks[driver] = xs.merge(...driverSinks)
        return combinedSinks
      }, {})

    return combinedSinks
  }
}
