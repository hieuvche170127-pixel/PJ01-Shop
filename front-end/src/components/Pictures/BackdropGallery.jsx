import React, { useState, useEffect } from "react";
import { Backdrop, IconButton } from "@mui/material";
import CloseIcon from "../Icons/CloseIcon";
import PreviousIcon from "../Icons/PreviousIcon";
import NextIcon from "../Icons/NextIcon";

const BackdropGallery = ({ open, handleClose, currentPassedImage, images }) => {
  const [backdropImage, setBackdropImage] = useState(currentPassedImage);
  const [currentPassedImageIndex, setCurrentPassedImageIndex] = useState(0);

  useEffect(() => {
    setBackdropImage(currentPassedImage);
    images.forEach((img, index) => {
      if (img === currentPassedImage) {
        setCurrentPassedImageIndex(index);
      }
    });
  }, [currentPassedImage, images]);

  const handleIncrement = () => {
    if (currentPassedImageIndex === images.length - 1) {
      setBackdropImage(images[0]);
      setCurrentPassedImageIndex(0);
    } else {
      setBackdropImage(images[currentPassedImageIndex + 1]);
      setCurrentPassedImageIndex(currentPassedImageIndex + 1);
    }
  };

  const handleDecrement = () => {
    if (currentPassedImageIndex === 0) {
      setBackdropImage(images[images.length - 1]);
      setCurrentPassedImageIndex(images.length - 1);
    } else {
      setBackdropImage(images[currentPassedImageIndex - 1]);
      setCurrentPassedImageIndex(currentPassedImageIndex - 1);
    }
  };

  return (
    <div>
      <Backdrop open={open} onClick={handleClose}>
        <div className="image-wrapper">
          <IconButton className="close-button" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
          <IconButton className="previous-button" onClick={handleDecrement}>
            <PreviousIcon />
          </IconButton>
          <img src={backdropImage} alt="Backdrop Gallery" />
          <IconButton className="next-button" onClick={handleIncrement}>
            <NextIcon />
          </IconButton>
        </div>
      </Backdrop>
    </div>
  );
};

export default BackdropGallery;
