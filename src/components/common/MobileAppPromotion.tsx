import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Smartphone, Download, QrCode } from '@mui/icons-material';

const MobileAppPromotion: React.FC = () => {
  return (
    <Paper sx={{ p: 3, mb: 3, backgroundColor: 'primary.main', color: 'white' }}>
      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems="center" gap={3}>
        <Box flex={1}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Smartphone fontSize="large" />
            <Typography variant="h6" fontWeight="bold">
              Get the Full Experience
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            Download the Afya Tracker mobile app for complete features including
            fetal kick counting, emergency alerts, and direct messaging with your healthcare provider.
          </Typography>
          <Button
            variant="contained"
            sx={{ backgroundColor: 'white', color: 'primary.main' }}
            startIcon={<Download />}
          >
            Download App
          </Button>
        </Box>
        <Box textAlign="center">
          <Box
            sx={{
              width: 120,
              height: 120,
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              borderRadius: 2,
            }}
          >
            <QrCode sx={{ fontSize: 80, color: 'primary.main' }} />
          </Box>
          <Typography variant="caption" sx={{ color: 'white', mt: 1 }}>
            Scan to download
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default MobileAppPromotion;