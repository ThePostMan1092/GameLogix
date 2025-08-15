import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PhotoCamera as PhotoCameraIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  ExitToApp as ExitToAppIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useAuth } from '../Backend/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../Backend/firebase';

interface UserSettings {
  displayName: string;
  email: string;
  photoURL: string;
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    publicProfile: boolean;
    showStats: boolean;
  };
}

const UserSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [settings, setSettings] = useState<UserSettings>({
    displayName: '',
    email: '',
    photoURL: '',
    preferences: {
      notifications: true,
      emailUpdates: true,
      publicProfile: true,
      showStats: true
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Password change state
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Delete account state
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDialog, setAvatarDialog] = useState(false);

  // Predefined avatar options from User Icons folder
  const predefinedAvatars = [
    '1081850711598811054-128.png',
    '11919007451598811069-128.png',
    '12000242481598811050-128.png',
    '13139484431598811059-128.png',
    '13795968221598811050-128.png',
    '14580310081598811066-128.png',
    '15549906371598811064-128.png',
    '15880520161598811044-128.png',
    '16367097731598811047-128.png',
    '20315248251598811063-128.png',
    '2716211571598811054-128.png',
    '3880849121598811049-128.png',
    '6499988111598811067-128.png',
    '678759881598811046-128.png',
    '6822363841598811069-128.png',
    '7645724651598811046-128.png',
    '8025287921598811056-128.png',
    '8056427601598811050-128.png',
    '8840997891598811062-128.png',
    '9889414691598811049-128.png'
  ];

  // Initialize settings from user data
  useEffect(() => {
    if (user) {
      setSettings({
        displayName: user.displayName || '',
        email: user.email || '',
        photoURL: user.photoURL || '',
        preferences: {
          notifications: true, // These would come from Firestore user doc
          emailUpdates: true,
          publicProfile: true,
          showStats: true
        }
      });
    }
  }, [user]);

  // Handle input changes
  const handleInputChange = (field: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (preference: keyof UserSettings['preferences'], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [preference]: value
      }
    }));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: settings.displayName,
        photoURL: settings.photoURL
      });
      
      // Update Firestore user document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: settings.displayName,
        photoURL: settings.photoURL,
        preferences: settings.preferences,
        lastUpdated: new Date()
      });
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Handle predefined avatar selection
  const handlePredefinedAvatarSelect = (avatarFileName: string) => {
    const avatarPath = `/assets/User Icons/${avatarFileName}`;
    handleInputChange('photoURL', avatarPath);
    setAvatarDialog(false);
    setSuccess('Avatar selected! Remember to save changes.');
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setAvatarUploading(true);
    setError('');

    try {
      // Upload to Firebase Storage
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Update settings
      handleInputChange('photoURL', downloadURL);
      
      setSuccess('Avatar uploaded! Remember to save changes.');
      
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!user?.email) return;
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      setSuccess('Password updated successfully!');
      setPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmation !== 'DELETE') return;
    
    setLoading(true);
    setError('');

    try {
      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Delete Firebase Auth account
      await user.delete();
      
      // Navigate to login
      navigate('/login');
      
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { signOut } = await import('firebase/auth');
    const { auth } = await import('../Backend/firebase');
    await signOut(auth);
    navigate('/login');
  };

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Account Settings
        </Typography>
      </Box>

      {/* Status Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Profile Section */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={3}>
              <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Profile Information
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              {!isEditing ? (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                  variant="outlined"
                  size="small"
                >
                  Edit
                </Button>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                    variant="contained"
                    size="small"
                    disabled={loading}
                  >
                    Save
                  </Button>
                  <Button
                    startIcon={<CancelIcon />}
                    onClick={() => setIsEditing(false)}
                    variant="outlined"
                    size="small"
                  >
                    Cancel
                  </Button>
                </Stack>
              )}
            </Box>

            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" gap={3}>
              <Box flex={{ xs: '1', md: '0 0 200px' }} display="flex" flexDirection="column" alignItems="center">
                <Box position="relative">
                  <Avatar
                    src={settings.photoURL}
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      mb: 2,
                      cursor: isEditing ? 'pointer' : 'default',
                      '&:hover': {
                        opacity: isEditing ? 0.8 : 1
                      }
                    }}
                    onClick={() => isEditing && setAvatarDialog(true)}
                  >
                    {settings.displayName?.[0] || settings.email?.[0] || 'U'}
                  </Avatar>
                  {avatarUploading && (
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bgcolor="rgba(0,0,0,0.5)"
                      borderRadius="50%"
                    >
                      <CircularProgress size={30} sx={{ color: 'white' }} />
                    </Box>
                  )}
                </Box>
                {isEditing && (
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCameraIcon />}
                    onClick={() => setAvatarDialog(true)}
                    disabled={avatarUploading}
                    size="small"
                  >
                    Change Avatar
                  </Button>
                )}
              </Box>
              
              <Box flex="1" sx={{ ml: { md: 3 }, mt: { xs: 2, md: 0 } }}>
                <Stack spacing={3}>
                  <TextField
                    label="Display Name"
                    value={settings.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    disabled={!isEditing}
                    fullWidth
                  />
                  <TextField
                    label="Email"
                    value={settings.email}
                    disabled
                    fullWidth
                    helperText="Email cannot be changed"
                  />
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Privacy & Preferences */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={3}>
              <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Privacy & Preferences
              </Typography>
            </Box>
            
            <Stack spacing={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.preferences.notifications}
                    onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                  />
                }
                label="Push Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.preferences.emailUpdates}
                    onChange={(e) => handlePreferenceChange('emailUpdates', e.target.checked)}
                  />
                }
                label="Email Updates"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.preferences.publicProfile}
                    onChange={(e) => handlePreferenceChange('publicProfile', e.target.checked)}
                  />
                }
                label="Public Profile"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.preferences.showStats}
                    onChange={(e) => handlePreferenceChange('showStats', e.target.checked)}
                  />
                }
                label="Show Statistics to Others"
              />
            </Stack>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={3}>
              <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Security
              </Typography>
            </Box>
            
            <Stack spacing={2}>
              <Button
                variant="outlined"
                onClick={() => setPasswordDialog(true)}
                startIcon={<SecurityIcon />}
              >
                Change Password
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleSignOut}
                startIcon={<ExitToAppIcon />}
              >
                Sign Out
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card sx={{ border: '1px solid', borderColor: 'error.main' }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" color="error" gutterBottom>
              Danger Zone
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Once you delete your account, there is no going back. Please be certain.
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setDeleteDialog(true)}
              startIcon={<DeleteIcon />}
            >
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </Stack>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    edge="end"
                  >
                    {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              label="New Password"
              type={showPasswords.new ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    edge="end"
                  >
                    {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
            <TextField
              label="Confirm New Password"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    edge="end"
                  >
                    {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                )
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button 
            onClick={handlePasswordChange} 
            variant="contained"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          >
            {loading ? <CircularProgress size={20} /> : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle color="error">Delete Account</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            This action cannot be undone. This will permanently delete your account and remove your data from our servers.
          </Typography>
          <Typography gutterBottom>
            Please type <strong>DELETE</strong> to confirm:
          </Typography>
          <TextField
            value={deleteConfirmation}
            onChange={(e) => setDeleteConfirmation(e.target.value)}
            placeholder="DELETE"
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={loading || deleteConfirmation !== 'DELETE'}
          >
            {loading ? <CircularProgress size={20} /> : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Avatar Selection Dialog */}
      <Dialog open={avatarDialog} onClose={() => setAvatarDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select Avatar</DialogTitle>
        <DialogContent>
          <Stack spacing={3}>
            {/* Upload Section */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Upload Custom Avatar
              </Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload-input"
                type="file"
                onChange={handleAvatarUpload}
              />
              <label htmlFor="avatar-upload-input">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCameraIcon />}
                  fullWidth
                  sx={{ py: 2 }}
                >
                  Choose Image File
                </Button>
              </label>
            </Box>

            <Divider />

            {/* Predefined Avatars */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Choose from Predefined Avatars
              </Typography>
              <Box 
                display="grid" 
                gridTemplateColumns="repeat(auto-fit, minmax(80px, 1fr))" 
                gap={2}
                sx={{ maxHeight: 300, overflowY: 'auto' }}
              >
                {predefinedAvatars.map((avatar) => (
                  <Box
                    key={avatar}
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        opacity: 0.7
                      }
                    }}
                    onClick={() => handlePredefinedAvatarSelect(avatar)}
                  >
                    <Avatar
                      src={`/assets/User Icons/${avatar}`}
                      sx={{ 
                        width: 64, 
                        height: 64,
                        border: '2px solid transparent',
                        '&:hover': {
                          borderColor: 'primary.main'
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserSettings;