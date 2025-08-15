import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../Backend/firebase';

export interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  avatarUrl?: string;
}

// Cache for user profiles to avoid redundant Firestore calls
const userProfileCache = new Map<string, UserProfile>();
const fetchPromises = new Map<string, Promise<UserProfile | null>>();

/**
 * Custom hook to fetch user profile data efficiently with caching
 * @param userId - The user ID to fetch profile for
 * @returns UserProfile or null if not found/loading
 */
export function useUserProfile(userId: string | undefined): UserProfile | null {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!userId) {
      setUserProfile(null);
      return;
    }

    // Check cache first
    if (userProfileCache.has(userId)) {
      setUserProfile(userProfileCache.get(userId)!);
      return;
    }

    // Check if we're already fetching this user
    if (fetchPromises.has(userId)) {
      fetchPromises.get(userId)!.then(profile => {
        setUserProfile(profile);
      });
      return;
    }

    // Fetch user profile from Firestore
    const fetchUserProfile = async (): Promise<UserProfile | null> => {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const profile: UserProfile = {
            uid: userId,
            displayName: userData.displayName || userData.name,
            email: userData.email,
            photoURL: userData.photoURL || userData.avatarUrl,
            avatarUrl: userData.avatarUrl || userData.photoURL
          };
          
          // Cache the result
          userProfileCache.set(userId, profile);
          return profile;
        }
        
        return null;
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
    };

    // Store the promise and start fetching
    const promise = fetchUserProfile();
    fetchPromises.set(userId, promise);
    
    promise.then(profile => {
      setUserProfile(profile);
      // Clean up the promise from the map
      fetchPromises.delete(userId);
    });

  }, [userId]);

  return userProfile;
}

/**
 * Hook to fetch multiple user profiles efficiently
 * @param userIds - Array of user IDs to fetch
 * @returns Map of userId to UserProfile
 */
export function useUserProfiles(userIds: string[]): Map<string, UserProfile> {
  const [userProfiles, setUserProfiles] = useState<Map<string, UserProfile>>(new Map());

  useEffect(() => {
    if (!userIds.length) {
      setUserProfiles(new Map());
      return;
    }

    const fetchMultipleProfiles = async () => {
      const newProfiles = new Map<string, UserProfile>();
      
      // First, add any cached profiles
      userIds.forEach(userId => {
        if (userProfileCache.has(userId)) {
          newProfiles.set(userId, userProfileCache.get(userId)!);
        }
      });

      // Find users we need to fetch
      const usersToFetch = userIds.filter(userId => !userProfileCache.has(userId));
      
      if (usersToFetch.length === 0) {
        setUserProfiles(newProfiles);
        return;
      }

      // Fetch missing user profiles
      const fetchPromises = usersToFetch.map(async (userId) => {
        try {
          const userDocRef = doc(db, 'users', userId);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const profile: UserProfile = {
              uid: userId,
              displayName: userData.displayName || userData.name,
              email: userData.email,
              photoURL: userData.photoURL || userData.avatarUrl,
              avatarUrl: userData.avatarUrl || userData.photoURL
            };
            
            // Cache the result
            userProfileCache.set(userId, profile);
            return { userId, profile };
          }
          
          return null;
        } catch (error) {
          console.error(`Error fetching user profile for ${userId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(fetchPromises);
      
      // Add fetched profiles to the map
      results.forEach(result => {
        if (result && result.profile) {
          newProfiles.set(result.userId, result.profile);
        }
      });

      setUserProfiles(newProfiles);
    };

    fetchMultipleProfiles();
  }, [userIds.join(',')]); // Dependencies on the user IDs array

  return userProfiles;
}

/**
 * Clear the user profile cache (useful for cache invalidation)
 */
export function clearUserProfileCache() {
  userProfileCache.clear();
  fetchPromises.clear();
}
