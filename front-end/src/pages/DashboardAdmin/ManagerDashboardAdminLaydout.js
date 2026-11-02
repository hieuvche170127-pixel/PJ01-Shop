import { API_ORIGIN } from '../../utils/apiUrl';
import * as React from "react";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { Chip, Avatar, Badge, Paper, Tooltip } from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import Link from "@mui/material/Link";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import AuthenService from "../../services/api/AuthenService";
import { resetUserInfo } from "../../redux/slices/orebi.slice";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import PeopleIcon from "@mui/icons-material/People"; // Manage Users
import WidgetsIcon from "@mui/icons-material/Widgets"; // Manage Products
import FeedbackIcon from "@mui/icons-material/Feedback"; // Manage Disputes
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong"; // Manage Orders
import Collapse from "@mui/material/Collapse";
import DashboardIcon from "@mui/icons-material/Dashboard"; // Dashboard Overview
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import StoreIcon from "@mui/icons-material/Store";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssignmentReturnIcon from "@mui/icons-material/AssignmentReturn";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LocalOfferIcon from "@mui/icons-material/LocalOffer"; // Icon cho Voucher

import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";
import axios from "axios";

function Copyright(props) {
  return (
    <Typography
      variant="body2"
      color="text.secondary"
      align="center"
      {...props}
    >
      {"Copyright © "}
      <Link color="inherit" href="/">
        Shopii · SDN302
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const drawerWidth = 260;

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  boxShadow: "0 4px 20px 0 rgba(0,0,0,0.1)",
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  "& .MuiDrawer-paper": {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    boxSizing: "border-box",
    ...(!open && {
      overflowX: "hidden",
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      width: theme.spacing(7),
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9),
      },
    }),
  },
}));

// Custom theme
const customTheme = createTheme({
  palette: {
    primary: {
      main: "#1a237e", // Deep indigo
      light: "#534bae",
      dark: "#000051",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#ff6f00", // Amber
      light: "#ffa040",
      dark: "#c43e00",
      contrastText: "#000000",
    },
    background: {
      default: "#f5f7fa",
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            },
          },
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 4px 12px 0 rgba(0,0,0,0.05)",
        },
      },
    },
  },
});

export default function AdminDashboardLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [dashboardTitle, setDashboardTitle] = React.useState("Admin Dashboard");
  const [open, setOpen] = React.useState(true);
  const toggleDrawer = () => {
    setOpen(!open);
  };
  const adminInfo = useSelector(state => state.auth.user); 
  
  // Get current path to highlight active menu item
  const currentPath = location.pathname;

  const [openAdminMgmt, setOpenAdminMgmt] = React.useState(
    currentPath.includes("/manage-users") || currentPath.includes("/manage-stores")
  );
  
  const handleToggleAdminMgmt = () => {
    setOpenAdminMgmt((prev) => !prev);
  };

  const handleSetDashboardTitle = (newDashboardTitle) => {
    setDashboardTitle(newDashboardTitle);
  };

  const handleOnclickOverview = () => {
    navigate("/admin");
  };
  const handleOnclickUsers = () => {
    navigate("/admin/manage-users");
  };
  const handleOnclickStores = () => {
    navigate("/admin/manage-stores");
  };
  const handleOnclickProducts = () => {
    navigate("/admin/manage-products");
  };
  const handleOnclickVouchers = () => {
    navigate("/admin/manage-vouchers");
  };

  const handleOnclickSignout = async () => {
    await AuthenService.logout();
    dispatch(logout());
    dispatch(resetUserInfo());
    navigate("/signin");
  };

  return (
    <ThemeProvider theme={customTheme}>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar position="absolute" open={open} color="default">
          <Toolbar
            sx={{
              pr: "24px",
              backgroundColor: "white",
            }}
          >
            <IconButton
              edge="start"
              color="inherit"
              aria-label="open drawer"
              onClick={toggleDrawer}
              sx={{
                marginRight: "36px",
                ...(open && { display: "none" }),
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              component="h1"
              variant="h5"
              color="primary"
              noWrap
              sx={{ flexGrow: 1, fontWeight: "bold" }}
            >
              {dashboardTitle}
            </Typography>
            
            {adminInfo ? (
              <Chip
                avatar={
                  <Avatar
                    src={adminInfo.avatarURL || undefined}
                    alt={adminInfo.fullname || "Admin"}
                  />
                }
                label={adminInfo.fullname || adminInfo.username || "Admin"}
                color="primary"
                variant="outlined"
                sx={{ 
                  ml: 1, 
                  fontWeight: 600, 
                  fontSize: 16,
                  "&:hover": {
                    background: "rgba(26, 35, 126, 0.08)",
                    cursor: "pointer"
                  }
                }}
              />
            ) : (
              <Chip
                avatar={<Avatar />}
                label="Loading..."
                color="primary"
                variant="outlined"
                sx={{ ml: 2 }}
              />
            )}
          </Toolbar>
        </AppBar>
        <Drawer variant="permanent" open={open}>
          <Toolbar
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: [1],
              backgroundColor: "primary.dark",
            }}
          >
            <Typography variant="h6" color="primary.contrastText" sx={{ ml: 1, display: open ? "block" : "none" }}>
              SHOPII Admin
            </Typography>
            <IconButton onClick={toggleDrawer} sx={{ color: "primary.contrastText" }}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
          <List component="nav">
            <React.Fragment>
              <ListItemButton 
                onClick={handleOnclickOverview} 
                selected={currentPath === "/admin"}
              >
                <ListItemIcon sx={{ color: "primary.contrastText" }}>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard Overview" primaryTypographyProps={{ fontWeight: currentPath === "/admin" ? 'bold' : 'normal' }} />
              </ListItemButton>
              
              <ListItemButton onClick={handleToggleAdminMgmt}>
                <ListItemIcon sx={{ color: "primary.contrastText" }}>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="User Management" />
                {openAdminMgmt ? <ExpandLess sx={{ color: "primary.contrastText" }} /> : <ExpandMore sx={{ color: "primary.contrastText" }} />}
              </ListItemButton>
              
              <Collapse in={openAdminMgmt} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItemButton 
                    sx={{ pl: 4 }} 
                    onClick={handleOnclickUsers}
                    selected={currentPath === "/admin/manage-users"}
                  >
                    <ListItemIcon sx={{ color: "primary.contrastText" }}>
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Manage Users" 
                      primaryTypographyProps={{ 
                        fontWeight: currentPath === "/admin/manage-users" ? 'bold' : 'normal' 
                      }}
                    />
                  </ListItemButton>
                  
                  <ListItemButton 
                    sx={{ pl: 4 }} 
                    onClick={handleOnclickStores}
                    selected={currentPath === "/admin/manage-stores"}
                  >
                    <ListItemIcon sx={{ color: "primary.contrastText" }}>
                      <StoreIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Manage Shops" 
                      primaryTypographyProps={{ 
                        fontWeight: currentPath === "/admin/manage-stores" ? 'bold' : 'normal' 
                      }}
                    />
                  </ListItemButton>
                </List>
              </Collapse>
              
              <ListItemButton 
                onClick={handleOnclickProducts}
                selected={currentPath === "/admin/manage-products"}
              >
                <ListItemIcon sx={{ color: "primary.contrastText" }}>
                  <InventoryIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Manage Products" 
                  primaryTypographyProps={{ 
                    fontWeight: currentPath === "/admin/manage-products" ? 'bold' : 'normal' 
                  }}
                />
              </ListItemButton>
              
              <ListItemButton 
                onClick={handleOnclickVouchers}
                selected={currentPath === "/admin/manage-vouchers"}
              >
                <ListItemIcon sx={{ color: "primary.contrastText" }}>
                  <LocalOfferIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Manage Vouchers" 
                  primaryTypographyProps={{ 
                    fontWeight: currentPath === "/admin/manage-vouchers" ? 'bold' : 'normal' 
                  }}
                />
              </ListItemButton>

            </React.Fragment>
            <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.1)" }} />
            <React.Fragment>

              
              <ListItemButton onClick={handleOnclickSignout}>
                <ListItemIcon sx={{ color: "primary.contrastText" }}>
                  <MeetingRoomIcon />
                </ListItemIcon>
                <ListItemText primary="Sign Out" />
              </ListItemButton>
            </React.Fragment>
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            backgroundColor: "background.default",
            flexGrow: 1,
            height: "100vh",
            overflow: "auto",
          }}
        >
          <Toolbar />
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Paper
              sx={{
                p: 3,
                borderRadius: "12px",
                boxShadow: "0 4px 20px 0 rgba(0,0,0,0.05)",
                mb: 3
              }}
            >
              <Outlet context={{ handleSetDashboardTitle }} />
            </Paper>
            <Copyright sx={{ pt: 4 }} />
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
