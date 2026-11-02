import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import NavTitle from "./NavTitle";
import { toggleColor } from "../../../../redux/orebiSlice";

const Color = () => {
  const [showColors, setShowColors] = useState(true);
  const colors = [
    // { _id: 9001, name: "Green", base: "#22c55e" },
    // { _id: 9002, name: "Gray", base: "#a3a3a3" },
    // { _id: 9003, name: "Red", base: "#dc2626" },
    // { _id: 9004, name: "Yellow", base: "#f59e0b" },
    // { _id: 9005, name: "Blue", base: "#3b82f6" },
    { _id: 9006, name: "Black", base: "#000000" },
    { _id: 9007, name: "Silver", base: "#EEEDEB" },
  ];

  const checkedColors = useSelector((state) => state.orebiReducer.checkedColors);
  const dispatch = useDispatch();

  const handleToggleColor = (color) => {
    dispatch(toggleColor(color));
  };

  return (
    <div >
      <div
        onClick={() => setShowColors(!showColors)}
        className="cursor-pointer"
      >
        <NavTitle title="Shop by Color" icons={true} />
      </div>
      {showColors && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ul className="flex flex-col gap-4 text-sm lg:text-base text-[#767676]">
            {colors.map((item) => (
              <li
                key={item._id}
                className="border-b-[1px] border-b-[#F0F0F0] pb-2 flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  id={item._id}
                  checked={checkedColors.some((c) => c._id === item._id)}
                  onChange={() => handleToggleColor(item)}
                />
                <span
                  style={{ background: item.base }}
                  className={`w-3 h-3 bg-gray-500 rounded-full`}
                ></span>
                {item.name}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default Color;
