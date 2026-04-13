import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

// Lightweight mocks for navigation and auth context
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));

// Mock useAuth to return a fake user
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'test-uid' } }),
}));

// Import the Step3 onboarding screen and FeedScreen
import Step3 from '../../app/(onboarding)/step3';
import FeedScreen from '../../app/(app)/feed/index';

// Mock Firestore functions used by findOrCreateSchool and profile saves
jest.mock('../../lib/schools', () => ({
  findOrCreateSchool: jest.fn(async (name: string, city: string) => 'school-test-id'),
  searchSchools: jest.fn(async (q: string) => []),
}));

jest.mock('../../lib/profile', () => ({
  saveProfileAtomic: jest.fn(async () => {}),
  saveProfileIndex: jest.fn(async () => {}),
}));

// Mock useProfile to reflect post-onboarding state after atomic save
let mockProfileState: any = { profile: null, loading: false };
jest.mock('../../hooks/useProfile', () => ({
  useProfile: () => mockProfileState,
}));

// Mock useFeed to return posts when schoolId is set
jest.mock('../../hooks/useFeed', () => ({
  useFeed: (schoolId: string | undefined) => {
    if (!schoolId) {
      return { posts: [], loading: false };
    }
    return { posts: [{ id: 'p1', text: 'Hello school', authorName: 'Alice', createdAt: Date.now() }], loading: false };
  },
}));

describe('School selection → feed integration', () => {
  it('removes No School CTA and shows feed when school selected', async () => {
    // Render Step3 and simulate selecting school and pressing Next
    const { getByPlaceholderText, getByText, queryByText } = render(<Step3 /> as any);

    const schoolInput = getByPlaceholderText('School name (e.g. West Jefferson High School)');
    const cityInput = getByPlaceholderText('City (e.g. Chicago, IL)');

    fireEvent.changeText(schoolInput, 'Test High');
    fireEvent.changeText(cityInput, 'Testville');

    // Press Next
    const nextButton = getByText('Next →');
    fireEvent.press(nextButton);

    // Ensure saveProfileAtomic was called
    const { saveProfileAtomic } = require('../../lib/profile');
    await waitFor(() => expect(saveProfileAtomic).toHaveBeenCalled());

    // Simulate that profile now has a schoolId (as if onboarding completed)
    mockProfileState = { profile: { schoolId: 'school-test-id', onboardingComplete: true, displayName: 'Test' }, loading: false };

    // Render FeedScreen and assert NoSchoolState is gone and feed shows posts
    const { getByText: getByTextFeed, queryByText: queryByTextFeed } = render(<FeedScreen /> as any);

    await waitFor(() => {
      expect(queryByTextFeed('To join your school community, pick your school now.')).toBeNull();
      expect(getByTextFeed('Hello school')).toBeTruthy();
    });
  });
});
