# User Profile Hook Usage Guide

This document explains how to efficiently fetch user avatars and profile data in player selection components using the `useUserProfile` and `useUserProfiles` hooks.

## Overview

The `useUserProfile` hooks provide an efficient way to fetch user profile data from Firestore with built-in caching to avoid redundant database calls.

## Features

- **Caching**: Profiles are cached in memory to avoid repeated Firestore queries
- **Deduplication**: Multiple components requesting the same user won't trigger duplicate requests
- **Batch Support**: `useUserProfiles` can fetch multiple user profiles efficiently
- **Automatic Updates**: Components automatically re-render when profile data is loaded

## Basic Usage

### Single User Profile (`useUserProfile`)

```tsx
import { useUserProfile } from '../../hooks/useUserProfile';

const MyComponent = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const userProfile = useUserProfile(selectedUserId);

  return (
    <Avatar 
      src={userProfile?.photoURL || userProfile?.avatarUrl || ''} 
      sx={{ width: 64, height: 64 }}
    >
      {userProfile?.displayName?.[0] || '?'}
    </Avatar>
  );
};
```

### Multiple User Profiles (`useUserProfiles`)

```tsx
import { useUserProfiles } from '../../hooks/useUserProfile';

const TeamComponent = () => {
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const userProfiles = useUserProfiles(playerIds);

  return (
    <div>
      {playerIds.map(playerId => {
        const profile = userProfiles.get(playerId);
        return (
          <Avatar 
            key={playerId}
            src={profile?.photoURL || profile?.avatarUrl || ''} 
          >
            {profile?.displayName?.[0] || '?'}
          </Avatar>
        );
      })}
    </div>
  );
};
```

## Implementation in Player Selection Components

### 1. Update Player Interface

Add `photoURL` to your Player and teamPositioning interfaces:

```tsx
interface Player {
  id: string;
  displayName: string;
  email?: string;
  photoURL?: string; // Add this
}

interface teamPostitioning {
  teamid: number;
  teamPosition: number;
  playerId: string;
  displayName: string;
  photoURL?: string; // Add this
}
```

### 2. Import the Hook

```tsx
import { useUserProfile, useUserProfiles } from '../../hooks/useUserProfile';
```

### 3. Use in Component

For single player (like duel):
```tsx
const opponent = players.find(p => p.teamid === 2);
const opponentProfile = useUserProfile(opponent?.playerId);

// Use in Avatar component
<Avatar src={opponentProfile?.photoURL || opponentProfile?.avatarUrl || ''}>
  {opponent?.displayName[0] || 'O'}
</Avatar>
```

For multiple players (like teams):
```tsx
const selectedPlayerIds = players.map(p => p.playerId).filter(id => id !== user?.uid);
const userProfiles = useUserProfiles(selectedPlayerIds);

// Use in Avatar components
{players.map(player => {
  const profile = userProfiles.get(player.playerId);
  return (
    <Avatar 
      key={player.playerId}
      src={profile?.photoURL || profile?.avatarUrl || ''}
    >
      {player.displayName[0] || '?'}
    </Avatar>
  );
})}
```

## UserProfile Interface

```tsx
interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  avatarUrl?: string;
}
```

## Performance Benefits

1. **Caching**: Once a user profile is fetched, it's cached for the entire session
2. **Deduplication**: Multiple requests for the same user are automatically deduplicated
3. **Batch Optimization**: `useUserProfiles` fetches multiple profiles in parallel
4. **Minimal Re-renders**: Components only re-render when their specific data changes

## Cache Management

To clear the cache (useful for testing or when user data changes):

```tsx
import { clearUserProfileCache } from '../../hooks/useUserProfile';

// Clear all cached profiles
clearUserProfileCache();
```

## Examples in Codebase

- **Duel Component**: `src/matches/PlayerSelectionBlocks/duel.tsx` - Single opponent profile
- **Small Team Component**: `src/matches/PlayerSelectionBlocks/smallTeam.tsx` - Multiple player profiles

## Best Practices

1. **Filter Current User**: Exclude the current user from profile fetching since their data is already available
2. **Fallback Values**: Always provide fallback values for avatar src and display names
3. **Loading States**: Consider showing loading avatars while profiles are being fetched
4. **Error Handling**: The hooks handle errors gracefully and return null for failed requests

## Common Patterns

### Avatar with Fallback
```tsx
<Avatar 
  src={profile?.photoURL || profile?.avatarUrl || ''}
  sx={{ width: 64, height: 64 }}
>
  {profile?.displayName?.[0] || player?.displayName?.[0] || '?'}
</Avatar>
```

### Conditional Rendering
```tsx
{opponent && (
  <Avatar 
    src={opponentProfile?.photoURL || ''}
    sx={{ bgcolor: opponentProfile ? 'primary.main' : 'grey.300' }}
  >
    {opponentProfile?.displayName?.[0] || opponent.displayName[0] || '?'}
  </Avatar>
)}
```
