import React, { useState, useEffect } from "react";
import Heading from "../Products/Heading";
import Product from "../Products/Product";
import OrderService from "../../../services/api/OrderService";
// import {
//   bestSellerOne,
//   bestSellerTwo,
//   bestSellerThree,
//   bestSellerFour,
// } from "../../../assets/images/index";

const BestSellers = () => {
  const [bestSellers, setBestSellers] = useState([]);
  useEffect(() => {
    const fetchBestSellers = async () => {
      const result = await OrderService.getTopSellingProducts();
      setBestSellers(result);
    };

    fetchBestSellers();
  }, []);
  return (
    <div className="w-full pb-20">
      <Heading heading="Our Bestsellers" />
      <div className="w-full grid grid-cols-1 md:grid-cols-2 lgl:grid-cols-3 xl:grid-cols-4 gap-10">
        {bestSellers?.map(item => (
          <div key={item.productId} className="px-2">
            <Product
              // key={item.productId}
              _id={item?.productId}
              images={item?.productDetails?.images}
              name={item?.productDetails?.name}
              price={item?.productDetails?.price}
              inStock={item?.productDetails?.inStock}
              category={item?.productDetails?.category.name}
              brand={item?.productDetails?.brand.name}
              isDeleted={item?.isDeleted}
              description={item?.productDetails?.description}
              specs={item?.productDetails?.specs}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default BestSellers;
