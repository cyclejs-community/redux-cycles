import {mockTimeSource} from '@cycle/time';

export function assertSourcesSinks(sources, sinks, main, done, timeOpts = {}) {
  const Time = mockTimeSource(timeOpts);
  const _sources = Object.keys(sources)
    .reduce((_sources, sourceKey) => {
      const sourceObj = sources[sourceKey];
      const diagram = Object.keys(sourceObj)[0];
      const sourceOpts = sourceObj[diagram];

      let obj = {};
      let firstKey = Object.keys(sourceOpts)[0];
      if (typeof sourceOpts[firstKey] === 'function') {
        obj = {
          [sourceKey]: {
            [firstKey]: () => Time.diagram(diagram, sourceOpts[firstKey]())
          }
        }
      } else {
        obj = {
          [sourceKey]: Time.diagram(diagram, sourceOpts)
        }
      }

      return Object.assign(_sources, obj);
    }, {})

  const _sinks = Object.keys(sinks)
    .reduce((_sinks, sinkKey) => {
      const sinkObj = sinks[sinkKey];
      const diagram = Object.keys(sinkObj)[0];
      const sinkOpts = sinkObj[diagram];

      return Object.assign(_sinks, { [sinkKey]: Time.diagram(diagram, sinkOpts) });
    }, {});

  // always pass Time as a source
  _sources.Time = Time;

  const _main = main(_sources);

  Object.keys(sinks)
    .map(sinkKey => Time.assertEqual(_main[sinkKey], _sinks[sinkKey]));

  Time.run(err => {
    expect(err).toBeFalsy();
    done();
  });
}
