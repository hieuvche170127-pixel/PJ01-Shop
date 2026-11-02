import { API_ORIGIN } from '../../../utils/apiUrl';
// UpdateProduct.js
import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

export default function UpdateProduct({
  targetProduct,
  onUpdated,
  open,
  handleClose,
}) {
  const [title, setTitle] = React.useState(targetProduct?.title || "");
  const [description, setDescription] = React.useState(
    targetProduct?.description || ""
  );
  const [price, setPrice] = React.useState(targetProduct?.price || "");
  const [isActive, setIsActive] = React.useState(targetProduct?.isAuction || false);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });

  React.useEffect(() => {
    setTitle(targetProduct?.title || "");
    setDescription(targetProduct?.description || "");
    setPrice(targetProduct?.price || "");
    setIsActive(targetProduct?.isAuction || false);
  }, [targetProduct, open]);

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const reqBody = { 
        title, 
        description, 
        price,
        isAuction: isActive // Using isAuction field as isActive
      };
      const { data } = await axios.put(
        `${API_ORIGIN}/api/admin/products/${targetProduct._id}/status`,
        reqBody,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setSnackbar({
        open: true,
        msg: "Update successful!",
        severity: "success",
      });
      if (onUpdated) onUpdated();
      handleClose();
    } catch (error) {
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
          Update Product
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            To update product details, please fill out the information below and
            submit a request:
          </DialogContentText>
          <form onSubmit={handleUpdateProduct} sx={{ mt: 0 }}>
            <TextField
              label="Title"
              variant="outlined"
              fullWidth
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              label="Price"
              variant="outlined"
              fullWidth
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  color="primary"
                />
              }
              label="Active"
              sx={{ mb: 2, display: 'block' }}
            />
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
