import React, { useState } from 'react';
import { TextField, Button, Box, Rating, Typography } from '@mui/material';
import { useSelector } from "react-redux";
import ReviewService from '../../services/api/ReviewService';

const AddReviewForm = ({ productId, onReviewAdded }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const userId = useSelector((state) => state.orebiReducer.userInfo._id);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const newReview = { productId, userId, rating, comment };
            await ReviewService.createReview(newReview);
            const response = await ReviewService.getReviewsByProduct(productId);
            onReviewAdded(response.data);
            setRating(0);
            setComment('');
        } catch (error) {
            console.error('Failed to add review:', error);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit}>
               <Typography variant="h6" sx={{ fontWeight: 'bold', marginTop: 5 }}>Feedback</Typography>
            <Rating
                name="rating"
                value={rating}
                onChange={(event, newValue) => setRating(newValue)}
                required
                fullWidth
                margin="normal"
            />
            <TextField
                label="Comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                fullWidth
                margin="normal"
            />
            <Button type="submit" variant="contained" color="primary">
                Add Review
            </Button>
        </Box>
    );
};

export default AddReviewForm;
