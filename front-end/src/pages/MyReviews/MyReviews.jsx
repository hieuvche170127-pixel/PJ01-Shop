import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserReviews, updateReview, deleteReview } from '../../features/review/reviewSlice';
import { Link } from 'react-router-dom';
import { FaSpinner, FaStar, FaRegStar, FaEdit, FaTrash, FaCheck } from 'react-icons/fa';
import Pagination from '../../components/common/Pagination';
import { format } from 'date-fns';

const MyReviews = () => {
  const dispatch = useDispatch();
  const { userReviews, userPagination, loading, success } = useSelector((state) => state.review);
  const [currentPage, setCurrentPage] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [editReviewData, setEditReviewData] = useState({
    id: null,
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    dispatch(fetchUserReviews({ page: currentPage }));
  }, [dispatch, currentPage, success]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className="text-yellow-400">
            {star <= rating ? <FaStar /> : <FaRegStar />}
          </span>
        ))}
      </div>
    );
  };

  const handleEdit = (review) => {
    setEditMode(true);
    setEditReviewData({
      id: review._id,
      rating: review.rating || 5,
      comment: review.comment || '',
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      dispatch(deleteReview(id));
    }
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setEditReviewData({
      id: null,
      rating: 5,
      comment: '',
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditReviewData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = (rating) => {
    setEditReviewData((prev) => ({
      ...prev,
      rating,
    }));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    dispatch(
      updateReview({
        id: editReviewData.id,
        reviewData: {
          rating: editReviewData.rating,
          comment: editReviewData.comment,
        },
      })
    ).then(() => {
      setEditMode(false);
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Reviews</h1>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <FaSpinner className="animate-spin text-3xl text-blue-500" />
        </div>
      ) : userReviews && userReviews.length > 0 ? (
        <div>
          {userReviews.map((review) => (
            <div key={review._id} className="bg-white rounded-lg shadow-md p-6 mb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  {review.productId && review.productId.image && (
                    <div className="mr-4">
                      <img
                        src={review.productId.image}
                        alt={review.productId.title}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold text-lg mb-1">
                      {review.productId ? (
                        <Link to={`/product/${review.productId._id}`} className="text-blue-600 hover:text-blue-800">
                          {review.productId.title}
                        </Link>
                      ) : (
                        'Product not available'
                      )}
                    </h2>
                    {review.rating && renderStars(review.rating)}
                    <div className="text-gray-500 text-sm mt-1">
                      Posted on {formatDate(review.createdAt)}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(review)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit review"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete review"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-gray-700">{review.comment}</p>
              </div>
              
              {review.parentId && (
                <div className="mt-4 ml-8 p-4 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-500">Reply to:</div>
                  <p className="text-gray-700 italic">{review.parentId.comment}</p>
                </div>
              )}
            </div>
          ))}
          
          {userPagination && userPagination.pages > 1 && (
            <div className="mt-6">
              <Pagination 
                currentPage={currentPage}
                totalPages={userPagination.pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 border rounded-md p-8 text-center">
          <p className="text-gray-600 mb-4">You haven't written any reviews yet.</p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-block"
          >
            Browse Products
          </Link>
        </div>
      )}
      
      {/* Edit Review Modal */}
      {editMode && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-6 bg-white w-full max-w-md rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Edit Review</h3>
              <button
                onClick={handleEditCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(star)}
                      className="text-xl text-yellow-400 focus:outline-none"
                    >
                      {star <= editReviewData.rating ? <FaStar /> : <FaRegStar />}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="comment" className="block text-gray-700 text-sm font-bold mb-2">
                  Comment
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  value={editReviewData.comment}
                  onChange={handleEditChange}
                  required
                  rows="4"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                  placeholder="Write your review here..."
                ></textarea>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleEditCancel}
                  className="mr-2 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <FaCheck /> Update Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviews; 