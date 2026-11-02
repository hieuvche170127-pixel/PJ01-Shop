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
    open: "warning",
    under_review: "info",
    resolved: "success",
    closed: "default"
};
const statusText = {
    open: "Open",
    under_review: "Under Review",
    resolved: "Resolved",
    closed: "Closed"
};
const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "open", label: "Open" },
    { value: "under_review", label: "Under Review" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
];

export default function ManageComplaint() {
    const { handleSetDashboardTitle } = useOutletContext();
    handleSetDashboardTitle("Manage Dispute");

    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const [resolveInput, setResolveInput] = useState("");
    const [resolveStatus, setResolveStatus] = useState("resolved");
    const [saving, setSaving] = useState(false);

    // Filter state
    const [statusFilter, setStatusFilter] = useState("");

    // Fetch dispute list
    useEffect(() => {
        const fetchDisputes = async () => {
            setLoading(true);
            try {
                const response = await api.get("seller/disputes");
                setDisputes(response.data.data);
            } catch (error) {
                console.error("Error fetching disputes:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDisputes();
    }, []);

    const handleOpen = (row) => {
        setSelected(row);
        setResolveInput(row.resolution || "");
        setResolveStatus(row.status || "resolved");
    };

    const handleClose = () => {
        setSelected(null);
        setResolveInput("");
        setResolveStatus("resolved");
    };

    const handleResolve = async () => {
        if (!resolveInput.trim()) return;
        setSaving(true);
        
        try {
            await api.put(`seller/disputes/${selected._id}/resolve`, {
                resolution: resolveInput,
                status: resolveStatus,
            });
            
            // Refresh the disputes list
            const response = await api.get("seller/disputes");
            setDisputes(response.data.data);
            
            setSaving(false);
            handleClose();
        } catch (error) {
            console.error("Error resolving dispute:", error);
            setSaving(false);
        }
    };

    // Filtered data
    const filteredDisputes = disputes.filter(row => !statusFilter || row.status === statusFilter);

    return (
        <Paper sx={{ p: 2 }}>
            {/* Filter UI */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ flex: 1 }}>Dispute List</Typography>
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
                                <TableCell>Complaint Code</TableCell>
                                <TableCell>Complainant</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Resolution</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created At</TableCell>
                                <TableCell width={120}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredDisputes.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        No complaints found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {filteredDisputes.map(row => (
                                <TableRow key={row._id}>
                                    <TableCell>{row._id}</TableCell>
                                    <TableCell>{row.raisedBy?.fullname}</TableCell>
                                    <TableCell>{row.description}</TableCell>
                                    <TableCell>
                                        {row.resolution && row.resolution.trim()
                                            ? row.resolution
                                            : <span style={{ color: "#888" }}>No response yet</span>}
                                    </TableCell>
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

            {/* Details & Resolution Dialog */}
            <Dialog open={!!selected} onClose={handleClose} maxWidth="sm" fullWidth>
                <DialogTitle>Dispute Details</DialogTitle>
                <DialogContent dividers>
                    {selected && (
                        <>
                            <Typography gutterBottom>
                                <b>Order Code:</b> {selected.orderItemId?.orderId._id || <span style={{ color: "#888" }}>?</span>}
                            </Typography>
                            <Typography gutterBottom>
                                <b>Complainant:</b> {selected.raisedBy?.fullname}
                            </Typography>
                            <Typography gutterBottom>
                                <b>Complaint Description:</b> {selected.description}
                            </Typography>

                            <Typography gutterBottom><b>Product in Order:</b></Typography>
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
                                fullWidth
                                label="Resolution / Response"
                                value={resolveInput}
                                onChange={e => setResolveInput(e.target.value)}
                                margin="normal"
                                multiline
                                rows={3}
                            />
                            <TextField
                                select
                                label="Status"
                                value={resolveStatus}
                                onChange={e => setResolveStatus(e.target.value)}
                                margin="normal"
                                fullWidth
                            >
                                <MenuItem value="open">Open</MenuItem>
                                <MenuItem value="under_review">Under Review</MenuItem>
                                <MenuItem value="resolved">Resolved</MenuItem>
                                <MenuItem value="closed">Closed</MenuItem>
                            </TextField>
                        </>
                    )}
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                    <Button onClick={handleResolve} disabled={saving || !resolveInput.trim()} variant="contained">
                        {saving ? "Saving..." : "Save & Update"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Paper>
    );
}
