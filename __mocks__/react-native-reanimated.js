// Minimal mock for react-native-reanimated used in tests
const React = require('react');

module.exports = {
  // default export
  default: {
    View: 'View',
    Text: 'Text',
    createAnimatedComponent: (Comp) => Comp,
  },
  // named exports commonly used
  Easing: {
    inOut: () => {}
  },
  interpolate: () => {},
  call: () => {},
  useSharedValue: (v) => ({ current: v }),
  useAnimatedStyle: (fn) => fn,
  withTiming: (v) => v,
  withSequence: (...args) => args[args.length - 1],
  withDelay: (t, v) => v,
  runOnJS: (fn) => fn,
  // allow require('react-native-reanimated').default
  __esModule: true,
};
