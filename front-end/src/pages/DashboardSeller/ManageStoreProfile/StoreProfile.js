import React, { useEffect, useState } from 'react';
import {
    Box, Card, CardContent, Typography, Avatar, Chip, CircularProgress, Stack, Grid, Button, Dialog,
    DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import SellerService from '../../../services/api/SellerService';
import StarIcon from '@mui/icons-material/Star';

export default function StoreProfile() {
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);

    // Dialogs
    const [openEditStore, setOpenEditStore] = useState(false);
    const [openEditSeller, setOpenEditSeller] = useState(false);

    // Form states
    const [formStore, setFormStore] = useState({
        storeName: "",
        description: "",
        bannerImageURL: ""
    });
    // Đủ các trường cập nhật seller
    const [formSeller, setFormSeller] = useState({
        username: "",
        fullname: "",
        email: "",
        avatar: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        country: ""
    });
    const [savingStore, setSavingStore] = useState(false);
    const [savingSeller, setSavingSeller] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await SellerService.getStoreProfile();
            setStore(res.data);
        } catch {
            setStore(null);
        } finally {
            setLoading(false);
        }
    };

    // ==== STORE PROFILE ====
    const handleOpenEditStore = () => {
        setFormStore({
            storeName: store?.storeName || "",
            description: store?.description || "",
            bannerImageURL: store?.bannerImageURL || "",
        });
        setOpenEditStore(true);
    };

    const handleCloseEditStore = () => setOpenEditStore(false);

    const handleChangeStore = (e) => {
        setFormStore(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSaveStore = async () => {
        setSavingStore(true);
        try {
            await SellerService.updateStoreProfile(formStore);
            await fetchProfile();
            setOpenEditStore(false);
        } finally {
            setSavingStore(false);
        }
    };

    // ==== SELLER PROFILE ====
    const seller = store?.sellerId || {};
    const address = store?.address || {};

    const handleOpenEditSeller = () => {
        setFormSeller({
            username: seller.username || "",
            fullname: seller.fullname || "",
            email: seller.email || "",
            avatar: seller.avatarURL || "",
            phone: address.phone || "",
            street: address.street || "",
            city: address.city || "",
            state: address.state || "",
            country: address.country || "",
        });
        setOpenEditSeller(true);
    };

    const handleCloseEditSeller = () => setOpenEditSeller(false);

    const handleChangeSeller = (e) => {
        setFormSeller(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSaveSeller = async () => {
        setSavingSeller(true);
        try {
            await SellerService.updateSellerProfile(formSeller);
            await fetchProfile();
            setOpenEditSeller(false);
        } finally {
            setSavingSeller(false);
        }
    };

    if (loading) return <CircularProgress sx={{ m: 3 }} />;
    if (!store) return <Typography color="text.secondary">You have no store yet.</Typography>;

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Store Profile
            </Typography>
            <Card sx={{ display: 'flex', alignItems: 'center', p: 2, mb: 2 }}>
                <Avatar
                    variant="rounded"
                    src={store.bannerImageURL}
                    sx={{ width: 80, height: 80, mr: 3, border: "2px solid #1976d2" }}
                >
                    <StorefrontIcon fontSize="large" />
                </Avatar>
                <CardContent sx={{ flex: 1, p: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        {store.storeName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {store.description || 'No description'}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                        <Chip
                            size="small"
                            label={store.status}
                            color={
                                store.status === 'approved'
                                    ? 'success'
                                    : store.status === 'pending'
                                        ? 'warning'
                                        : 'error'
                            }
                        />
                        <Typography variant="caption" color="text.secondary">
                            <strong>Store ID:</strong> {store._id}
                        </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                        <StarIcon sx={{ color: '#FFD600', fontSize: 20 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {store.avgRating || 0}/5
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            ({store.totalReviews || 0} đánh giá)
                        </Typography>
                    </Stack>
                </CardContent>
                <Button variant="outlined" sx={{ ml: 2 }} onClick={handleOpenEditStore}>
                    Update store profile
                </Button>
            </Card>

            {/* Seller Profile */}
            <Typography variant="h5" gutterBottom>
                Seller Profile
            </Typography>
            <Card sx={{ display: 'flex', alignItems: 'center', p: 2, mb: 2 }}>
                <Avatar
                    src={seller.avatarURL}
                    sx={{ width: 60, height: 60, mr: 3, bgcolor: 'grey.200' }}
                >
                    <PersonIcon fontSize="large" />
                </Avatar>
                <CardContent sx={{ flex: 1, p: 1 }}>
                    <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                                <strong>Username:</strong> {seller.username}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Full name:</strong> {seller.fullname}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Email:</strong> <EmailIcon fontSize="small" sx={{ mb: '-3px' }} /> {seller.email}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Password:</strong>{" "}
                                {seller.password ? "•".repeat(seller.password.length) : "--"}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Phone:</strong> {address.phone || "--"}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Address:</strong> {address.street
                                    ? `${address.street}, ${address.city}, ${address.state}, ${address.country}`
                                    : "--"}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
                <Button variant="outlined" sx={{ ml: 2 }} onClick={handleOpenEditSeller}>
                    Update seller profile
                </Button>
            </Card>

            {/* Dialog cập nhật store */}
            <Dialog open={openEditStore} onClose={handleCloseEditStore} maxWidth="sm" fullWidth>
                <DialogTitle>Update store profile</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Store name"
                            name="storeName"
                            value={formStore.storeName}
                            onChange={handleChangeStore}
                            fullWidth
                        />
                        <TextField
                            label="Description"
                            name="description"
                            value={formStore.description}
                            onChange={handleChangeStore}
                            multiline
                            minRows={2}
                            fullWidth
                        />
                        <TextField
                            label="Banner Image URL"
                            name="bannerImageURL"
                            value={formStore.bannerImageURL}
                            onChange={handleChangeStore}
                            fullWidth
                        />
                        {formStore.bannerImageURL &&
                            <img src={formStore.bannerImageURL} alt="Banner" style={{ width: 120, marginTop: 8, borderRadius: 6, border: '1px solid #ddd' }} />
                        }
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditStore}>Hủy</Button>
                    <Button
                        onClick={handleSaveStore}
                        disabled={savingStore}
                        variant="contained"
                    >
                        {savingStore ? "Saving..." : "Save"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog cập nhật seller */}
            <Dialog open={openEditSeller} onClose={handleCloseEditSeller} maxWidth="sm" fullWidth>
                <DialogTitle>Update seller profile</DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Username"
                            name="username"
                            value={formSeller.username}
                            onChange={handleChangeSeller}
                            fullWidth
                        />
                        <TextField
                            label="Full name"
                            name="fullname"
                            value={formSeller.fullname}
                            onChange={handleChangeSeller}
                            fullWidth
                        />
                        <TextField
                            label="Email"
                            name="email"
                            value={formSeller.email}
                            onChange={handleChangeSeller}
                            type="email"
                            fullWidth
                        />
                        <TextField
                            label="Avatar URL"
                            name="avatar"
                            value={formSeller.avatar}
                            onChange={handleChangeSeller}
                            fullWidth
                        />
                        {formSeller.avatar &&
                            <img src={formSeller.avatar} alt="Avatar" style={{ width: 80, marginTop: 8, borderRadius: 50, border: '1px solid #ddd' }} />
                        }
                        <TextField
                            label="Phone"
                            name="phone"
                            value={formSeller.phone}
                            onChange={handleChangeSeller}
                            fullWidth
                        />
                        <TextField
                            label="Street"
                            name="street"
                            value={formSeller.street}
                            onChange={handleChangeSeller}
                            fullWidth
                        />
                        <TextField
                            label="City"
                            name="city"
                            value={formSeller.city}
                            onChange={handleChangeSeller}
                            fullWidth
                        />
                        <TextField
                            label="State"
                            name="state"
                            value={formSeller.state}
                            onChange={handleChangeSeller}
                            fullWidth
                        />
                        <TextField
                            label="Country"
                            name="country"
                            value={formSeller.country}
                            onChange={handleChangeSeller}
                            fullWidth
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseEditSeller}>Hủy</Button>
                    <Button
                        onClick={handleSaveSeller}
                        disabled={savingSeller}
                        variant="contained"
                    >
                        {savingSeller ? "Saving..." : " Save changes "}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
