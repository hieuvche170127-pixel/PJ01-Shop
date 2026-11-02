import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createReview, fetchUserReviews } from '../../features/review/reviewSlice';
import { FaStar, FaRegStar, FaSpinner, FaArrowLeft } from 'react-icons/fa';

const WriteReview = () => {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, success, userReviews } = useSelector((state) => state.review);
  
  const [reviewForm, setReviewForm] = useState({
    productId: '',
    rating: 5,
    comment: '',
  });
  
  const [hasAlreadyReviewed, setHasAlreadyReviewed] = useState(false);

  // Fetch user reviews when component loads to check if product is already reviewed
  useEffect(() => {
    dispatch(fetchUserReviews({ page: 1, limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    // Set the product ID from URL params
    if (productId) {
      setReviewForm(prev => ({ ...prev, productId }));
    }
  }, [productId]);

  // Disabled review checking temporarily to allow reviews for all shipped items
  useEffect(() => {
    // Always set hasAlreadyReviewed to false to allow reviews
    setHasAlreadyReviewed(false);
    
    // Log reviews for debugging
    if (userReviews && userReviews.length > 0) {
      console.log("Available user reviews:", userReviews);
    }
  }, [userReviews, productId, navigate]);

  // Navigate back to order history after successful review submission
  useEffect(() => {
    if (success) {
      setTimeout(() => {
        navigate('/order-history');
      }, 2000); // Give user time to see success message
    }
  }, [success, navigate]);

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = (rating) => {
    setReviewForm((prev) => ({
      ...prev,
      rating,
    }));
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    dispatch(createReview(reviewForm));
  };

  if (hasAlreadyReviewed) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button 
            onClick={() => navigate('/order-history')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <FaArrowLeft /> Back to Order History
          </button>
        </div>
        
        <div className="max-w-2xl mx-auto bg-yellow-50 border border-yellow-100 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-700 mb-4">
            You have already reviewed this product
          </h2>
          <p className="mb-4">
            You can view your reviews in the My Reviews section.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to order history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button 
          onClick={() => navigate('/order-history')}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          <FaArrowLeft /> Back to Order History
        </button>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Write a Review</h1>
        
        <form onSubmit={handleReviewSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-3">
              Your Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className="text-2xl focus:outline-none"
                >
                  {star <= reviewForm.rating ? (
                    <FaStar className="text-yellow-400" />
                  ) : (
                    <FaRegStar className="text-yellow-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="comment" className="block text-gray-700 font-medium mb-2">
              Your Review
            </label>
            <textarea
              id="comment"
              name="comment"
              value={reviewForm.comment}
              onChange={handleReviewChange}
              required
              rows="6"
              className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
              placeholder="Share your experience with this product..."
            ></textarea>
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReview; 