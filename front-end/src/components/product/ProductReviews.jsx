import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductReviews, createReview } from '../../features/review/reviewSlice';
import { FaStar, FaRegStar, FaUserCircle, FaSpinner, FaReply, FaCheck } from 'react-icons/fa';
import Pagination from '../common/Pagination';
import { format } from 'date-fns';

const ProductReviews = ({ productId }) => {
  const dispatch = useDispatch();
  const { productReviews, productAverageRating, productTotalReviews, productPagination, loading, success } = useSelector((state) => state.review);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [currentPage, setCurrentPage] = useState(1);
  const [replyForm, setReplyForm] = useState({
    visible: false,
    parentId: null,
    comment: '',
  });

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductReviews({ productId, page: currentPage }));
    }
  }, [dispatch, productId, currentPage, success]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
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

  const showReplyForm = (parentId) => {
    setReplyForm({
      visible: true,
      parentId,
      comment: '',
    });
  };

  const hideReplyForm = () => {
    setReplyForm({
      visible: false,
      parentId: null,
      comment: '',
    });
  };

  const handleReplyChange = (e) => {
    setReplyForm((prev) => ({
      ...prev,
      comment: e.target.value,
    }));
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    
    dispatch(
      createReview({
        productId,
        parentId: replyForm.parentId,
        comment: replyForm.comment,
      })
    ).then(() => {
      hideReplyForm();
    });
  };

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
      
      {/* Review Summary */}
      <div className="flex items-center mb-8">
        <div className="mr-4">
          <div className="text-4xl font-bold text-yellow-500">{productAverageRating.toFixed(1)}</div>
          <div className="text-gray-500">{productTotalReviews} reviews</div>
        </div>
        <div className="flex items-center">
          {renderStars(Math.round(productAverageRating))}
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <FaSpinner className="animate-spin text-2xl text-blue-500" />
        </div>
      ) : productReviews && productReviews.length > 0 ? (
        <div>
          {productReviews.map((review) => (
            <div key={review._id} className="border-b pb-6 mb-6">
              <div className="flex items-start">
                <div className="mr-4">
                  {review.reviewerId.avatar ? (
                    <img 
                      src={review.reviewerId.avatar} 
                      alt={review.reviewerId.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <FaUserCircle className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold">{review.reviewerId.name || 'Anonymous'}</h4>
                      {review.rating && renderStars(review.rating)}
                    </div>
                    <div className="text-gray-500 text-sm">
                      {formatDate(review.createdAt)}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                  
                  {isAuthenticated && (
                    <button
                      onClick={() => showReplyForm(review._id)}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                    >
                      <FaReply /> Reply
                    </button>
                  )}
                  
                  {/* Replies */}
                  {review.replies && review.replies.length > 0 && (
                    <div className="ml-8 mt-4 space-y-4">
                      {review.replies.map((reply) => (
                        <div key={reply._id} className="bg-gray-50 p-4 rounded-md">
                          <div className="flex items-start">
                            <div className="mr-4">
                              {reply.reviewerId.avatar ? (
                                <img 
                                  src={reply.reviewerId.avatar} 
                                  alt={reply.reviewerId.name} 
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <FaUserCircle className="w-10 h-10 text-gray-400" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div>
                                  <h4 className="font-semibold">
                                    {reply.reviewerId.name || 'Anonymous'} 
                                    {reply.reviewerId.role === 'seller' && (
                                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full ml-2">
                                        Seller
                                      </span>
                                    )}
                                  </h4>
                                </div>
                                <div className="text-gray-500 text-sm">
                                  {formatDate(reply.createdAt)}
                                </div>
                              </div>
                              
                              <div className="mt-2">
                                <p className="text-gray-700">{reply.comment}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Reply form */}
              {replyForm.visible && replyForm.parentId === review._id && (
                <div className="ml-16 mt-4">
                  <form onSubmit={handleReplySubmit}>
                    <div className="mb-3">
                      <textarea
                        value={replyForm.comment}
                        onChange={handleReplyChange}
                        placeholder="Write your reply here..."
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
                        rows="3"
                        required
                      ></textarea>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <FaSpinner className="animate-spin" /> Sending...
                          </>
                        ) : (
                          <>
                            <FaCheck /> Submit Reply
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={hideReplyForm}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ))}
          
          {/* Pagination */}
          {productPagination && productPagination.pages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={productPagination.pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-600">No reviews yet for this product.</p>
          {isAuthenticated && (
            <p className="mt-2 text-gray-600">
              Be the first to review this product after purchase!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductReviews; 