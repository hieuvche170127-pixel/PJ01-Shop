import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Rating } from '@mui/material';
import ReviewService from '../../services/api/ReviewService';
import AddReviewForm from './AddReviewForm';
import { useSelector } from "react-redux";
import ReviewSummary from './ReviewSummary';

const Review = () => {
    const { _id: productId } = useParams();
    const [reviews, setReviews] = useState([]);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [updatedRating, setUpdatedRating] = useState(0);
    const [updatedComment, setUpdatedComment] = useState('');
    const userId = useSelector((state) => state.orebiReducer.userInfo._id);
    const isLoggedIn = !!localStorage.getItem('accessToken');

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await ReviewService.getReviewsByProduct(productId);
                setReviews(response.data);
            } catch (error) {
                console.error('Failed to fetch reviews:', error);
            }
        };

        fetchReviews();
    }, [productId]);

    const handleUpdateReview = async () => {
        try {
            await ReviewService.updateReview(selectedReview._id, { rating: updatedRating, comment: updatedComment });
            const response = await ReviewService.getReviewsByProduct(productId);
            setReviews(response.data);
            setOpenUpdateDialog(false);
        } catch (error) {
            console.error('Failed to update review:', error);
        }
    };

    const handleDeleteReview = async () => {
        try {
            await ReviewService.deleteReview(selectedReview._id);
            const response = await ReviewService.getReviewsByProduct(productId);
            setReviews(response.data);
            setOpenDeleteDialog(false);
        } catch (error) {
            console.error('Failed to delete review:', error);
        }
    };

    const openUpdateDialogForReview = (review) => {
        setSelectedReview(review);
        setUpdatedRating(review.rating);
        setUpdatedComment(review.comment);
        setOpenUpdateDialog(true);
    };

    const openDeleteDialogForReview = (review) => {
        setSelectedReview(review);
        setOpenDeleteDialog(true);
    };

    return (
        <Box>
            <Typography variant="h4">Product Reviews</Typography>
            <ReviewSummary productId={productId} />
            {isLoggedIn && <AddReviewForm productId={productId} onReviewAdded={setReviews} />}
            <Typography variant="h5" sx={{ fontWeight: 'bold', marginTop: 5 }}>List Reviews</Typography>
            <List>
                {reviews.map((review) => (
                    <ListItem key={review._id}>
                        <ListItemText
                            primary={`Rating: ${review?.rating} star - ${review?.comment}`}
                            secondary={`By: ${review?.userId?.fullName}`}
                        />
                        {isLoggedIn && review?.userId?._id === userId && (
                            <>
                                <Button onClick={() => openUpdateDialogForReview(review)}>
                                    Update
                                </Button>
                                <Button onClick={() => openDeleteDialogForReview(review)}>Delete</Button>
                            </>
                        )}
                    </ListItem>
                ))}
            </List>

            {/* Update Review Dialog */}
            <Dialog open={openUpdateDialog} onClose={() => setOpenUpdateDialog(false)}>
                <DialogTitle>Update Review</DialogTitle>
                <DialogContent>
                    <Rating
                        name="updated-rating"
                        value={updatedRating}
                        onChange={(event, newValue) => setUpdatedRating(newValue)}
                    />
                    <TextField
                        margin="dense"
                        label="Comment"
                        type="text"
                        fullWidth
                        value={updatedComment}
                        onChange={(e) => setUpdatedComment(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUpdateDialog(false)}>Cancel</Button>
                    <Button onClick={handleUpdateReview}>Update</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Review Confirmation Dialog */}
            <Dialog
                open={openDeleteDialog}
                onClose={() => setOpenDeleteDialog(false)}
            >
                <DialogTitle>Delete Review</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this review?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
                    <Button onClick={handleDeleteReview}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Review;
