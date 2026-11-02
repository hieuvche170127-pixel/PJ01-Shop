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
  Divider,
  Chip,
  Avatar,
  Card,
  CardContent,
  Rating,
} from "@mui/material";
import axios from "axios";
import UpdateStore from "./UpdateStore";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

export default function Stores({ stores: initialStores, onStoreUpdated }) {
  const [deletingStore, setDeletingStore] = React.useState(null);
  const [editingStore, setEditingStore] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const [keywords, setKeywords] = React.useState("");
  const [selectedStatuses, setSelectedStatuses] = React.useState([]);
  const [selectedRatingRanges, setSelectedRatingRanges] = React.useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);

  const handleDeleteStore = async () => {
    if (!deletingStore) return;

    try {
      const response = await axios.delete(
        `${API_ORIGIN}/api/admin/stores/${deletingStore._id}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("accessToken") || ""
            }`,
          },
        }
      );

      if (response.status === 200) {
        setSnackbar({
          open: true,
          msg: "Xóa cửa hàng thành công!",
          severity: "success",
        });
        setDeletingStore(null);
        onStoreUpdated(currentPage); // Tải lại trang hiện tại
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("Delete error:", error.response || error);
      setSnackbar({
        open: true,
        msg: `Lỗi khi xóa cửa hàng! ${
          error.response?.data?.message || error.message
        }`,
        severity: "error",
      });
      setDeletingStore(null);
    }
  };

  // Compute unique statuses from stores
  const statuses = React.useMemo(() => {
    const statusSet = new Set();
    initialStores.forEach((store) => {
      if (store.status) statusSet.add(store.status);
    });
    return Array.from(statusSet);
  }, [initialStores]);

  // Define rating ranges
  const ratingRanges = [
    { label: ">4", min: 4, max: 5.1 },
    { label: "3 < =<4", min: 3, max: 4 },
    { label: "2 < =<3", min: 2, max: 3 },
    { label: "=<2", min: 0, max: 2 },
  ];

  // Filter stores based on search, statuses, and rating ranges
  const filteredStores = React.useMemo(() => {
    let filtered = [...initialStores];

    // 1. Filter by search (storeName or seller username/email)
    if (keywords.trim() !== "") {
      const keywordLower = keywords.trim().toLowerCase();
      filtered = filtered.filter(
        (store) =>
          (store.storeName &&
            store.storeName.toLowerCase().includes(keywordLower)) ||
          (store.sellerId?.username &&
            store.sellerId.username.toLowerCase().includes(keywordLower)) ||
          (store.sellerId?.email &&
            store.sellerId.email.toLowerCase().includes(keywordLower))
      );
    }

    // 2. Filter by selected statuses
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((store) =>
        selectedStatuses.includes(store.status)
      );
    }

    // 3. Filter by selected rating ranges
    if (selectedRatingRanges.length > 0) {
      filtered = filtered.filter((store) => {
        const rating = store.averageRating || 0;
        return selectedRatingRanges.some((rangeLabel) => {
          const range = ratingRanges.find((r) => r.label === rangeLabel);
          return rating > range.min && rating <= range.max; // Adjusted for >4, <=5; for others >=min <max, but tweaked for labels
        });
      });
    }

    return filtered;
  }, [initialStores, keywords, selectedStatuses, selectedRatingRanges]);

  const STORES_PER_PAGE = 10;
  const totalFilteredPages = Math.ceil(filteredStores.length / STORES_PER_PAGE);
  const startIdx = (currentPage - 1) * STORES_PER_PAGE;
  const endIdx = startIdx + STORES_PER_PAGE;
  const pageData = filteredStores.slice(startIdx, endIdx);

  React.useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [selectedStatuses, keywords, selectedRatingRanges]);

  const handleStatusChange = (status) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleRatingRangeChange = (rangeLabel) => {
    setSelectedRatingRanges((prev) =>
      prev.includes(rangeLabel)
        ? prev.filter((r) => r !== rangeLabel)
        : [...prev, rangeLabel]
    );
  };

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "#4caf50";
      case "pending":
        return "#ff9800";
      case "suspended":
        return "#f44336";
      default:
        return "#757575";
    }
  };

  return (
    <React.Fragment>
      <Dialog
        open={Boolean(deletingStore)}
        onClose={() => setDeletingStore(null)}
        PaperProps={{
          sx: { 
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)" 
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <WarningAmberIcon color="error" sx={{ mr: 1 }} />
            Xác nhận xoá cửa hàng
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xoá cửa hàng <b>{deletingStore?.storeName}</b>{" "}
            này không? Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setDeletingStore(null)} 
            color="inherit" 
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Huỷ
          </Button>
          <Button 
            onClick={handleDeleteStore} 
            color="error" 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              boxShadow: "none",
              '&:hover': {
                boxShadow: "0 4px 12px rgba(244,67,54,0.25)"
              }
            }}
          >
            Xoá
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
          sx={{ borderRadius: 2 }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>

      <Box
        sx={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(240,245,250,0.8) 100%)",
          p: 2,
          borderRadius: 3,
          minHeight: "80vh",
        }}
      >
        <Box 
          display="flex" 
          alignItems="center"
          mb={3}
          p={1}
        >
          <StorefrontIcon sx={{ fontSize: 28, mr: 1, color: "primary.main" }} />
          <Typography variant="h5" fontWeight={600} color="primary.main">
            Manage Stores
          </Typography>
          <Box flexGrow={1} />
          <Typography variant="body2" color="text.secondary">
            {filteredStores.length} stores found
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                bgcolor: "background.paper",
                p: 1,
                border: "1px solid",
                borderColor: "divider",
                height: '100%',
              }}
            >
              <CardContent>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="600"
                    color="text.primary"
                  >
                    <FilterAltIcon
                      fontSize="small"
                      sx={{ mr: 0.5, color: "primary.main" }}
                    />
                    Filters
                  </Typography>
                  {(selectedStatuses.length > 0 ||
                    selectedRatingRanges.length > 0) && (
                    <Tooltip title="Clear all">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedStatuses([]);
                          setSelectedRatingRanges([]);
                          setKeywords("");
                        }}
                        sx={{ 
                          bgcolor: 'rgba(0,0,0,0.04)',
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.08)'
                          }
                        }}
                      >
                        <ClearAllIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {/* Search */}
                <Box mb={3}>
                  <TextField
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    size="small"
                    fullWidth
                    label="Search stores"
                    placeholder="Enter store name or seller"
                    InputProps={{ 
                      endAdornment: <SearchIcon color="action" />,
                      sx: {
                        borderRadius: 2,
                        bgcolor: "background.paper"
                      }
                    }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Status Filter */}
                <Box mb={3}>
                  <Typography
                    variant="subtitle2"
                    color="text.primary"
                    sx={{ fontWeight: 600, mb: 1.5 }}
                  >
                    Status
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1
                    }}
                  >
                    {statuses.map((status) => (
                      <Chip
                        key={status}
                        label={status}
                        variant={selectedStatuses.includes(status) ? "filled" : "outlined"}
                        onClick={() => handleStatusChange(status)}
                        sx={{
                          borderRadius: 1.5,
                          bgcolor: selectedStatuses.includes(status) ? `${getStatusColor(status)}20` : 'transparent',
                          borderColor: selectedStatuses.includes(status) ? getStatusColor(status) : 'divider',
                          color: selectedStatuses.includes(status) ? getStatusColor(status) : 'text.secondary',
                          fontWeight: selectedStatuses.includes(status) ? 600 : 400,
                          '&:hover': {
                            bgcolor: selectedStatuses.includes(status) ? `${getStatusColor(status)}30` : 'rgba(0,0,0,0.04)'
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Rating Filter */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    color="text.primary"
                    sx={{ fontWeight: 600, mb: 1.5 }}
                  >
                    Rating
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5
                    }}
                  >
                    {ratingRanges.map((range) => (
                      <Box 
                        key={range.label}
                        onClick={() => handleRatingRangeChange(range.label)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          p: 1,
                          borderRadius: 2,
                          cursor: 'pointer',
                          bgcolor: selectedRatingRanges.includes(range.label) ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                          '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.04)'
                          }
                        }}
                      >
                        <Checkbox
                          checked={selectedRatingRanges.includes(range.label)}
                          size="small"
                          sx={{ p: 0.5, mr: 1 }}
                        />
                        <Box>
                          <Typography variant="body2">{range.label}</Typography>
                          {range.label === ">4" && (
                            <Rating name="read-only" value={4.5} precision={0.5} size="small" readOnly />
                          )}
                          {range.label === "3 < =<4" && (
                            <Rating name="read-only" value={3.5} precision={0.5} size="small" readOnly />
                          )}
                          {range.label === "2 < =<3" && (
                            <Rating name="read-only" value={2.5} precision={0.5} size="small" readOnly />
                          )}
                          {range.label === "=<2" && (
                            <Rating name="read-only" value={1.5} precision={0.5} size="small" readOnly />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={9}>
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow
                    sx={{
                      bgcolor: "background.paper",
                      "& th": {
                        fontWeight: 600,
                        py: 1.5,
                      },
                    }}
                  >
                    <TableCell>Store Name</TableCell>
                    <TableCell>Seller Full Name</TableCell>
                    <TableCell>Seller Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageData.map((store) => (
                    <TableRow
                      key={store._id}
                      sx={{
                        "&:hover": {
                          bgcolor: "rgba(0,0,0,0.02)",
                        },
                        "& td": {
                          py: 1.5,
                        },
                        borderBottom: "1px solid",
                        borderColor: "divider"
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light' }}>
                            {store.storeName?.charAt(0) || 'S'}
                          </Avatar>
                          <Typography fontWeight={500}>{store.storeName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{store.sellerId?.username || "N/A"}</TableCell>
                      <TableCell>{store.sellerId?.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={store.status} 
                          size="small"
                          sx={{ 
                            bgcolor: `${getStatusColor(store.status)}20`,
                            color: getStatusColor(store.status),
                            fontWeight: 500,
                            borderRadius: 1
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating
                            value={store.averageRating || 0}
                            precision={0.5}
                            size="small"
                            readOnly
                          />
                          <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                            {store.averageRating ? store.averageRating.toFixed(1) : "N/A"}
                            <Typography component="span" variant="caption" sx={{ ml: 0.5 }}>
                              ({store.totalReviews || 0})
                            </Typography>
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="Edit Store">
                            <IconButton
                              color="primary"
                              onClick={() => setEditingStore(store)}
                              size="small"
                              sx={{ 
                                bgcolor: 'rgba(25,118,210,0.08)',
                                mr: 1,
                                '&:hover': {
                                  bgcolor: 'rgba(25,118,210,0.15)'
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Store">
                            <IconButton
                              color="error"
                              onClick={() => setDeletingStore(store)}
                              size="small"
                              sx={{ 
                                bgcolor: 'rgba(244,67,54,0.08)',
                                '&:hover': {
                                  bgcolor: 'rgba(244,67,54,0.15)'
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pageData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No stores found matching the filters
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                page={currentPage}
                count={totalFilteredPages}
                onChange={handlePageChange}
                color="primary"
                variant="outlined"
                shape="rounded"
                showFirstButton
                showLastButton
                sx={{ 
                  '& .MuiPaginationItem-root': {
                    borderRadius: 1,
                    mx: 0.2
                  }
                }}
              />
            </Box>

            {editingStore && (
              <UpdateStore
                targetStore={editingStore}
                onUpdated={() => {
                  onStoreUpdated(currentPage);
                  setEditingStore(null);
                }}
                open={Boolean(editingStore)}
                handleClose={() => setEditingStore(null)}
              />
            )}
          </Grid>
        </Grid>
      </Box>
    </React.Fragment>
  );
}
