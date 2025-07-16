import React, { Suspense } from 'react';
import { Routes, Route, NavLink, useParams } from 'react-router-dom';
import { Button } from '@mui/material';

const BasicInfoTab = React.lazy(() => import('./BasicInfoTab'));
const GameplaySettingsTab = React.lazy(() => import('./GameplaySettingsTab'));
const MemberAdminTab = React.lazy(() => import('./MemberAdminTab'));
const CustomizationTab = React.lazy(() => import('./CustomizationTab'));
const RankingSettingsTab = React.lazy(() => import('./RankingSettingsTab'));

const tabs = [
  { label: 'Basic Info', path: 'basic', Component: BasicInfoTab },
  { label: 'Gameplay', path: 'gameplay', Component: GameplaySettingsTab },
  { label: 'Members/Admins', path: 'members', Component: MemberAdminTab },
  { label: 'Customization', path: 'custom', Component: CustomizationTab },
  { label: 'Ranking', path: 'ranking', Component: RankingSettingsTab },
];


const SettingsTabs: React.FC = () => {
  const { leagueId } = useParams();
  return (
    <div>
      <nav style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {tabs.map(tab => (
          <Button
            key={tab.path}
            component={NavLink}
            to={`/league/${leagueId}/LeagueSettings/${tab.path}`}
            replace
            sx={{
              color: 'text.primary',
              bgcolor: '#f43d0a27',
              '&.active': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              },
              borderRadius: 2,
              px: 3,
              py: 0.5,
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            {tab.label}
          </Button>
        ))}
      </nav>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route index element={<BasicInfoTab />} />
          <Route path="basic" element={<BasicInfoTab />} />
          <Route path="gameplay" element={<GameplaySettingsTab />} />
          <Route path="members" element={<MemberAdminTab />} />
          <Route path="custom" element={<CustomizationTab />} />
          <Route path="ranking" element={<RankingSettingsTab />} />
        </Routes>
      </Suspense>
    </div>
  );
};

export default SettingsTabs;
