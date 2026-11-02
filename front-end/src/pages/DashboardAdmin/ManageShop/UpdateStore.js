import { API_ORIGIN } from '../../../utils/apiUrl';
// UpdateStore.js
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

export default function UpdateStore({
  targetStore,
  onUpdated,
  open,
  handleClose,
}) {
  const [storeName, setStoreName] = React.useState(
    targetStore?.storeName || ""
  );
  const [description, setDescription] = React.useState(
    targetStore?.description || ""
  );
  const [bannerImageURL, setBannerImageURL] = React.useState(
    targetStore?.bannerImageURL || ""
  );
  const [status, setStatus] = React.useState(targetStore?.status || "");
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });

  React.useEffect(() => {
    setStoreName(targetStore?.storeName || "");
    setDescription(targetStore?.description || "");
    setBannerImageURL(targetStore?.bannerImageURL || "");
    setStatus(targetStore?.status || "");
  }, [targetStore, open]);

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    try {
      const reqBody = { storeName, description, bannerImageURL, status };
      const { data } = await axios.put(
        `${API_ORIGIN}/api/admin/stores/${targetStore._id}/status`, // Chỉ cập nhật status qua endpoint /status
        { status }, // Chỉ gửi status để cập nhật trạng thái
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      // Nếu cần cập nhật các trường khác, gửi thêm request tới endpoint chính
      if (
        storeName !== targetStore.storeName ||
        description !== targetStore.description ||
        bannerImageURL !== targetStore.bannerImageURL
      ) {
        await axios.put(
          `${API_ORIGIN}/api/admin/stores/${targetStore._id}`,
          { storeName, description, bannerImageURL },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
      }
      setSnackbar({
        open: true,
        msg: "Cập nhật thành công!",
        severity: "success",
      });
      if (onUpdated) onUpdated();
      handleClose();
    } catch (error) {
      setSnackbar({
        open: true,
        msg: error?.response?.data?.message || "Có lỗi xảy ra!",
        severity: "error",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 22, color: "#1976d2" }}>
          Update Store
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            To update store details, please fill out the information below and
            submit a request:
          </DialogContentText>
          <form onSubmit={handleUpdateStore} sx={{ mt: 0 }}>
            <TextField
              label="Store Name"
              variant="outlined"
              fullWidth
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Description"
              variant="outlined"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Banner Image URL"
              variant="outlined"
              fullWidth
              value={bannerImageURL}
              onChange={(e) => setBannerImageURL(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              select
              label="Status"
              variant="outlined"
              fullWidth
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
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
