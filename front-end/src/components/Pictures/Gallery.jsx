import React, { useState, useEffect } from "react";
import BackdropGallery from "./BackdropGallery";
import ProductService from "../../services/api/ProductService";
// import { ImageList, ImageListItem } from "@mui/material"; // Import MUI components

const Gallery = ({ images = [] }) => {
  const [currentImage, setCurrentImage] = useState(images[0] || null);
  const [currentPassedImage, setCurrentPassedImage] = useState(images[0] || null);
  const [open, setOpen] = useState(false);

  const handleClick = (index) => {
    setCurrentImage(images[index]);
  };

  const handleToggle = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const removeActivatedClass = (parent) => {
    parent.childNodes.forEach((node) => {
      node.childNodes[0].classList.contains("activated") &&
        node.childNodes[0].classList.remove("activated");
    });
  };

  useEffect(() => {
    setCurrentPassedImage(currentImage);
  }, [currentImage]);

  return (
    <section className="gallery-holder hide-in-mobile">
      <section className="gallery">
        <div className="image">
          {currentImage && (
            <img src={ProductService.getImage(currentImage.filename)} alt="product" onClick={handleToggle} />
          )}
        </div>
        <BackdropGallery
          handleClose={handleClose}
          open={open}
          currentPassedImage={currentPassedImage}
          images={images}
        />
        <div className="thumbnails">
   
            {images.map((item, index) => (
  
                <div
                key={item._id}
                  className="img-holder"
                  onClick={(e) => {
                    handleClick(index);
                    removeActivatedClass(e.currentTarget.parentNode);
                    e.currentTarget.childNodes[0].classList.toggle("activated");
                  }}
                >
                  <div className={`outlay ${index === 0 ? "activated" : ""}`}></div>
                  <img
                    srcSet={`${ProductService.getImage(item.filename)}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                    src={`${ProductService.getImage(item.filename)}?w=164&h=164&fit=crop&auto=format`}
                    loading="lazy"
                    alt={`product-${index + 1}`}
                  />
                </div>
            
            ))}
        
        </div>
      </section>
    </section>
  );
};

export default Gallery;
