import { API_ORIGIN } from '../../../utils/apiUrl';
import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export default function UpdateUser({
  targetUser,
  onUpdated,
  open,
  handleClose,
}) {
  const [username, setUsername] = React.useState(targetUser?.username || "");
  const [email, setEmail] = React.useState(targetUser?.email || "");
  const [role, setRole] = React.useState(targetUser?.role || "");
  const [action, setAction] = React.useState(targetUser?.action || "");
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });

  React.useEffect(() => {
    setUsername(targetUser?.username || "");
    setEmail(targetUser?.email || "");
    setRole(targetUser?.role || "");
    setAction(targetUser?.action || "");
  }, [targetUser, open]);

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const reqBody = { username, email, role, action };
      const response = await axios.put(
        `${API_ORIGIN}/api/admin/users/${targetUser._id}`,
        reqBody,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      if (response.status === 200) {
        setSnackbar({
          open: true,
          msg: "Update successful!",
          severity: "success",
        });
        onUpdated(true);
      }
      handleClose();
    } catch (error) {
      console.error("Update error:", error);
      setSnackbar({
        open: true,
        msg: error?.response?.data?.message || "An error occurred!",
        severity: "error",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, color: "#1976d2" }}>
          Update User
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            To update user details, please fill out the information below and
            submit a request:
          </DialogContentText>
          <form onSubmit={handleUpdateUser} sx={{ mt: 0 }}>
            <TextField
              label="User Name"
              variant="outlined"
              fullWidth
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              label="Role"
              variant="outlined"
              fullWidth
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="seller">Seller</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
            <TextField
              select
              label="Action"
              variant="outlined"
              fullWidth
              value={action}
              onChange={(e) => setAction(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="lock">Lock</MenuItem>
              <MenuItem value="unlock">Unlock</MenuItem>
            </TextField>
            <DialogActions sx={{ mt: 2, px: 0 }}>
              <Button onClick={handleClose} variant="text" color="secondary">
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Save
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.msg}</Alert>
      </Snackbar>
    </>
  );
}
