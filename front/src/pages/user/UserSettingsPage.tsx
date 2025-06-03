import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user/userService';

const UserSettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('profile');
  
  // Profile settings
  const [profileSettings, setProfileSettings] = useState({
    name: '',
    email: '',
    bio: '',
    notificationPreferences: {
      email: true,
      push: true
    }
  });
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
  });
  
  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    showProfileToPublic: true,
    showActivityToPublic: true,
    showEnrollmentsToPublic: false
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  useEffect(() => {
    if (user?.walletAddress) {
      fetchUserSettings();
    }
  }, [user?.walletAddress]);
  
  const fetchUserSettings = async () => {
    if (!user?.walletAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      userService.setWalletAddress(user.walletAddress);
      const settings = await userService.getUserSettings();
      
      // Set profile settings
      setProfileSettings({
        name: settings.name || '',
        email: settings.email || '',
        bio: settings.bio || '',
        notificationPreferences: {
          email: settings.notificationPreferences?.email ?? true,
          push: settings.notificationPreferences?.push ?? true
        }
      });
      
      // Set security settings
      setSecuritySettings({
        twoFactorEnabled: settings.twoFactorEnabled || false
      });
      
      // Set privacy settings
      setPrivacySettings({
        showProfileToPublic: settings.privacySettings?.showProfileToPublic ?? true,
        showActivityToPublic: settings.privacySettings?.showActivityToPublic ?? true,
        showEnrollmentsToPublic: settings.privacySettings?.showEnrollmentsToPublic ?? false
      });
      
    } catch (err: any) {
      console.error('Error fetching user settings:', err);
      setError(err.message || 'Error loading settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    
    if (name.startsWith('notification.')) {
      const notificationKey = name.split('.')[1];
      setProfileSettings({
        ...profileSettings,
        notificationPreferences: {
          ...profileSettings.notificationPreferences,
          [notificationKey]: checked
        }
      });
    } else {
      setProfileSettings({
        ...profileSettings,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  
  const handlePrivacyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setPrivacySettings({
      ...privacySettings,
      [name]: checked
    });
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.walletAddress) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      userService.setWalletAddress(user.walletAddress);
      await userService.updateUserProfile({
        name: profileSettings.name,
        email: profileSettings.email,
        bio: profileSettings.bio,
        notificationPreferences: profileSettings.notificationPreferences
      });
      
      setSuccess('Profile settings updated successfully');
      await refreshUser();
      
    } catch (err: any) {
      console.error('Error updating profile settings:', err);
      setError(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };
  
  const handlePrivacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.walletAddress) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      userService.setWalletAddress(user.walletAddress);
      await userService.updatePrivacySettings(privacySettings);
      
      setSuccess('Privacy settings updated successfully');
      
    } catch (err: any) {
      console.error('Error updating privacy settings:', err);
      setError(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };
  
  const handleToggle2FA = async () => {
    if (!user?.walletAddress) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      userService.setWalletAddress(user.walletAddress);
      
      if (securitySettings.twoFactorEnabled) {
        await userService.disable2FA();
        setSecuritySettings({ ...securitySettings, twoFactorEnabled: false });
        setSuccess('Two-factor authentication disabled');
      } else {
        const setupInfo = await userService.setup2FA();
        // In a real app, you'd show the QR code or setup instructions
        // For this demo, we'll just toggle it on
        setSecuritySettings({ ...securitySettings, twoFactorEnabled: true });
        setSuccess('Two-factor authentication enabled');
      }
      
    } catch (err: any) {
      console.error('Error toggling 2FA:', err);
      setError(err.message || 'Error updating security settings');
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!user?.walletAddress) return;
    
    // This would typically have a confirmation dialog in a real app
    const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
    
    if (!confirmed) return;
    
    try {
      setSaving(true);
      setError(null);
      
      userService.setWalletAddress(user.walletAddress);
      await userService.deleteAccount();
      
      // Log out the user
      logout();
      
      // Redirect would happen automatically via the AuthProvider
      
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Error deleting account');
      setSaving(false);
    }
  };
  
  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <h4>Authentication Required</h4>
          <p>Please connect your wallet to access your settings.</p>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-primary text-white">
          <h2 className="mb-0">Account Settings</h2>
        </Card.Header>
        <Card.Body>
          <p className="lead mb-4">
            Customize your account preferences and settings.
          </p>
          
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading settings...</p>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
                  {success}
                </Alert>
              )}
              
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => k && setActiveTab(k)}
                className="mb-4"
              >
                <Tab eventKey="profile" title="Profile Settings">
                  <Form onSubmit={handleProfileSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Display Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={profileSettings.name}
                        onChange={handleProfileChange}
                        placeholder="Your name"
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={profileSettings.email}
                        onChange={handleProfileChange}
                        placeholder="Your email"
                      />
                      <Form.Text className="text-muted">
                        Used for notifications and account recovery.
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Bio</Form.Label>
                      <Form.Control
                        as="textarea"
                        name="bio"
                        value={profileSettings.bio}
                        onChange={handleProfileChange}
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    </Form.Group>
                    
                    <h5 className="mb-3">Notification Preferences</h5>
                    <Form.Group className="mb-2">
                      <Form.Check
                        type="checkbox"
                        id="notification-email"
                        name="notification.email"
                        label="Email notifications"
                        checked={profileSettings.notificationPreferences.email}
                        onChange={handleProfileChange}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Check
                        type="checkbox"
                        id="notification-push"
                        name="notification.push"
                        label="Push notifications"
                        checked={profileSettings.notificationPreferences.push}
                        onChange={handleProfileChange}
                      />
                    </Form.Group>
                    
                    <div className="d-flex justify-content-end">
                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Spinner as="span" size="sm" animation="border" className="me-2" />
                            Saving...
                          </>
                        ) : 'Save Profile Settings'}
                      </Button>
                    </div>
                  </Form>
                </Tab>
                
                <Tab eventKey="privacy" title="Privacy">
                  <Form onSubmit={handlePrivacySubmit}>
                    <h5 className="mb-3">Profile Visibility</h5>
                    
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="show-profile"
                        name="showProfileToPublic"
                        label="Show my profile to the public"
                        checked={privacySettings.showProfileToPublic}
                        onChange={handlePrivacyChange}
                      />
                      <Form.Text className="text-muted">
                        When disabled, only you and course instructors can see your profile.
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        id="show-activity"
                        name="showActivityToPublic"
                        label="Show my learning activity to the public"
                        checked={privacySettings.showActivityToPublic}
                        onChange={handlePrivacyChange}
                      />
                      <Form.Text className="text-muted">
                        When disabled, only you and course instructors can see your learning activity.
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-4">
                      <Form.Check
                        type="checkbox"
                        id="show-enrollments"
                        name="showEnrollmentsToPublic"
                        label="Show my course enrollments to the public"
                        checked={privacySettings.showEnrollmentsToPublic}
                        onChange={handlePrivacyChange}
                      />
                      <Form.Text className="text-muted">
                        When disabled, only you and course instructors can see which courses you're enrolled in.
                      </Form.Text>
                    </Form.Group>
                    
                    <div className="d-flex justify-content-end">
                      <Button 
                        type="submit" 
                        variant="primary"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Spinner as="span" size="sm" animation="border" className="me-2" />
                            Saving...
                          </>
                        ) : 'Save Privacy Settings'}
                      </Button>
                    </div>
                  </Form>
                </Tab>
                
                <Tab eventKey="security" title="Security">
                  <h5 className="mb-3">Two-Factor Authentication</h5>
                  <p className="text-muted mb-3">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  
                  <div className="d-flex align-items-center mb-4">
                    <div>
                      <h6 className="mb-0">Status: <span className={securitySettings.twoFactorEnabled ? 'text-success' : 'text-danger'}>
                        {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </span></h6>
                    </div>
                    <div className="ms-auto">
                      <Button 
                        variant={securitySettings.twoFactorEnabled ? 'outline-danger' : 'outline-success'}
                        onClick={handleToggle2FA}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Spinner as="span" size="sm" animation="border" className="me-2" />
                            Processing...
                          </>
                        ) : securitySettings.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                      </Button>
                    </div>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <h5 className="mb-3 text-danger">Danger Zone</h5>
                  <p className="text-muted mb-3">
                    Permanently delete your account and all associated data.
                  </p>
                  
                  <Button 
                    variant="danger" 
                    onClick={handleDeleteAccount}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Spinner as="span" size="sm" animation="border" className="me-2" />
                        Processing...
                      </>
                    ) : 'Delete Account'}
                  </Button>
                </Tab>
              </Tabs>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default UserSettingsPage; 