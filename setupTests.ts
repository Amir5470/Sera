import '@testing-library/jest-native/extend-expect';

// Silence Firebase network calls in tests; real Firestore tests use emulator via @firebase/rules-unit-testing
jest.mock('firebase/firestore', () => {
  const original = jest.requireActual('firebase/firestore');
  return {
    ...original,
    getFirestore: jest.fn(() => ({})),
  };
});
