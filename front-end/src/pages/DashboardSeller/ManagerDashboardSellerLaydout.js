import * as React from 'react';
import { styled, createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { Chip, Avatar } from '@mui/material'
import IconButton from '@mui/material/IconButton';
import Container from '@mui/material/Container';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import Link from '@mui/material/Link';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import AuthenService from '../../services/api/AuthenService';
import SellerService from '../../services/api/SellerService';
import { resetUserInfo } from "../../redux/slices/orebi.slice";
import { useDispatch } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import WarehouseIcon from '@mui/icons-material/Warehouse';   // Tồn kho
import StorefrontIcon from '@mui/icons-material/Storefront';
import WidgetsIcon from '@mui/icons-material/Widgets';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import FeedbackIcon from '@mui/icons-material/Feedback';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import Collapse from '@mui/material/Collapse';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping'; // Thêm icon mới
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home'; // Add Home icon

import {
  Outlet,
  useNavigate
} from "react-router-dom";
import { useState } from 'react';
import { useEffect } from 'react';
import axios from 'axios';

function Copyright(props) {
  return (
    <Typography variant="body2" color="text.secondary" align="center" {...props}>
      {'Copyright © '}
      <Link color="inherit" href="/">
        Shopii · SDN302
      </Link>{' '}
      {new Date().getFullYear()}
      {'.'}
    </Typography>
  );
}

const drawerWidth = 260;

// Custom theme with a modern color palette
const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', // Vibrant blue
      light: '#3b82f6',
      dark: '#1d4ed8'
    },
    secondary: {
      main: '#8b5cf6', // Purple
      light: '#a78bfa',
      dark: '#7c3aed'
    },
    success: {
      main: '#10b981', // Green
      light: '#34d399',
      dark: '#059669'
    },
    error: {
      main: '#ef4444', // Red
      light: '#f87171',
      dark: '#dc2626'
    },
    warning: {
      main: '#f59e0b', // Amber
      light: '#fbbf24',
      dark: '#d97706'
    },
    info: {
      main: '#0ea5e9', // Sky blue
      light: '#38bdf8',
      dark: '#0284c7'
    },
    background: {
      default: '#f9fafb', // Light gray background
      paper: '#ffffff'
    },
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
      disabled: '#9ca3af'
    },
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10
        }
      }
    }
  }
});

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth,
      backgroundColor: theme.palette.background.paper,
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      boxSizing: 'border-box',
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        width: theme.spacing(7),
        [theme.breakpoints.up('sm')]: {
          width: theme.spacing(9),
        },
      }),
      '& .MuiListItemButton-root': {
        borderRadius: theme.shape.borderRadius,
        margin: '0 8px',
        marginBottom: '4px',
      },
      '& .MuiListItemIcon-root': {
        color: theme.palette.primary.main,
        minWidth: 36,
      },
      '& .MuiListItemText-root': {
        fontSize: '0.9rem',
      },
    },
  }),
);

// Enhanced list item for sidebar menu
const StyledListItemButton = styled(ListItemButton)(({ theme, selected }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: '4px 8px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.light + '20',
  },
  ...(selected && {
    backgroundColor: theme.palette.primary.light + '20',
    '&:hover': {
      backgroundColor: theme.palette.primary.light + '30',
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
    '& .MuiListItemText-primary': {
      fontWeight: 600,
      color: theme.palette.primary.main,
    },
  }),
}));

export default function ManagerDashboardSellerLaydout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [dashboardTitle, setDashboardTitle] = React.useState("Dashboard");
  const [open, setOpen] = React.useState(true);
  const [currentPath, setCurrentPath] = useState("");
  const toggleDrawer = () => {
    setOpen(!open);
  };
  const [storeInfo, setStoreInfo] = useState(null);

  useEffect(() => {
    SellerService.getStoreProfile()
      .then(res => setStoreInfo(res.data))
      .catch(() => setStoreInfo(null));
    
    // Track current path for highlighting active menu items
    const path = window.location.pathname;
    setCurrentPath(path);
  }, []);

  const [openOrderMgmt, setOpenOrderMgmt] = React.useState(false);
  const handleToggleOrderMgmt = () => {
    setOpenOrderMgmt((prev) => !prev);
  };

  const handleSetDashboardTitle = (newDashboardTitle) => {
    setDashboardTitle(newDashboardTitle);
  }

  const isActive = (path) => {
    return currentPath.includes(path);
  };

  const handleOnclickOverview = () => {
    navigate("/overview");
    setCurrentPath("/overview");
  }
  const handleOnclickProducts = () => {
    navigate("/manage-product");
    setCurrentPath("/manage-product");
  }

  const handleOnclickStoreProfile = () => {
    navigate("/manage-store");
    setCurrentPath("/manage-store");
  };

  const handleOnclickInventory = () => {
    navigate("/manage-inventory");
    setCurrentPath("/manage-inventory");
  }

  const handleOnclickOrder = () => {
    navigate("/manage-order");
    setCurrentPath("/manage-order");
  };
  const handleOnclickDispute = () => {
    navigate("/manage-dispute");
    setCurrentPath("/manage-dispute");
  }
  const handleOnclickReturnRequest = () => {
    navigate("/manage-return-request");
    setCurrentPath("/manage-return-request");
  }

  // Thêm hàm xử lý click cho quản lý vận chuyển
  const handleOnclickShipping = () => {
    navigate("/manage-shipping");
    setCurrentPath("/manage-shipping");
  };
  
  // Add handler for home button click
  const handleOnclickHome = () => {
    navigate("/");
  };

  const handleOnclickSignout = async () => {
    try {
      // Call the AuthenService logout method which clears all tokens
      await AuthenService.logout();
      
      // Use the logout action from authSlice to clean up Redux state
      dispatch(logout());
      
      // Also reset user info in orebi slice
      dispatch(resetUserInfo());
      
      // Redirect to signin page
      navigate('/signin');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation to signin even if there's an error
      navigate('/signin');
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="absolute" open={open}>
          <Toolbar
            sx={{
              pr: '24px',
              '&.MuiToolbar-root': {
                height: 70
              }
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: '36px',
                ...(open && { display: 'none' }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h5"
              color="inherit"
              noWrap
              sx={{ 
                flexGrow: 1,
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}
            >
              {dashboardTitle}
            </Typography>
            {storeInfo ? (
              <Chip
                avatar={
                  <Avatar 
                    src={storeInfo.sellerId.avatarURL} 
                    alt={storeInfo.sellerId.fullname}
                    sx={{ 
                      width: 32, 
                      height: 32,
                      border: '2px solid white' 
                    }}
                  />
                }
                label={storeInfo.sellerId.fullname}
                sx={{ 
                  ml: 2, 
                  fontWeight: 600, 
                  fontSize: 16,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  color: 'white',
                  '& .MuiChip-label': { px: 2 },
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  height: 38
                }}
              />
            ) : (
              <Chip 
                avatar={<Avatar />} 
                label="Loading..." 
                sx={{ 
                  ml: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  color: 'white'
                }} 
              />
            )}
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
              height: 70, // Match height with AppBar
              borderBottom: '1px solid #f1f5f9'
            }}
          >
            {open && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                flex: 1,
                justifyContent: 'space-between'
              }}>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 700,
                    color: theme.palette.primary.main,
                    ml: 2,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <StorefrontIcon sx={{ mr: 1 }} />
                  Seller Portal
                </Typography>
              </Box>
            )}
            <IconButton onClick={toggleDrawer}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Box 
            sx={{
              height: 'calc(100vh - 70px)', 
              overflowY: 'auto',
              py: 2,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#e2e8f0',
                borderRadius: '10px'
              }
            }}
          >
            <List component="nav">
              <StyledListItemButton 
                onClick={handleOnclickOverview} 
                selected={isActive("/overview")}
                sx={{ mb: 1 }}
              >
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Dashboard" />}
              </StyledListItemButton>
              
              <StyledListItemButton 
                onClick={handleOnclickHome} 
                sx={{ mb: 1 }}
              >
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Go to Shop" />}
              </StyledListItemButton>
              
              {open && (
                <Box sx={{ mx: 2, mt: 2, mb: 1 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    fontWeight={600}
                    sx={{ pl: 1 }}
                  >
                    STORE MANAGEMENT
                  </Typography>
                </Box>
              )}
              
              <StyledListItemButton 
                onClick={handleOnclickStoreProfile} 
                selected={isActive("/manage-store")}
              >
                <ListItemIcon>
                  <StorefrontIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Store Profile" />}
              </StyledListItemButton>
              
              <StyledListItemButton 
                onClick={handleOnclickProducts}
                selected={isActive("/manage-product")}
              >
                <ListItemIcon>
                  <WidgetsIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Products" />}
              </StyledListItemButton>
              
              <StyledListItemButton 
                onClick={handleOnclickInventory}
                selected={isActive("/manage-inventory")}
              >
                <ListItemIcon>
                  <WarehouseIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Inventory" />}
              </StyledListItemButton>
              
              {open && (
                <Box sx={{ mx: 2, mt: 2, mb: 1 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    fontWeight={600}
                    sx={{ pl: 1 }}
                  >
                    ORDERS & SHIPPING
                  </Typography>
                </Box>
              )}

              <StyledListItemButton 
                onClick={handleOnclickOrder}
                selected={isActive("/manage-order")}
              >
                <ListItemIcon>
                  <ShoppingCartIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Orders" />}
              </StyledListItemButton>

              <StyledListItemButton 
                onClick={handleOnclickShipping}
                selected={isActive("/manage-shipping")}
              >
                <ListItemIcon>
                  <LocalShippingIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Shipping" />}
              </StyledListItemButton>
              
              
              
              {open && (
                <Box sx={{ mx: 2, mt: 2, mb: 1 }}>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    fontWeight={600}
                    sx={{ pl: 1 }}
                  >
                    CUSTOMER SERVICE
                  </Typography>
                </Box>
              )}
              
              <StyledListItemButton 
                onClick={handleOnclickReturnRequest}
                selected={isActive("/manage-return-request")}
              >
                <ListItemIcon>
                  <KeyboardReturnIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Return Requests" />}
              </StyledListItemButton>
              
              <StyledListItemButton 
                onClick={handleOnclickDispute}
                selected={isActive("/manage-dispute")}
              >
                <ListItemIcon>
                  <FeedbackIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Disputes" />}
              </StyledListItemButton>
              
              <Divider sx={{ my: 2 }} />
              
              <StyledListItemButton 
                onClick={handleOnclickSignout}
                sx={{ 
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: 'error.light',
                    opacity: 0.1
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'error.main' }}>
                  <MeetingRoomIcon />
                </ListItemIcon>
                {open && <ListItemText primary="Sign Out" />}
              </StyledListItemButton>
            </List>
            
            {open && (
              <Box sx={{ mt: 4, px: 2 }}>
                <Copyright />
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  align="center" 
                  display="block" 
                  sx={{ mt: 1 }}
                >
                  v1.0.0
                </Typography>
              </Box>
            )}
          </Box>
        </Drawer>
        <Box
          component="main"
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? '#f9fafb'
                : theme.palette.grey[900],
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          <Toolbar sx={{ height: 70 }} />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box
              sx={{
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                p: { xs: 2, md: 3 }
              }}
            >
              <Outlet context={{ handleSetDashboardTitle }} />
            </Box>
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
