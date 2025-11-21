import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Avatar,
  Fade,
  Slide,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Timeline,
  Warning,
  Phone,
  TrendingUp,
  Security,
  SmartToy,
  ArrowForward,
  PlayArrow,
  Android,
  Apple,
  QrCode,
  Close,
  Download,
  Info,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <Timeline sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'Fetal Kick Tracking',
      description: 'Monitor and record fetal movements with our intuitive kick counting system. Track patterns and get insights about your baby\'s health.',
      color: 'primary.main',
    },
    {
      icon: <Warning sx={{ fontSize: 48, color: 'error.main' }} />,
      title: 'Emergency Alerts',
      description: 'Instant emergency alerts to healthcare providers. Get immediate assistance when you need it most during your pregnancy.',
      color: 'error.main',
    },
    {
      icon: <Phone sx={{ fontSize: 48, color: 'success.main' }} />,
      title: '24/7 Support',
      description: 'Connect with healthcare professionals anytime. Video consultations, chat support, and emergency response around the clock.',
      color: 'success.main',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 48, color: 'info.main' }} />,
      title: 'Health Analytics',
      description: 'Comprehensive health tracking with detailed analytics. Monitor your pregnancy progress and receive personalized insights.',
      color: 'info.main',
    },
    {
      icon: <Security sx={{ fontSize: 48, color: 'warning.main' }} />,
      title: 'Secure & Private',
      description: 'Your health data is protected with enterprise-grade security. HIPAA compliant and fully encrypted.',
      color: 'warning.main',
    },
    {
      icon: <SmartToy sx={{ fontSize: 48, color: 'secondary.main' }} />,
      title: 'AI-Powered Insights',
      description: 'Advanced AI analyzes your data to provide personalized recommendations and early warning signs.',
      color: 'secondary.main',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Wanjiku',
      role: 'New Mother',
      avatar: 'SW',
      content: 'Afya Tracker helped me stay connected with my doctor throughout my pregnancy. The kick counting feature gave me peace of mind.',
      rating: 5,
    },
    {
      name: 'Dr. Grace Omondi',
      role: 'Obstetrician',
      avatar: 'GO',
      content: 'This platform has revolutionized how I monitor my patients. Real-time alerts and comprehensive tracking save lives.',
      rating: 5,
    },
    {
      name: 'Mary Kiprop',
      role: 'Expecting Mother',
      avatar: 'MK',
      content: 'The emergency alert feature was a lifesaver. I got immediate help when I needed it most.',
      rating: 5,
    },
  ];

  const stats = [
    { number: '10,000+', label: 'Lives Monitored' },
    { number: '500+', label: 'Healthcare Providers' },
    { number: '98%', label: 'Satisfaction Rate' },
    { number: '24/7', label: 'Support Available' },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % features.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + features.length) % features.length);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Navigation Bar */}
      <AppBar position="static" sx={{ backgroundColor: 'rgba(10, 141, 146, 0.95)', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Afya Tracker
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tabs value={activeTab} onChange={(event, newValue) => setActiveTab(newValue)} textColor="inherit">
              <Tab
                icon={<Download />}
                label="Download"
                onClick={() => setDownloadDialogOpen(true)}
              />
              <Tab
                icon={<Info />}
                label="About Us"
                onClick={() => {
                  // Scroll to about section or show about dialog
                  document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </Tabs>
            <Button
              color="inherit"
              sx={{ ml: 2 }}
              onClick={() => navigate('/patient/signup')}
            >
              Sign Up
            </Button>
            <Button
              color="inherit"
              variant="outlined"
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': { borderColor: 'grey.300', backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
              onClick={() => navigate('/patient/login')}
            >
              Login
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0A8D92 0%, #4FB3B7 50%, #FFB6C1 100%)',
          color: 'white',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" gap={4}>
            <Box flex={1}>
              <Fade in={isVisible} timeout={1000}>
                <Box>
                  <Typography
                    variant="h2"
                    fontWeight="bold"
                    gutterBottom
                    sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}
                  >
                    Welcome to
                    <br />
                    <Box component="span" sx={{ color: 'secondary.main' }}>
                      Afya Tracker
                    </Box>
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
                    Your trusted companion for a healthy pregnancy journey
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 4, fontSize: '1.1rem' }}>
                    Monitor fetal movements, connect with healthcare providers, and get emergency support
                    when you need it most. Join thousands of families who trust Afya Tracker.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="large"
                      sx={{
                        backgroundColor: 'white',
                        color: 'primary.main',
                        '&:hover': { backgroundColor: 'grey.100' },
                        px: 4,
                        py: 1.5,
                      }}
                      onClick={() => navigate('/patient/signup')}
                    >
                      Get Started
                      <ArrowForward sx={{ ml: 1 }} />
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        '&:hover': { borderColor: 'grey.300', backgroundColor: 'rgba(255,255,255,0.1)' },
                        px: 4,
                        py: 1.5,
                      }}
                      onClick={() => setDownloadDialogOpen(true)}
                    >
                      Download App
                      <Download sx={{ ml: 1 }} />
                    </Button>
                  </Box>
                </Box>
              </Fade>
            </Box>
            <Box flex={1} textAlign="center">
              <Slide direction="left" in={isVisible} timeout={1500}>
                <Box
                  sx={{
                    height: 400,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="img"
                    src="/assets/pregnant mother.png"
                    alt="Pregnant Mother"
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: 4,
                    }}
                  />
                </Box>
              </Slide>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box display="flex" flexWrap="wrap" justifyContent="center" gap={4}>
          {stats.map((stat, index) => (
            <Box key={index} textAlign="center" sx={{ flex: '1 1 200px' }}>
              <Zoom in={isVisible} timeout={1000 + index * 200}>
                <Box>
                  <Typography
                    variant="h3"
                    fontWeight="bold"
                    color="primary"
                    gutterBottom
                  >
                    {stat.number}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </Zoom>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Features Section */}
      <Box id="features-section" sx={{ backgroundColor: 'grey.50', py: 8 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Why Choose Afya Tracker?
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Comprehensive pregnancy monitoring with cutting-edge technology
            </Typography>
          </Box>

          <Box display="flex" flexWrap="wrap" gap={4} justifyContent="center">
            {features.map((feature, index) => (
              <Box key={index} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
                <Slide direction={index % 2 === 0 ? 'right' : 'left'} in={isVisible} timeout={1000 + index * 200}>
                  <Card
                    sx={{
                      height: '100%',
                      transition: 'transform 0.3s',
                      '&:hover': { transform: 'translateY(-8px)' },
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 4 }}>
                      <Box sx={{ mb: 3 }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h5" fontWeight="bold" gutterBottom>
                        {feature.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Slide>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box textAlign="center" mb={6}>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            What Our Users Say
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Real stories from real families
          </Typography>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={4} justifyContent="center">
          {testimonials.map((testimonial, index) => (
            <Box key={index} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
              <Fade in={isVisible} timeout={1000 + index * 300}>
                <Card sx={{ height: '100%', p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {testimonial.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {testimonial.role}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                    "{testimonial.content}"
                  </Typography>
                  <Box>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Chip key={i} label="★" size="small" color="warning" variant="outlined" />
                    ))}
                  </Box>
                </Card>
              </Fade>
            </Box>
          ))}
        </Box>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0A8D92 0%, #4FB3B7 100%)',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Ready to Start Your Journey?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join thousands of families who trust Afya Tracker for their pregnancy monitoring needs
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': { backgroundColor: 'grey.100' },
                px: 6,
                py: 2,
              }}
              onClick={() => navigate('/patient/signup')}
            >
              Start Tracking Now
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
                px: 6,
                py: 2,
              }}
              onClick={() => navigate('/provider/signup')}
            >
              Join as Healthcare Provider
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ backgroundColor: 'grey.900', color: 'white', py: 4 }}>
        <Container maxWidth="lg">
          <Box textAlign="center">
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Afya Tracker
            </Typography>
            <Typography variant="body2" color="grey.400">
              © 2024 Afya Tracker. All rights reserved. | Privacy Policy | Terms of Service
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Download App Dialog */}
      <Dialog
        open={downloadDialogOpen}
        onClose={() => setDownloadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Typography variant="h5" fontWeight="bold" color="primary">
            Download Afya Tracker
          </Typography>
          <IconButton
            onClick={() => setDownloadDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Choose your platform to download the app
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Android />}
              sx={{
                backgroundColor: '#3ddc84',
                color: 'white',
                '&:hover': { backgroundColor: '#2e7d32' },
                py: 2,
                borderRadius: 2,
              }}
              onClick={() => {
                // Handle Android download
                window.open('https://play.google.com/store/apps/details?id=com.afyatracker', '_blank');
                setDownloadDialogOpen(false);
              }}
            >
              Download for Android
            </Button>
            <Button
              variant="contained"
              size="large"
              startIcon={<Apple />}
              sx={{
                backgroundColor: '#000000',
                color: 'white',
                '&:hover': { backgroundColor: '#333333' },
                py: 2,
                borderRadius: 2,
              }}
              onClick={() => {
                // Handle iOS download
                window.open('https://apps.apple.com/app/afya-tracker/id1234567890', '_blank');
                setDownloadDialogOpen(false);
              }}
            >
              Download for iOS
            </Button>
            <Box sx={{ mt: 2, p: 2, border: '2px dashed', borderColor: 'primary.main', borderRadius: 2 }}>
              <QrCode sx={{ fontSize: 60, color: 'primary.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Or scan QR code with your phone
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default LandingPage;