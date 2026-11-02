import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, List, ListItem, ListItemText, Rating } from '@mui/material';
import ReviewService from '../../services/api/ReviewService';

const ReviewSummary = ({ productId }) => {
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const response = await ReviewService.getReviewSummary(productId);
                setSummary(response.data);
            } catch (error) {
                console.error('Failed to fetch review summary:', error);
            }
        };

        fetchSummary();
    }, [productId]);

    if (!summary) {
        return <div>Loading...</div>;
    }

    return (
        <Box sx={{ padding: 2, backgroundColor: '#f9f9f9', borderRadius: 2, boxShadow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 2 }}>Customer Reviews</Typography>
            <Box display="flex" alignItems="center" sx={{ marginBottom: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', marginRight: 1 }}>{summary?.averageRating?.toFixed(1)}</Typography>
                <Rating value={summary?.averageRating} precision={0.1} readOnly />
                <Typography variant="body1" sx={{ marginLeft: 1 }}>out of 5</Typography>
            </Box>
            <Typography variant="body2" sx={{ marginBottom: 2 }}>{summary?.totalReviews} customer ratings</Typography>
            <List>
                {summary?.ratingPercentages.map((rating, index) => (
                    <ListItem key={index} sx={{ padding: 0 }}>
                        <ListItemText primary={`${5 - index} star`} />
                        <Box width="100%" mr={1}>
                            <LinearProgress
                                variant="determinate"
                                value={rating.percentage}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: '#e0e0e0',
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 5,
                                        backgroundColor: index === 0 ? '#ff6f61' : index === 1 ? '#ff8f61' : index === 2 ? '#ffa061' : index === 3 ? '#ffb261' : '#ffca61',
                                    },
                                }}
                            />
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                            {Math.round(rating.percentage)}%
                        </Typography>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default ReviewSummary;
