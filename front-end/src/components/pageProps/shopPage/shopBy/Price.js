import { formatVND } from '../../../../utils/currency';
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import NavTitle from "./NavTitle";
import { togglePrice } from "../../../../redux/orebiSlice";

const Price = () => {
  const priceList = [
    { _id: 950, priceOne: 0, priceTwo: 999999 },
    { _id: 951, priceOne: 1000000, priceTwo: 2999999 },
    { _id: 952, priceOne: 3000000, priceTwo: 4999999 },
    { _id: 953, priceOne: 5000000, priceTwo: 9999999 },
    { _id: 954, priceOne: 10000000, priceTwo: 19999999 },
    { _id: 955, priceOne: 20000000, priceTwo: 29999999 },
    { _id: 956, priceOne: 30000000, priceTwo: 100000000 },
  ];

  const checkedPrices = useSelector((state) => state.orebiReducer.checkedPrices);
  const dispatch = useDispatch();

  const handleTogglePrice = (price) => {
    dispatch(togglePrice(price));
  };

  return (
    <div className="cursor-pointer">
      <NavTitle title="Shop by Price" icons={false} />
      <div className="font-titleFont">
        <ul className="flex flex-col gap-4 text-sm lg:text-base text-[#767676]">
          {priceList.map((item) => (
            <li
              key={item._id}
              className="border-b-[1px] border-b-[#F0F0F0] pb-2 flex items-center gap-2 hover:text-primeColor hover:border-gray-400 duration-300"
            >
              <input
                type="checkbox"
                id={item._id}
                checked={checkedPrices.some((p) => p._id === item._id)}
                onChange={() => handleTogglePrice(item)}
              />
              {formatVND(item.priceOne)} - {formatVND(item.priceTwo)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Price;
