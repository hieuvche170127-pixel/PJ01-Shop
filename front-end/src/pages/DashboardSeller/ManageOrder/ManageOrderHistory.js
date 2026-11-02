import { formatVND } from '../../../utils/currency';
import React, { useEffect, useState } from "react";
import {
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Box,
  TextField,
  Stack,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableContainer,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Pagination,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  Badge,
  IconButton,
  CardContent,
  Card,
  Menu,
  DialogActions,
  Snackbar,
  Alert,
  Grid,
  Tooltip,
  Container,
  Divider,
  Avatar,
  useTheme
} from "@mui/material";
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloseIcon from '@mui/icons-material/Close';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CancelIcon from '@mui/icons-material/Cancel';
import MoneyIcon from '@mui/icons-material/Money';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import PaymentsIcon from '@mui/icons-material/Payments';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { useOutletContext } from "react-router-dom";
import { api } from "../../../services/index";

function groupByOrderId(orderItems) {
  const orders = {};
  orderItems.forEach(item => {
    const oid = item.orderId?._id;
    if (!oid) return;
    if (!orders[oid]) {
      orders[oid] = {
        ...item.orderId,
        address: item.orderId?.addressId,
        products: [],
      };
    }
    orders[oid].products.push(item);
  });
  return Object.values(orders);
}

export default function ManageOrderHistory() {
  const theme = useTheme();
  const { handleSetDashboardTitle } = useOutletContext();
  const [orderItems, setOrderItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchField, setSearchField] = useState("orderId");
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Stats dialog
  const [openStatsDialog, setOpenStatsDialog] = useState(false);
  const handleOpenStatsDialog = () => setOpenStatsDialog(true);
  const handleCloseStatsDialog = () => setOpenStatsDialog(false);

  // Status update menu and dialog
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderPayment, setOrderPayment] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paymentConfirmDialog, setPaymentConfirmDialog] = useState(false);
  const [paymentStatusToUpdate, setPaymentStatusToUpdate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const ordersPerPage = 5;

  useEffect(() => {
    handleSetDashboardTitle("Order History");
    fetchOrderHistory();
    // eslint-disable-next-line
  }, []);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("seller/orders/history");
      console.log("Order history response:", res.data);
      setOrderItems(res.data.data || []);
      setFilteredItems(res.data.data || []);
      setPage(1);
    } catch (error) {
      console.error("Error fetching order history:", error);
      setOrderItems([]);
      setFilteredItems([]);
      setPage(1);
    }
    setLoading(false);
  };

  // Handle status update menu
  const handleMenuOpen = (event, orderItem) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrderItem(orderItem);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusOptionClick = (status) => {
    setStatusToUpdate(status);
    setConfirmDialogOpen(true);
    handleMenuClose();
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrderItem || !statusToUpdate) return;
    
    try {
      setLoadingAction(true);
      const response = await api.put(`seller/orders/item/${selectedOrderItem._id}/status`, {
        status: statusToUpdate
      });
      
      console.log("Status update response:", response.data);
      
      // Update local state to reflect the change
      const updatedItems = orderItems.map(item => {
        if (item._id === selectedOrderItem._id) {
          return {
            ...item,
            status: statusToUpdate,
            shippingInfo: statusToUpdate === "shipping" ? response.data.data.shippingInfo : item.shippingInfo
          };
        }
        return item;
      });
      
      setOrderItems(updatedItems);
      setFilteredItems(updatedItems);
      
      // Show success message
      setSnackbarMessage(`Order status updated to ${statusToUpdate}`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
    } catch (error) {
      console.error("Error updating status:", error);
      setSnackbarMessage(`Failed to update status: ${error.response?.data?.message || error.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoadingAction(false);
      handleConfirmDialogClose();
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Payment management functions
  const handleOpenPaymentDialog = async (order) => {
    setSelectedOrder(order);
    setLoadingPayment(true);
    setPaymentDialogOpen(true);
    
    try {
      const response = await api.get(`seller/orders/${order._id}/payment`);
      console.log("Payment info response:", response.data);
      setOrderPayment(response.data.data || null);
    } catch (error) {
      console.error("Error fetching payment info:", error);
      setOrderPayment(null);
      setSnackbarMessage(`Failed to fetch payment info: ${error.response?.data?.message || error.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setOrderPayment(null);
  };

  const handleOpenPaymentConfirmDialog = (status) => {
    setPaymentStatusToUpdate(status);
    setPaymentConfirmDialog(true);
  };

  const handleClosePaymentConfirmDialog = () => {
    setPaymentConfirmDialog(false);
  };

  const handleUpdatePaymentStatus = async () => {
    if (!orderPayment || !paymentStatusToUpdate) return;
    
    try {
      setLoadingAction(true);
      const response = await api.put(`seller/payments/${orderPayment.payment.id}/status`, {
        status: paymentStatusToUpdate
      });
      
      console.log("Payment status update response:", response.data);
      
      // Reload actual aggregate payment: another shop may still need to collect its share.
      const refreshed = await api.get(`seller/orders/${orderPayment.order.id}/payment`);
      setOrderPayment(refreshed.data.data);

      // Show success message
      setSnackbarMessage(`Đã xác nhận thu COD cho phần hàng của shop`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error updating payment status:", error);
      const errorMessage = error.response?.data?.message || error.message;
      setSnackbarMessage(`Unable to update payment status: ${errorMessage}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoadingAction(false);
      handleClosePaymentConfirmDialog();
    }
  };

  // Search function
  const handleSearchAll = () => {
    if (!orderItems) return;
    const filtered = orderItems.filter(item => {
      let passDateFilter = true;
      if (fromDate) {
        const orderDate = new Date(item.orderId?.orderDate);
        const fromDateTime = new Date(fromDate);
        passDateFilter = passDateFilter && orderDate >= fromDateTime;
      }
      if (toDate) {
        const orderDate = new Date(item.orderId?.orderDate);
        const toDateTime = new Date(toDate);
        toDateTime.setHours(23, 59, 59, 999); // End of day
        passDateFilter = passDateFilter && orderDate <= toDateTime;
      }

      // Filter by ID
      let passIdFilter = true;
      if (searchValue) {
        if (searchField === "orderId") {
          passIdFilter = item.orderId?._id?.toString().includes(searchValue);
        } else if (searchField === "orderItemId") {
          passIdFilter = item._id?.toString().includes(searchValue);
        }
      }

      // Filter by status
      let passStatusFilter = true;
      if (statusFilter && statusFilter !== "all") {
        passStatusFilter = item.status === statusFilter;
      }

      return passDateFilter && passIdFilter && passStatusFilter;
    });
    setFilteredItems(filtered);
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setSearchField("orderId");
    setSearchValue("");
    setStatusFilter("");
    setFilteredItems(orderItems);
  };

  // Group by Order ID for display
  const groupedOrders = groupByOrderId(filteredItems);
  
  // Sort by date (newest first)
  groupedOrders.sort((a, b) => {
    const dateA = a.orderDate ? new Date(a.orderDate) : new Date(0);
    const dateB = b.orderDate ? new Date(b.orderDate) : new Date(0);
    return dateB - dateA;
  });

  // Calculate stats for display
  const calcOrderStats = (groupedOrders) => {
    let shipped = 0, shippedAmount = 0;
    let pending = 0, shipping = 0, expectedAmount = 0;
    groupedOrders.forEach(order => {
      order.products.forEach(prod => {
        const totalPrice = (prod.unitPrice || 0) * (prod.quantity || 0);
        if (prod.status === "shipped") {
          shipped += 1;
          shippedAmount += totalPrice;
        }
        if (prod.status === "pending") {
          pending += 1;
          expectedAmount += totalPrice;
        }
        if (prod.status === "shipping") {
          shipping += 1;
          expectedAmount += totalPrice;
        }
      });
    });
    return {
      shipped, shippedAmount,
      pending, shipping, expected: pending + shipping, expectedAmount
    };
  };
  const { shipped, shippedAmount, pending, shipping, expected, expectedAmount } = calcOrderStats(groupedOrders);

  // Pagination
  const paginatedOrders = groupedOrders.slice(
    (page - 1) * ordersPerPage,
    page * ordersPerPage
  );
  const totalPages = Math.ceil(groupedOrders.length / ordersPerPage);

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  // Render payment status chip
  const renderPaymentStatusChip = (status) => {
    switch (status) {
      case "paid":
        return <Chip size="small" icon={<MoneyIcon />} label="Paid" color="success" />;
      case "pending":
        return <Chip size="small" icon={<PendingActionsIcon />} label="Pending" color="warning" />;
      case "failed":
        return <Chip size="small" icon={<MoneyOffIcon />} label="Failed" color="error" />;
      default:
        return <Chip size="small" label={status || "Unknown"} />;
    }
  };

  // Render order status chip
  const renderOrderStatusChip = (status) => {
    switch (status) {
      case "pending":
        return <Chip size="small" icon={<PendingActionsIcon />} label="Pending" color="warning" />;
      case "shipping":
        return <Chip size="small" icon={<LocalShippingIcon />} label="Shipping" color="info" />;
      case "shipped":
        return <Chip size="small" icon={<ShoppingCartIcon />} label="Shipped" color="success" />;
      case "rejected":
        return <Chip size="small" icon={<CancelIcon />} label="Rejected" color="error" />;
      default:
        return <Chip size="small" label={status || "Unknown"} />;
    }
  };

  return (
    <Container maxWidth="xl">
      {/* Filter Section */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          background: theme.palette.background.paper,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              type="date"
              label="From Date"
              InputLabelProps={{ shrink: true }}
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              type="date"
              label="To Date"
              InputLabelProps={{ shrink: true }}
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status"
                onChange={e => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="shipping">Shipping</MenuItem>
                <MenuItem value="shipped">Shipped</MenuItem>
                <MenuItem value="failed to ship">Failed to ship</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel id="search-field-label">Search By</InputLabel>
              <Select
                labelId="search-field-label"
                value={searchField}
                onChange={e => setSearchField(e.target.value)}
                label="Search By"
              >
                <MenuItem value="orderId">Order ID</MenuItem>
                <MenuItem value="orderItemId">Order Item ID</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Enter Value"
              size="small"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearchAll(); }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'center', md: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearchAll}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={handleReset}
              >
                Reset
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="40vh">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Orders Table */}
          <Paper
            elevation={3}
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
              mb: 3,
            }}
          >
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
                  <TableRow>
                    <TableCell width="40%" sx={{ color: 'white', fontWeight: 'bold' }}>Order Details</TableCell>
                    <TableCell width="50%" sx={{ color: 'white', fontWeight: 'bold' }}>Order Items</TableCell>
                    <TableCell width="10%" sx={{ color: 'white', fontWeight: 'bold' }}>Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <Typography variant="subtitle1" color="text.secondary">
                          No orders found.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {paginatedOrders.map(order => (
                    <TableRow key={order._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      {/* Order Details + Shipping Address */}
                      <TableCell sx={{ verticalAlign: 'top' }}>
                        <Box mb={2}>
                          <Typography variant="subtitle1" fontWeight="bold" color="primary">
                            <ReceiptIcon sx={{ fontSize: 20, mr: 0.5, verticalAlign: 'text-bottom' }} />
                            Order #{order._id.slice(-6)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Order date: {order.orderDate
                              ? new Date(order.orderDate).toLocaleString("en-US", {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : "-"}
                          </Typography>
                        </Box>
                        
                        {/* Payment Info Button */}
                        <Button 
                          startIcon={<PaymentsIcon />}
                          size="small" 
                          variant="outlined"
                          color="primary"
                          onClick={() => handleOpenPaymentDialog(order)}
                          sx={{ mb: 2 }}
                        >
                          Payment Details
                        </Button>
                        
                        {/* Shipping Address */}
                        {order.address && (
                          <Box 
                            p={1.5} 
                            mt={1}
                            bgcolor="background.default"
                            borderRadius={1}
                            border="1px solid"
                            borderColor="divider"
                          >
                            <Typography variant="subtitle2" gutterBottom>
                              <AccountCircleIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'text-bottom', color: 'primary.main' }} />
                              {order.address.fullName}
                            </Typography>
                            <Typography variant="body2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon fontSize="small" sx={{ mr: 0.5, fontSize: '1rem', color: 'text.secondary' }} />
                              {order.address.phone}
                            </Typography>
                            <Typography variant="body2" sx={{ display: 'flex' }}>
                              <LocationOnIcon fontSize="small" sx={{ mr: 0.5, mt: 0.3, flexShrink: 0, fontSize: '1rem', color: 'text.secondary' }} />
                              <span>
                                {order.address.street}, {order.address.city}, {order.address.state}, {order.address.country}
                              </span>
                            </Typography>
                          </Box>
                        )}
                      </TableCell>

                      {/* Order Items List */}
                      <TableCell>
                        {order.products.map((item) => (
                          <Box 
                            key={item._id} 
                            sx={{ 
                              mb: 2,
                              p: 1.5, 
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              '&:hover': { 
                                boxShadow: 1,
                                borderColor: 'primary.light' 
                              }
                            }}
                          >
                            <Box sx={{ display: "flex" }}>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle2" fontWeight="medium">
                                  {item.productId?.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Quantity: {item.quantity} | Price: {formatVND(item.unitPrice)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Category: {item.productId?.categoryId?.name || 'N/A'}
                                </Typography>
                                <Box sx={{ mt: 1 }}>
                                  {renderOrderStatusChip(item.status)}
                                </Box>
                              </Box>
                              <IconButton
                                size="small"
                                disabled={item.status !== 'pending'}
                                onClick={(e) => handleMenuOpen(e, item)}
                                sx={{ alignSelf: 'flex-start' }}
                              >
                                <MoreVertIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        ))}
                      </TableCell>

                      {/* Order Total */}
                      <TableCell>
                        <Typography 
                          fontWeight="bold" 
                          color="primary"
                          sx={{
                            fontSize: '1.1rem',
                            display: 'inline-block',
                            bgcolor: 'primary.lightest',
                            p: 1,
                            borderRadius: 1,
                          }}
                        >
                          {formatVND(order.totalPrice)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Pagination */}
          {groupedOrders.length > 0 && (
            <Box
              sx={{
                mt: 3,
                mb: 5,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Pagination
                count={totalPages}
                page={page}
                onChange={handleChangePage}
                siblingCount={1}
                boundaryCount={1}
                size="large"
                showFirstButton
                showLastButton
                variant="outlined"
                shape="rounded"
                color="primary"
              />
            </Box>
          )}

          {/* Stats FAB and Card */}
          <Fab
            color="primary"
            aria-label="order-stats"
            onClick={handleOpenStatsDialog}
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              zIndex: 1301,
            }}
            size="medium"
          >
            <Badge color="secondary">
              <ShoppingCartIcon />
            </Badge>
          </Fab>

          <Card
            sx={{
              position: 'fixed',
              bottom: 88,
              right: 32,
              width: 320,
              borderRadius: 2,
              boxShadow: 6,
              zIndex: 1400,
              display: openStatsDialog ? 'block' : 'none'
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight={700}>Order Statistics</Typography>
                <IconButton size="small" onClick={handleCloseStatsDialog}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Avatar 
                  sx={{ bgcolor: theme.palette.success.main, width: 40, height: 40 }}
                >
                  <LocalShippingIcon />
                </Avatar>
                <Box>
                  <Typography fontWeight={600}>Total paid (shipped):</Typography>
                  <Typography color="success.main" fontWeight={600}>
                    {formatVND(shippedAmount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {shipped} shipped items
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" alignItems="center" gap={1}>
                <Avatar 
                  sx={{ bgcolor: theme.palette.warning.main, width: 40, height: 40 }}
                >
                  <PendingActionsIcon />
                </Avatar>
                <Box>
                  <Typography fontWeight={600}>To be paid (pending, shipping):</Typography>
                  <Typography color="warning.main" fontWeight={600}>
                    {formatVND(expectedAmount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({pending} pending, {shipping} shipping)
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Status Update Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 3,
              sx: { borderRadius: 2, minWidth: 180 }
            }}
          >
            <MenuItem onClick={() => handleStatusOptionClick("shipping")} sx={{ py: 1 }}>
              <LocalShippingIcon fontSize="small" sx={{ mr: 2, color: "info.main" }} />
              Mark as Shipping
            </MenuItem>
            <MenuItem onClick={() => handleStatusOptionClick("rejected")} sx={{ py: 1 }}>
              <CancelIcon fontSize="small" sx={{ mr: 2, color: "error.main" }} />
              Reject Order
            </MenuItem>
          </Menu>

          {/* Status Update Confirmation Dialog */}
          <Dialog 
            open={confirmDialogOpen} 
            onClose={handleConfirmDialogClose}
            PaperProps={{ sx: { borderRadius: 2 } }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              {statusToUpdate === "shipping" ? "Confirm Shipping" : "Confirm Rejection"}
            </DialogTitle>
            <DialogContent sx={{ pb: 2 }}>
              <Typography>
                {statusToUpdate === "shipping" 
                  ? "Are you sure you want to mark this order as shipping? A shipping record with tracking number will be created."
                  : "Are you sure you want to reject this order? This action cannot be undone."}
              </Typography>
              {selectedOrderItem && (
                <Box 
                  mt={2} 
                  p={2} 
                  bgcolor="background.default" 
                  borderRadius={1}
                  border="1px solid"
                  borderColor="divider"
                >
                  <Typography variant="subtitle2" display="block" gutterBottom>
                    <strong>Product:</strong> {selectedOrderItem.productId?.title}
                  </Typography>
                  <Typography variant="body2" display="block" gutterBottom>
                    <strong>Order Item ID:</strong> {selectedOrderItem._id}
                  </Typography>
                  <Typography variant="body2" display="block" gutterBottom>
                    <strong>Quantity:</strong> {selectedOrderItem.quantity}
                  </Typography>
                  <Typography variant="body2" display="block">
                    <strong>Price:</strong> {formatVND(selectedOrderItem.unitPrice)}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button 
                onClick={handleConfirmDialogClose} 
                disabled={loadingAction}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateStatus} 
                color={statusToUpdate === "shipping" ? "primary" : "error"}
                variant="contained"
                disabled={loadingAction}
                startIcon={loadingAction ? <CircularProgress size={16} /> : null}
              >
                {loadingAction ? "Processing..." : statusToUpdate === "shipping" ? "Confirm Shipping" : "Confirm Rejection"}
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Payment Dialog */}
          <Dialog 
            open={paymentDialogOpen} 
            onClose={handleClosePaymentDialog}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
          >
            <DialogTitle sx={{ pb: 1 }}>
              Payment Information
              <IconButton
                onClick={handleClosePaymentDialog}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              {loadingPayment ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : orderPayment ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                      Order Details
                    </Typography>
                    <Box 
                      p={2} 
                      mt={1} 
                      mb={2}
                      bgcolor="background.default"
                      borderRadius={1}
                      border="1px solid"
                      borderColor="divider"
                    >
                      <Typography variant="body1" gutterBottom>
                        <strong>Order ID:</strong> {orderPayment.order.id}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Tổng COD đơn:</strong> {orderPayment.payment.amount.toLocaleString('vi-VN')} ₫
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                      Payment Details
                    </Typography>
                    <Box 
                      p={2}
                      bgcolor="background.default"
                      borderRadius={1}
                      border="1px solid"
                      borderColor="divider"
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography sx={{ mr: 1 }}><strong>Status:</strong></Typography> 
                        {renderPaymentStatusChip(orderPayment.payment.status)}
                      </Box>
                      <Typography variant="body1" gutterBottom>
                        <strong>Method:</strong> {orderPayment.payment.method}
                        <br />Phần của shop: {(orderPayment.sellerAmount || 0).toLocaleString('vi-VN')} ₫
                        <br />{orderPayment.sellerCollected ? 'Shop đã xác nhận thu tiền' : 'Chưa xác nhận thu tiền — chỉ xác nhận sau khi giao xong'}
                      </Typography>
                      {orderPayment.payment.transactionId && (
                        <Typography variant="body1" gutterBottom>
                          <strong>Transaction ID:</strong> {orderPayment.payment.transactionId}
                        </Typography>
                      )}
                      {orderPayment.payment.paidAt && (
                        <Typography variant="body1">
                          <strong>Payment Date:</strong> {new Date(orderPayment.payment.paidAt).toLocaleString("en-US", {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  {orderPayment.canCollectCOD && (
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                        Xác nhận đã thu COD của shop
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Tooltip title="Once marked as paid, status cannot be changed back">
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<MoneyIcon />}
                            onClick={() => handleOpenPaymentConfirmDialog("paid")}
                            sx={{ mr: 2 }}
                          >
                            Đã thu COD của shop
                          </Button>
                        </Tooltip>

                      </Box>
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Typography>No payment information found for this order.</Typography>
              )}
            </DialogContent>
          </Dialog>

          {/* Payment Status Update Confirmation Dialog */}
          <Dialog 
            open={paymentConfirmDialog} 
            onClose={handleClosePaymentConfirmDialog}
            PaperProps={{ sx: { borderRadius: 2 } }}
          >
            <DialogTitle>Confirm Payment Status Update</DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to update the payment status to <strong>
                  {paymentStatusToUpdate === "paid" ? "paid" : "failed"}
                </strong>?
                {paymentStatusToUpdate === "paid" && (
                  <Typography color="error" sx={{ mt: 1 }}>
                    Chỉ xác nhận khi shop đã thực sự nhận COD. Các shop khác tự xác nhận phần của họ.
                  </Typography>
                )}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button 
                onClick={handleClosePaymentConfirmDialog}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdatePaymentStatus} 
                variant="contained" 
                color={paymentStatusToUpdate === "paid" ? "success" : "error"}
                disabled={loadingAction}
                startIcon={loadingAction ? <CircularProgress size={16} /> : null}
              >
                {loadingAction ? "Processing..." : 'Confirm'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Notification Snackbar */}
          <Snackbar 
            open={snackbarOpen} 
            autoHideDuration={6000} 
            onClose={handleSnackbarClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Alert 
              onClose={handleSnackbarClose} 
              severity={snackbarSeverity} 
              variant="filled"
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </>
      )}
    </Container>
  );
}
