import React from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
  Dashboard,
  Timeline,
  Assignment,
  Link,
  Folder,
  People,
  Logout,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { logoutUser } from '../../services/authService';
import { toggleTheme } from '../../store/slices/themeSlice';
import { RootState } from '../../store/store';

interface PatientNavigationProps {
  children: React.ReactNode;
}

const PatientNavigation: React.FC<PatientNavigationProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode } = useSelector((state: RootState) => state.theme);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/patient/dashboard' },
    { text: 'Timeline', icon: <Timeline />, path: '/patient/timeline' },
    { text: 'Tasks', icon: <Assignment />, path: '/patient/tasks' },
    { text: 'Connections', icon: <Link />, path: '/patient/connections' },
    { text: 'Records', icon: <Folder />, path: '/patient/records' },
    { text: 'Care Team', icon: <People />, path: '/patient/care-team' },
  ];

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    handleClose();
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still logout locally even if Firebase logout fails
      dispatch(logout());
      navigate('/login');
    }
    handleClose();
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const currentPage = menuItems.find(item => item.path === location.pathname)?.text || 'Dashboard';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="static"
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: 1,
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMenu}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {currentPage}
          </Typography>

          {/* Theme Toggle */}
          <IconButton
            size="large"
            color="inherit"
            onClick={handleThemeToggle}
            sx={{ mr: 1 }}
          >
            {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>

          {/* Desktop Menu */}
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              {menuItems.map((item) => (
                <IconButton
                  key={item.text}
                  color="inherit"
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    color: location.pathname === item.path ? theme.palette.primary.main : 'inherit',
                  }}
                >
                  {item.icon}
                </IconButton>
              ))}
              <IconButton color="inherit" onClick={handleLogout}>
                <Logout />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Menu */}
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {menuItems.map((item) => (
          <MenuItem
            key={item.text}
            onClick={() => handleNavigate(item.path)}
            selected={location.pathname === item.path}
          >
            {item.icon}
            <Typography sx={{ ml: 1 }}>{item.text}</Typography>
          </MenuItem>
        ))}
        <MenuItem onClick={handleLogout}>
          <Logout />
          <Typography sx={{ ml: 1 }}>Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 0 }}>
        {children}
      </Box>
    </Box>
  );
};

export default PatientNavigation;