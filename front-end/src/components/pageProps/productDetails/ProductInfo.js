import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "../../../redux/orebiSlice";

const ProductInfo = ({ productInfo }) => {
  const highlightStyle = {
    color: "#d0121a", // Change this to the desired color
    fontWeight: "bold", // Change this to the desired font weight
  };

  const renderDescription = () => {
    if (!productInfo.description) {
      return null; // or handle accordingly if product.des is not defined
    }

    const description = productInfo.description.split(/:(.*?)-/).map((part, index) => {
      return (
        <span key={index} style={index % 2 === 1 ? highlightStyle : {}}>
          {part}
        </span>
      );
    });

    return <>{description}</>;
  };
  const dispatch = useDispatch();
  const [selectedColor, setSelectedColor] = useState(
    productInfo.inStock?.[0]?.color || ""
  );
  const [isOutOfStock, setIsOutOfStock] = useState(false);

  useEffect(() => {
    if (productInfo.inStock?.length > 0) {
      const initialColor = productInfo.inStock[0];
      setSelectedColor(initialColor.color);
      setIsOutOfStock(initialColor.quantity === 0);
    }
  }, [productInfo.inStock]);

  const handleColorSelect = (color, quantity) => {
    setSelectedColor(color);
    setIsOutOfStock(quantity === 0);
  }
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-4xl font-semibold">{productInfo.name}</h2>
      <p className="text-2xl font-semibold">
        {productInfo.price} Dt
        <span className="text-xl font-semibold line-through ml-2">540</span>
        <span className="text-xs ml-2 inline-flex items-center px-3 py-1 rounded-full bg-green-600 text-white">
          Save 100
        </span>
      </p>
      <hr />
      <p className="text-base text-gray-600">{renderDescription()}</p>

      <div className="flex items-center">
        <p className="text-sm mr-2"> leave a review </p>

        <svg
          className="w-4 h-4 text-yellow-300 ms-1"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 22 20"
        >
          <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
        </svg>
        <svg
          className="w-4 h-4 text-yellow-300 ms-1"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 22 20"
        >
          <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
        </svg>
        <svg
          className="w-4 h-4 text-yellow-300 ms-1"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 22 20"
        >
          <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
        </svg>
        <svg
          className="w-4 h-4 text-yellow-300 ms-1"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 22 20"
        >
          <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
        </svg>
        <svg
          className="w-4 h-4 ms-1 text-gray-300 dark:text-gray-500"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
          viewBox="0 0 22 20"
        >
          <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z" />
        </svg>
      </div>

      {
        productInfo.isDeleted ? (
          <p className="text-base text-red-600 font-medium">Sold Out</p>
        ) : (
          <p className="text-base text-green-600 font-medium">En Stock</p>
        )
      }
      {isOutOfStock && <p className="text-red-500">The selected color is out of stock</p>}

      <p className="font-medium text-lg">
        <span className="font-normal">Colors:</span>{" "}
        {productInfo.inStock?.map((item) => (
          <button
            key={item._id}
            onClick={() => handleColorSelect(item.color, item.quantity)}
            className={`text-sm rounded-full px-3 py-1 mr-2 ${selectedColor === item.color
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-800"
              }`}
          >
            {item.color}
          </button>
        ))}
      </p>
      <button
        onClick={() =>
          dispatch(
            addToCart({
              _id: productInfo._id,
              name: productInfo.name,
              quantity: 1,
              images: productInfo.images,
              isDeleted: productInfo.isDeleted,
              price: productInfo.price,
              inStock: productInfo.inStock,
              color: selectedColor,
              cost: productInfo.cost,
            })
          )
        }
        className={`w-full py-4 bg-blue-500 hover:bg-blue-600 duration-300 text-white text-lg font-titleFont ${productInfo.isDeleted || isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        disabled={productInfo.isDeleted || isOutOfStock}
      >
        Add to Cart
      </button>
      <p className="font-normal text-sm">
        <span className="text-base font-medium"> Categories:</span>{productInfo?.category || "Spring collection, Streetwear, Women"}
        <span className="text-base font-medium"> Brands:</span>{productInfo?.brand || "Spring collection, Streetwear, Women"}
      </p>
    </div>
  );
};

export default ProductInfo;
