import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user/userService';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<any>({
    name: '',
    bio: '',
    avatarUrl: '',
    socialLinks: {
      twitter: '',
      github: '',
      linkedin: ''
    }
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  useEffect(() => {
    if (user?.walletAddress) {
      fetchUserProfile();
    }
  }, [user?.walletAddress]);
  
  const fetchUserProfile = async () => {
    if (!user?.walletAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      userService.setWalletAddress(user.walletAddress);
      const userData = await userService.getUserDetails(user.walletAddress);
      
      setProfile({
        name: userData.displayName || '',
        bio: userData.bio || '',
        avatarUrl: userData.avatarUrl || '',
        socialLinks: {
          twitter: userData.socialLinks?.twitter || '',
          github: userData.socialLinks?.github || '',
          linkedin: userData.socialLinks?.linkedin || ''
        }
      });
      
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Error loading profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfile({
        ...profile,
        [parent]: {
          ...profile[parent],
          [child]: value
        }
      });
    } else {
      setProfile({
        ...profile,
        [name]: value
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.walletAddress) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      userService.setWalletAddress(user.walletAddress);
      await userService.updateUserProfile(profile);
      
      setSuccess(true);
      await refreshUser();
      
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Error saving profile');
    } finally {
      setSaving(false);
    }
  };
  
  if (!user) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <h4>Authentication Required</h4>
          <p>Please connect your wallet to access your profile.</p>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-5">
      <Row>
        <Col lg={8} className="mx-auto">
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h2 className="mb-0">Your Profile</h2>
            </Card.Header>
            
            {loading ? (
              <Card.Body className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading profile...</p>
              </Card.Body>
            ) : (
              <Card.Body>
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}
                
                {success && (
                  <Alert variant="success" dismissible onClose={() => setSuccess(false)}>
                    Profile updated successfully!
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={4} className="mb-4 text-center">
                      <div className="mb-3">
                        <img 
                          src={profile.avatarUrl || 'https://via.placeholder.com/150'} 
                          alt="Profile" 
                          className="rounded-circle img-thumbnail" 
                          style={{ width: 150, height: 150, objectFit: 'cover' }}
                        />
                      </div>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Avatar URL</Form.Label>
                        <Form.Control
                          type="text"
                          name="avatarUrl"
                          value={profile.avatarUrl}
                          onChange={handleInputChange}
                          placeholder="https://..."
                        />
                      </Form.Group>
                      
                      <p className="mb-2">Wallet Address:</p>
                      <code className="small d-block text-truncate">
                        {user.walletAddress}
                      </code>
                    </Col>
                    
                    <Col md={8}>
                      <Form.Group className="mb-3">
                        <Form.Label>Display Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={profile.name}
                          onChange={handleInputChange}
                          placeholder="Your name"
                          required
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Label>Bio</Form.Label>
                        <Form.Control
                          as="textarea"
                          name="bio"
                          value={profile.bio}
                          onChange={handleInputChange}
                          placeholder="Tell us about yourself"
                          rows={3}
                        />
                      </Form.Group>
                      
                      <h5>Social Links</h5>
                      <hr className="my-3" />
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Twitter</Form.Label>
                        <Form.Control
                          type="text"
                          name="socialLinks.twitter"
                          value={profile.socialLinks.twitter}
                          onChange={handleInputChange}
                          placeholder="https://twitter.com/username"
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>GitHub</Form.Label>
                        <Form.Control
                          type="text"
                          name="socialLinks.github"
                          value={profile.socialLinks.github}
                          onChange={handleInputChange}
                          placeholder="https://github.com/username"
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Label>LinkedIn</Form.Label>
                        <Form.Control
                          type="text"
                          name="socialLinks.linkedin"
                          value={profile.socialLinks.linkedin}
                          onChange={handleInputChange}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={saving}>
                      {saving ? (
                        <>
                          <Spinner as="span" size="sm" animation="border" className="me-2" />
                          Saving...
                        </>
                      ) : 'Save Profile'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfilePage; 