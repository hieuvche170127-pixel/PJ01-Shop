import React, { useEffect, useState } from "react";
import {
    Paper, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Typography, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Chip, Stack, CircularProgress, MenuItem
} from "@mui/material";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
// Import api instead of SellerService
import { api } from '../../../services/index';

const statusColor = {
    pending: "warning",
    approved: "success",
    rejected: "error",
    completed: "info"
};
const statusText = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed"
};
const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "completed", label: "Completed" },
];

export default function ManageReturnRequest() {
    const { handleSetDashboardTitle } = useOutletContext();
    useEffect(() => { handleSetDashboardTitle("Manage return requests") }, [handleSetDashboardTitle]);

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const [status, setStatus] = useState("pending");
    const [saving, setSaving] = useState(false);
    const [reason, setReason] = useState("");
    // State cho filter status
    const [statusFilter, setStatusFilter] = useState("");

    // Fetch return request list
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get("seller/return-requests");
            setRequests(res.data.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpen = (row) => {
        setSelected(row);
        setStatus(row.status || "pending");
        setReason(row.reason || "");
    };

    const handleClose = () => {
        setSelected(null);
        setStatus("pending");
        setReason("");
    };

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await api.put(`seller/return-requests/${selected._id}`, {
                status
            });

            await fetchData();  // Reload data after update
            handleClose();
            // setSnackbar({ // This line was removed as per the edit hint
            //   open: true,
            //   msg: "Return request updated successfully",
            //   severity: "success"
            // });
        } catch (error) {
            // setSnackbar({ // This line was removed as per the edit hint
            //   open: true,
            //   msg: "Failed to update return request",
            //   severity: "error"
            // });
        } finally {
            setSaving(false);
        }
    };

    // Filter dữ liệu hiển thị theo statusFilter
    const filteredRequests = requests.filter(row => !statusFilter || row.status === statusFilter);

    return (
        <Paper sx={{ p: 2 }}>
            {/* Filter UI */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ flex: 1 }}>Return Requests</Typography>
                <TextField
                    select
                    size="small"
                    label="Filter by Status"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    sx={{ minWidth: 160 }}
                >
                    {STATUS_OPTIONS.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                </TextField>
                {statusFilter &&
                    <Button variant="text" size="small" onClick={() => setStatusFilter("")}>Reset</Button>
                }
            </Stack>
            {loading ? (
                <Stack alignItems="center"><CircularProgress /></Stack>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Return code</TableCell>
                                <TableCell>Returner</TableCell>
                                <TableCell>Reason</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Create At</TableCell>
                                <TableCell width={120}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredRequests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        No return requests.
                                    </TableCell>
                                </TableRow>
                            )}
                            {filteredRequests.map(row => (
                                <TableRow key={row._id}>
                                    <TableCell>{row._id}</TableCell>
                                    <TableCell>{row.userId?.fullname || row.userId?.username}</TableCell>
                                    <TableCell>{row.reason}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={statusText[row.status] || row.status}
                                            color={statusColor[row.status] || "default"}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="outlined" size="small" onClick={() => handleOpen(row)}>
                                            Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Details Dialog */}
            <Dialog open={!!selected} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Return request details</DialogTitle>
                <DialogContent dividers>
                    {selected && (
                        <>
                            <Typography gutterBottom>
                                <b>Order Code:</b> {selected.orderItemId?.orderId._id || <span style={{ color: "#888" }}>?</span>}
                            </Typography>
                            <Typography gutterBottom>
                                <b>Returner:</b> {selected.userId?.fullname || selected.userId?.username}
                            </Typography>
                            <Typography gutterBottom>
                                <b>Reason for return:</b> {selected.reason}
                            </Typography>
                            <Typography gutterBottom>
                                <b>Product in Order:</b>
                            </Typography>
                            {selected.orderItemId ? (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Product</TableCell>
                                            <TableCell>Image</TableCell>
                                            <TableCell>Quantity</TableCell>
                                            <TableCell>Unit Price</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>{selected.orderItemId.productId?.title || "(deleted)"}</TableCell>
                                            <TableCell>
                                                {selected.orderItemId.productId?.image && (
                                                    <img src={selected.orderItemId.productId.image} alt=""
                                                        style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 4 }} />
                                                )}
                                            </TableCell>
                                            <TableCell>{selected.orderItemId.quantity}</TableCell>
                                            <TableCell>
                                                {selected.orderItemId.unitPrice?.toLocaleString()} đ
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            ) : (
                                <Typography color="text.secondary">No product found.</Typography>
                            )}
                            <TextField
                                select
                                fullWidth
                                label="Update status"
                                value={status}
                                onChange={e => setStatus(e.target.value)}
                                margin="normal"
                            >
                                <MenuItem value="pending">Pending</MenuItem>
                                <MenuItem value="approved">Approved</MenuItem>
                                <MenuItem value="rejected">Rejected</MenuItem>
                                <MenuItem value="completed">Completed</MenuItem>
                            </TextField>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={saving}
                    >
                        {saving ? "Đang lưu..." : "Save and Update"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
