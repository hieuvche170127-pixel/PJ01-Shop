// comment
import React, { useEffect, useState } from 'react';
import ReactPaginate from "react-paginate";
import Product from "../../home/Products/Product";
import { useSelector } from "react-redux";
import ProductService from '../../../services/api/ProductService';
function Items({ currentItems }) {
  return (
    <>
      {currentItems.map((item) => (
        <div key={item._id} className="w-full">
          <Product
            _id={item._id}
            images={item.images}
            name={item.name}
            price={item.price}
            color={item.color}
            isDeleted={item.isDeleted}
            description={item.description}
            pdf={item.pdf}
            specs={item.specs}
            inStock={item.inStock}
            category={item.category.name}
            brand={item.brand.name}
            cost={item.cost}
          />
        </div>
      ))}
    </>
  );
}

const Pagination = ({ itemsPerPage, sortOrder }) => {
  const [products, setProducts] = useState([]);
  const [itemOffset, setItemOffset] = useState(0);
  const [itemStart, setItemStart] = useState(1);

  const selectedBrands = useSelector(
    (state) => state.orebiReducer.checkedBrands
  );
  const selectedCategories = useSelector(
    (state) => state.orebiReducer.checkedCategorys
  );
  const checkedColors = useSelector(
    (state) => state.orebiReducer.checkedColors
  );
  const checkedPrices = useSelector(
    (state) => state.orebiReducer.checkedPrices
  );

  useEffect(() => {
    const fetchProducts = async () => {
      const fetchedProducts = await ProductService.getAllProducts()
      if (sortOrder === "Ascending") {
        fetchedProducts.sort((a, b) => a.price - b.price)
      } else if (sortOrder === "Decrease") {
        fetchedProducts.sort((a, b) => b.price - a.price)
      }
      setProducts(fetchedProducts)
    }

    fetchProducts();
  }, [sortOrder]);

  // Filter products based on selected brands and categories
  const filteredProducts = products.filter((item) => {
    const isBrandSelected =
      selectedBrands.length === 0 ||
      selectedBrands.some((brand) => brand.name === item.brand.name);

    const isCategorySelected =
      selectedCategories.length === 0 ||
      selectedCategories.some((category) => category.name === item.category.name);

    const isInSelectedColor =
      checkedColors.length === 0 ||
      checkedColors.some((color) =>
        item.inStock.some((stock) => stock.color === color.name)
      );
    const isInSelectedPrice =
      checkedPrices.length === 0 ||
      checkedPrices.some((price) =>
        item.price >= price.priceOne && item.price <= price.priceTwo
      );
    return isBrandSelected && isCategorySelected && isInSelectedColor && isInSelectedPrice;
  });

  const endOffset = itemOffset + itemsPerPage;
  const currentItems = filteredProducts.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(filteredProducts.length / itemsPerPage);

  const handlePageClick = (event) => {
    const newOffset = (event.selected * itemsPerPage) % filteredProducts.length;
    const newStart = newOffset + 1;

    setItemOffset(newOffset);
    setItemStart(newStart);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 mdl:gap-4 lg:gap-10">
        <Items currentItems={currentItems} />
      </div>
      <div className="flex flex-col mdl:flex-row justify-center mdl:justify-between items-center">
        <ReactPaginate
          nextLabel=""
          onPageChange={handlePageClick}
          pageRangeDisplayed={3}
          marginPagesDisplayed={2}
          pageCount={pageCount}
          previousLabel=""
          pageLinkClassName="w-9 h-9 border-[1px] border-lightColor hover:border-gray-500 duration-300 flex justify-center items-center"
          pageClassName="mr-6"
          containerClassName="flex text-base font-semibold font-titleFont py-10"
          activeClassName="bg-black text-white"
        />

        <p className="text-base font-normal text-lightText">
          Products from {itemStart} to {Math.min(endOffset, filteredProducts.length)} of {filteredProducts.length}
        </p>
      </div>
    </div>
  );
};

export default Pagination;
