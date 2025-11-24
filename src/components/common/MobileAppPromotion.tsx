import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Smartphone, Download, QrCode } from '@mui/icons-material';
import QRCode from 'qrcode';

const MobileAppPromotion: React.FC = () => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Direct APK download URL from GitHub releases
  const apkDownloadUrl = 'https://github.com/Awemick/afya_tracker_web_app/releases/download/vr.1.0/Afya.Tracker.apk';

  useEffect(() => {
    // Generate QR code for APK download
    QRCode.toDataURL(apkDownloadUrl, {
      width: 120,
      margin: 1,
      color: {
        dark: '#1976d2', // Primary color
        light: '#ffffff' // White background
      }
    })
      .then(url => {
        setQrCodeDataUrl(url);
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
      });
  }, []);

  const handleDownload = () => {
    // Create a temporary link element and trigger direct APK download
    const link = document.createElement('a');
    link.href = apkDownloadUrl;
    link.download = 'afya-tracker.apk';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              sx={{ backgroundColor: 'white', color: 'primary.main' }}
              startIcon={<Download />}
              onClick={handleDownload}
            >
              Download APK Now
            </Button>
            <Button
              variant="outlined"
              sx={{ borderColor: 'white', color: 'white' }}
              startIcon={<QrCode />}
              onClick={() => window.open(apkDownloadUrl, '_blank')}
            >
              Direct APK Link
            </Button>
          </Box>
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
              cursor: 'pointer',
            }}
            onClick={() => window.open(apkDownloadUrl, '_blank')}
          >
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Download Afya Tracker APK"
                style={{ width: '100%', height: '100%', borderRadius: '8px' }}
              />
            ) : (
              <QrCode sx={{ fontSize: 80, color: 'primary.main' }} />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: 'white', mt: 1 }}>
            Scan QR code to download APK
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mt: 0.5 }}>
            Or click to open download link
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default MobileAppPromotion;