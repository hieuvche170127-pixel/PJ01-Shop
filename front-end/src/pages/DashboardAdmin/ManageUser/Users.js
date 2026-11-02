import { API_ORIGIN } from '../../../utils/apiUrl';
import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Tooltip from "@mui/material/Tooltip";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  TableContainer,
  TextField,
  Typography,
  Grid,
  Avatar,
  Chip,
  InputAdornment,
  Card,
  CardContent,
  Divider,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
} from "@mui/material";
import axios from "axios";
import UpdateUser from "./UpdateUser";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import StorefrontIcon from "@mui/icons-material/Storefront";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LockPersonIcon from "@mui/icons-material/LockPerson";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import BlockIcon from "@mui/icons-material/Block";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Title from "../Title";

  // Component to display user status
const UserStatusChip = ({ status }) => {
  let color = "default";
  let label = status || "Unknown";
  
  switch(status) {
    case "active":
      color = "success";
      break;
    case "pending":
      color = "warning";
      break;
    case "lock":
      color = "error";
      break;
    case "unlock":
      color = "primary";
      break;
    default:
      color = "default";
  }
  
  return (
    <Chip 
      label={label} 
      color={color} 
      size="small" 
      variant="outlined"
      sx={{ fontWeight: 500, textTransform: 'capitalize' }} 
    />
  );
};

// Component cho Role Icon
const RoleIcon = ({ role }) => {
  switch (role) {
    case "admin":
      return <AdminPanelSettingsIcon color="primary" />;
    case "seller":
      return <StorefrontIcon color="secondary" />;
    default:
      return <PersonIcon color="action" />;
  }
};

export default function Users({ users: initialUsers, onUserUpdated }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [deletingUser, setDeletingUser] = React.useState(null);
  const [editingUser, setEditingUser] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const [keywords, setKeywords] = React.useState("");
  const [selectedRoles, setSelectedRoles] = React.useState([]);
  const [actionFilter, setActionFilter] = React.useState("all");
  const [currentPage, setCurrentPage] = React.useState(1);
  
  // For actions menu
  const [actionMenuAnchor, setActionMenuAnchor] = React.useState(null);
  const [selectedUser, setSelectedUser] = React.useState(null);

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const response = await axios.delete(
        `${API_ORIGIN}/api/admin/users/${deletingUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("accessToken") || ""
            }`,
          },
          params: { skipAuth: true }, // Chỉ dùng nếu backend xử lý skipAuth
        }
      );

      if (response.status === 200) {
        setSnackbar({
          open: true,
          msg: "User deleted successfully!",
          severity: "success",
        });
        setDeletingUser(null);
        onUserUpdated(currentPage); // Reload current page
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("Delete error:", error.response || error);
      setSnackbar({
        open: true,
        msg: `Error deleting user! ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
      setDeletingUser(null);
    }
  };

  // Compute unique roles from users
  const roles = React.useMemo(() => {
    const roleSet = new Set();
    initialUsers.forEach((user) => {
      if (user.role) roleSet.add(user.role);
    });
    return Array.from(roleSet);
  }, [initialUsers]);

  // Filter users based on search, roles, and action
  const filteredUsers = React.useMemo(() => {
    let filtered = [...initialUsers];

    // 1. Filter by search (username or email)
    if (keywords.trim() !== "") {
      const keywordLower = keywords.trim().toLowerCase();
      filtered = filtered.filter(
        (user) =>
          (user.username &&
            user.username.toLowerCase().includes(keywordLower)) ||
          (user.email && user.email.toLowerCase().includes(keywordLower))
      );
    }

    // 2. Filter by selected roles
    if (selectedRoles.length > 0) {
      filtered = filtered.filter((user) => selectedRoles.includes(user.role));
    }

    // 3. Filter by action status
    if (actionFilter === "lock") {
      filtered = filtered.filter((user) => user.action === "lock");
    } else if (actionFilter === "unlock") {
      filtered = filtered.filter((user) => user.action === "unlock");
    }

    return filtered;
  }, [initialUsers, keywords, selectedRoles, actionFilter]);

  const USERS_PER_PAGE = 10;
  const totalFilteredPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const startIdx = (currentPage - 1) * USERS_PER_PAGE;
  const endIdx = startIdx + USERS_PER_PAGE;
  const pageData = filteredUsers.slice(startIdx, endIdx);

  React.useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedRoles, actionFilter, keywords]);

  const handleRoleChange = (role) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };
  
  // Action menu handlers
  const handleOpenActionMenu = (event, user) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };
  
  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
  };
  
  const handleUserAction = (action) => {
    if (action === 'edit' && selectedUser) {
      setEditingUser(selectedUser);
    } else if (action === 'delete' && selectedUser) {
      setDeletingUser(selectedUser);
    }
    handleCloseActionMenu();
  };

  return (
    <React.Fragment>
      <Dialog
        open={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <DeleteIcon color="error" sx={{ mr: 1 }} />
            Confirm User Deletion
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user{" "}
            <b>{deletingUser?.username || deletingUser?.email}</b>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingUser(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
      
      {editingUser && (
        <UpdateUser
          user={editingUser}
          open={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          onUpdated={(success) => {
            setEditingUser(null);
            if (success) {
                    setSnackbar({
        open: true,
        msg: "User updated successfully!",
        severity: "success",
      });
              onUserUpdated(currentPage);
            }
          }}
        />
      )}

      <Box mb={4}>
        <Title highlight={true}>User Management</Title>
        
        <Box mb={3}>
          <Typography variant="body2" color="text.secondary">
            Manage all users in the system, including admins, sellers, and buyers.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              mb: 3,
            }}
          >
            <CardContent>
              <Typography 
                variant="subtitle1" 
                fontWeight="bold" 
                color="primary"
                sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
              >
                <FilterAltIcon sx={{ mr: 1 }} fontSize="small" />
                Filters
              </Typography>
              
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Search
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Name or email..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Role
                </Typography>
                <FormGroup>
                  {roles.map((role) => (
                    <FormControlLabel
                      key={role}
                      control={
                        <Checkbox
                          checked={selectedRoles.includes(role)}
                          onChange={() => handleRoleChange(role)}
                          size="small"
                          color="primary"
                        />
                      }
                      label={
                        <Box display="flex" alignItems="center">
                          <RoleIcon role={role} />
                          <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                            {role}
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Status
                </Typography>
                <RadioGroup
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                >
                  <FormControlLabel
                    value="all"
                    control={<Radio size="small" color="primary" />}
                    label="All"
                  />
                  <FormControlLabel
                    value="unlock"
                    control={<Radio size="small" color="primary" />}
                    label={
                      <Box display="flex" alignItems="center">
                        <LockOpenIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                        <Typography variant="body2">Active</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="lock"
                    control={<Radio size="small" color="primary" />}
                    label={
                      <Box display="flex" alignItems="center">
                        <LockPersonIcon fontSize="small" color="error" sx={{ mr: 1 }} />
                        <Typography variant="body2">Locked</Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </Box>
              
              <Button
                startIcon={<ClearAllIcon />}
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => {
                  setKeywords("");
                  setSelectedRoles([]);
                  setActionFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
          
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                  Statistics
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Total Users:</Typography>
                  <Typography variant="body2" fontWeight="bold">{initialUsers.length}</Typography>
                </Box>
                
                {roles.map(role => {
                  const count = initialUsers.filter(u => u.role === role).length;
                  return (
                    <Box key={role} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {role}:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">{count}</Typography>
                    </Box>
                  );
                })}
                
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Locked:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    {initialUsers.filter(u => u.action === "lock").length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={9}>
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  <Badge 
                    badgeContent={filteredUsers.length} 
                    color="primary"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', height: '18px', minWidth: '18px' } }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" mr={1}>
                      User List
                    </Typography>
                  </Badge>
                </Typography>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                <Table sx={{ minWidth: 650 }} size="small" aria-label="user table">
                  <TableHead sx={{ bgcolor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>User Information</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pageData.length > 0 ? (
                      pageData.map((user) => (
                        <TableRow
                          key={user._id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                        >
                          <TableCell component="th" scope="row" sx={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {user._id}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Avatar 
                                src={user.avatarURL} 
                                alt={user.username || user.email}
                                sx={{ width: 36, height: 36, mr: 1.5 }}
                              />
                              <Box>
                                <Typography variant="body2" fontWeight="bold" component="div">
                                  {user.username || "N/A"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontSize="small">
                                  {user.email || "No email"}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <RoleIcon role={user.role} />
                              <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                                {user.role || "User"}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <UserStatusChip status={user.action || "unknown"} />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              aria-label="actions"
                              onClick={(e) => handleOpenActionMenu(e, user)}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography variant="body1" color="text.secondary">
                            No users found matching your criteria.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box display="flex" justifyContent="center">
                <Pagination
                  count={totalFilteredPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Actions menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseActionMenu}
        PaperProps={{
          sx: { minWidth: 180, boxShadow: '0px 2px 10px rgba(0,0,0,0.1)', borderRadius: 2 }
        }}
      >
        <MenuItem onClick={() => handleUserAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUserAction('view')}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleUserAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
        {selectedUser?.action === 'unlock' && (
          <MenuItem onClick={() => handleUserAction('lock')}>
            <ListItemIcon>
              <LockPersonIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Lock Account</ListItemText>
          </MenuItem>
        )}
        {selectedUser?.action === 'lock' && (
          <MenuItem onClick={() => handleUserAction('unlock')}>
            <ListItemIcon>
              <LockOpenIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Unlock Account</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </React.Fragment>
  );
}
