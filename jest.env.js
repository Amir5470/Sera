// Minimal DOM-like globals for jest-expo preset and React Native testing
// This file runs before the preset to ensure globals used by setup scripts exist.

// __DEV__ is expected by react-native internals
if (typeof global.__DEV__ === 'undefined') {
  global.__DEV__ = true;
}

if (typeof global.navigator === 'undefined') {
  global.navigator = {};
}

if (typeof global.window === 'undefined') {
  global.window = {};
}

if (typeof global.document === 'undefined') {
  global.document = {};
}

// Provide a minimal clipboard mock used in FeedScreen (navigator.clipboard.writeText)
if (!global.navigator.clipboard) {
  global.navigator.clipboard = {
    writeText: jest.fn().mockResolvedValue(undefined),
  };
}

// Provide requestAnimationFrame used by some RN libs
if (typeof global.requestAnimationFrame === 'undefined') {
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
}

// Minimal process.env values expected by expo-modules-core
if (!process.env.EXPO_OS) process.env.EXPO_OS = 'android';
