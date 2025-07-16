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

const { leagueId } = useParams();

const SettingsTabs: React.FC = () => {
  return (
    <div>
      <nav style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {tabs.map(tab => (
          <NavLink
            key={tab.path}
            to={`/League/${leagueId}/leagueSettings/${tab.path}`}
            replace
            style={({ isActive }) => ({
              color: isActive ? '#fff' : '#A8B2BA',
              backgroundColor: isActive ? '#F43C0A' : '#f43d0a27',
              borderRadius: 8,
              padding: '8px 24px',
              fontWeight: 600,
              textTransform: 'none',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              marginRight: 8,
            })}
          >
            {tab.label}
          </NavLink>
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
