import React from 'react';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Pagination = ({ currentPage, totalPages, onPageChange, className }) => {
  // Calculate visible pages
  const getVisiblePages = () => {
    const delta = 1; // Number of pages to show before and after current page
    const pages = [];
    
    // Calculate range
    let leftBound = Math.max(1, currentPage - delta);
    let rightBound = Math.min(totalPages, currentPage + delta);
    
    // Adjust bounds to always show 5 pages when possible
    const numPagesToShow = 5;
    if (rightBound - leftBound + 1 < Math.min(numPagesToShow, totalPages)) {
      if (currentPage < totalPages / 2) {
        // Near the start, expand rightBound
        rightBound = Math.min(leftBound + numPagesToShow - 1, totalPages);
      } else {
        // Near the end, expand leftBound
        leftBound = Math.max(rightBound - numPagesToShow + 1, 1);
      }
    }
    
    // First page
    if (leftBound > 1) {
      pages.push(1);
      if (leftBound > 2) {
        pages.push('ellipsis-start');
      }
    }
    
    // Middle pages
    for (let i = leftBound; i <= rightBound; i++) {
      pages.push(i);
    }
    
    // Last page
    if (rightBound < totalPages) {
      if (rightBound < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Skip to first or last page
  const goToFirstPage = () => onPageChange(1);
  const goToLastPage = () => onPageChange(totalPages);

  // Button variants for animation
  const buttonVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    disabled: { opacity: 0.5 }
  };

  if (totalPages <= 1) return null;

  return (
    <nav className={`${className || ''} py-4`} aria-label="Pagination">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* First page button */}
        <motion.button
          onClick={goToFirstPage}
          disabled={currentPage === 1}
          whileHover={currentPage !== 1 ? "hover" : "disabled"}
          whileTap={currentPage !== 1 ? "tap" : "disabled"}
          variants={buttonVariants}
          className={`hidden sm:flex items-center justify-center h-10 px-2 rounded-lg
            ${currentPage === 1 
              ? 'text-gray-400 cursor-not-allowed bg-gray-50'
              : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
            } transition-colors`}
          aria-label="First page"
        >
          <FaAngleDoubleLeft className="w-3 h-3" />
        </motion.button>
        
        {/* Previous button */}
        <motion.button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          whileHover={currentPage !== 1 ? "hover" : "disabled"}
          whileTap={currentPage !== 1 ? "tap" : "disabled"}
          variants={buttonVariants}
          className={`flex items-center justify-center h-10 w-10 rounded-lg
            ${currentPage === 1 
              ? 'text-gray-400 cursor-not-allowed bg-gray-50'
              : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
            } transition-colors`}
          aria-label="Previous page"
        >
          <FaChevronLeft className="w-4 h-4" />
        </motion.button>
        
        {/* Page numbers */}
        <div className="flex flex-wrap items-center gap-2">
          {getVisiblePages().map((page, index) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <span 
                  key={page} 
                  className="flex items-center justify-center w-10 h-10 text-gray-500"
                  aria-hidden="true"
                >
                  ···
                </span>
              );
            }
            
            return (
              <motion.button
                key={index}
                onClick={() => onPageChange(page)}
                whileHover={currentPage !== page ? "hover" : "disabled"}
                whileTap={currentPage !== page ? "tap" : "disabled"}
                variants={buttonVariants}
                className={`relative flex items-center justify-center w-10 h-10 rounded-lg font-medium text-sm
                  ${currentPage === page
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                  } transition-colors`}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {currentPage === page && (
                  <motion.span
                    layoutId="activePageHighlight"
                    className="absolute inset-0 rounded-lg bg-blue-600 -z-10"
                  />
                )}
                {page}
              </motion.button>
            );
          })}
        </div>
        
        {/* Next button */}
        <motion.button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          whileHover={currentPage !== totalPages ? "hover" : "disabled"}
          whileTap={currentPage !== totalPages ? "tap" : "disabled"}
          variants={buttonVariants}
          className={`flex items-center justify-center h-10 w-10 rounded-lg
            ${currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed bg-gray-50'
              : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
            } transition-colors`}
          aria-label="Next page"
        >
          <FaChevronRight className="w-4 h-4" />
        </motion.button>
        
        {/* Last page button */}
        <motion.button
          onClick={goToLastPage}
          disabled={currentPage === totalPages}
          whileHover={currentPage !== totalPages ? "hover" : "disabled"}
          whileTap={currentPage !== totalPages ? "tap" : "disabled"}
          variants={buttonVariants}
          className={`hidden sm:flex items-center justify-center h-10 px-2 rounded-lg
            ${currentPage === totalPages
              ? 'text-gray-400 cursor-not-allowed bg-gray-50'
              : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
            } transition-colors`}
          aria-label="Last page"
        >
          <FaAngleDoubleRight className="w-3 h-3" />
        </motion.button>
      </div>
      
      {/* Page info */}
      <div className="text-center text-sm text-gray-500 mt-3">
        Page {currentPage} of {totalPages}
      </div>
    </nav>
  );
};

export default Pagination; 