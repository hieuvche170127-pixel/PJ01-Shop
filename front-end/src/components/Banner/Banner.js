import React, { useState } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import { bannerImgOne } from "../../assets/images";
import Image from "../designLayouts/Image";
import { Box, Typography, Button, Container } from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const CustomSlide = ({ Subtext, imgSrc, text, buttonLink, buttonText }) => (
  <Box
    sx={{
      position: "relative",
      display: "flex",
      flexDirection: { xs: "column", md: "row" },
      alignItems: "center",
      justifyContent: "center",
      height: { xs: "auto", md: "500px" },
      overflow: "hidden",
      background: "linear-gradient(135deg, rgba(15, 82, 186, 0.05) 0%, rgba(255, 255, 255, 0.8) 100%)",
      borderRadius: "12px",
      py: { xs: 6, md: 0 },
    }}
    className="animate-fade-in"
  >
    <Container maxWidth="lg">
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          px: { xs: 3, md: 6 },
        }}
      >
        <Box
          sx={{
            flex: 1,
            maxWidth: { xs: "100%", md: "50%" },
            textAlign: { xs: "center", md: "left" },
            order: { xs: 2, md: 1 },
          }}
          className="animate-slide-up"
        >
          <Typography
            variant="subtitle1"
            sx={{
              color: "#0F52BA",
              fontWeight: 600,
              mb: 2,
              fontSize: { xs: "0.9rem", md: "1.1rem" },
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Shopii Store
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: "2rem", md: "3rem" },
              color: "#1E1E1E",
              lineHeight: 1.2,
              position: "relative",
            }}
          >
            {text}
            <Box
              component="span"
              sx={{
                display: "inline-block",
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: "-8px",
                  left: 0,
                  width: "60%",
                  height: "4px",
                  backgroundColor: "#FF6B6B",
                  borderRadius: "2px",
                }
              }}
            ></Box>
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 4,
              fontSize: { xs: "1rem", md: "1.2rem" },
              color: "#6D6D6D",
              maxWidth: "90%",
              mx: { xs: "auto", md: 0 },
            }}
          >
            {Subtext}
          </Typography>

          <Box sx={{ display: "flex", gap: 2, justifyContent: { xs: "center", md: "flex-start" } }}>
            <Button
              component={Link}
              to={buttonLink}
              variant="contained"
              className="hoverEffect"
              endIcon={<ShoppingCartIcon />}
              sx={{
                py: 1.5,
                px: 3,
                backgroundColor: "#0F52BA",
                color: "white",
                fontWeight: 600,
                fontSize: "1rem",
                borderRadius: "8px",
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(15, 82, 186, 0.3)",
                "&:hover": {
                  backgroundColor: "#0A3C8A",
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 16px rgba(15, 82, 186, 0.4)",
                },
                transition: "all 0.3s ease",
              }}
            >
              {buttonText}
            </Button>

            <Button
              component={Link}
              to="/about"
              variant="outlined"
              endIcon={<ArrowForwardIcon />}
              sx={{
                py: 1.5,
                px: 3,
                borderColor: "#0F52BA",
                color: "#0F52BA",
                fontWeight: 600,
                fontSize: "1rem",
                borderRadius: "8px",
                textTransform: "none",
                "&:hover": {
                  borderColor: "#0A3C8A",
                  backgroundColor: "rgba(15, 82, 186, 0.05)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Tìm hiểu thêm
            </Button>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mt: 4, justifyContent: { xs: "center", md: "flex-start" } }}>
            <Box sx={{ display: "flex", alignItems: "center", mr: 3 }}>
              <LocalShippingIcon sx={{ color: "#0F52BA", mr: 1, fontSize: "1.2rem" }} />
              <Typography variant="body2" sx={{ color: "#6D6D6D" }}>
                Giao hàng miễn phí
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box 
                component="span" 
                sx={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: "50%", 
                  backgroundColor: "#4ECDC4", 
                  mr: 1,
                  display: "inline-block"
                }} 
              />
              <Typography variant="body2" sx={{ color: "#6D6D6D" }}>
                Bảo hành 12 tháng
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            flex: 1,
            maxWidth: { xs: "100%", md: "50%" },
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            order: { xs: 1, md: 2 },
            position: "relative",
          }}
          className="animate-fade-in"
        >
          <Box
            sx={{
              width: "100%",
              height: "100%",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                width: "300px",
                height: "300px",
                borderRadius: "50%",
                backgroundColor: "rgba(78, 205, 196, 0.1)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 0,
              },
              "&:hover img": {
                transform: "scale(1.05)",
              },
            }}
          >
            <Box
              component="img"
              src={imgSrc}
              alt="Banner Image"
              sx={{
                width: "100%",
                height: "auto",
                maxWidth: "450px",
                objectFit: "contain",
                zIndex: 1,
                position: "relative",
                transition: "transform 0.6s ease",
              }}
            />
          </Box>
        </Box>
      </Box>
    </Container>
  </Box>
);

const Banner = () => {
  const [dotActive, setDocActive] = useState(0);
  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    speed: 1000,
    autoplaySpeed: 5000,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: false,
    beforeChange: (prev, next) => {
      setDocActive(next);
    },
    appendDots: (dots) => (
      <Box
        sx={{
          position: "absolute",
          bottom: { xs: "10px", md: "20px" },
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <ul 
          style={{ 
            margin: "0px", 
            padding: 0, 
            display: "flex", 
            justifyContent: "center",
            gap: "8px"
          }}
        > 
          {dots} 
        </ul>
      </Box>
    ),
    customPaging: (i) => (
      <Box
        component="button"
        sx={
          i === dotActive
            ? {
                width: "12px",
                height: "12px",
                border: "none",
                borderRadius: "50%",
                backgroundColor: "#0F52BA",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s ease",
              }
            : {
                width: "10px",
                height: "10px",
                border: "none",
                borderRadius: "50%",
                backgroundColor: "rgba(15, 82, 186, 0.3)",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.3s ease",
              }
        }
      />
    ),
    responsive: [
      {
        breakpoint: 768,
        settings: {
          dots: true,
        },
      },
    ],
  };

  const slides = [
    {
      imgSrc: bannerImgOne,
      text: "Khám phá sản phẩm công nghệ hàng đầu",
      Subtext:
        "Trải nghiệm mua sắm trực tuyến với đa dạng sản phẩm chất lượng cao và dịch vụ hỗ trợ tận tâm",
      buttonLink: "/shop",
      buttonText: "Mua sắm ngay",
    },
    {
      imgSrc: bannerImgOne,
      text: "Ưu đãi đặc biệt dành cho bạn",
      Subtext:
        "Khám phá các sản phẩm độc quyền với giá ưu đãi và chính sách bảo hành dài hạn",
      buttonLink: "/offers",
      buttonText: "Xem ưu đãi",
    },
    {
      imgSrc: bannerImgOne,
      text: "Nâng tầm trải nghiệm mua sắm",
      Subtext:
        "Với hệ thống thanh toán an toàn và giao hàng nhanh chóng, mua sắm chưa bao giờ đơn giản hơn thế",
      buttonLink: "/shop",
      buttonText: "Khám phá ngay",
    },
  ];

  return (
    <Box sx={{ pt: 2, pb: 6, px: { xs: 2, md: 4 } }}>
      <Slider {...settings}>
        {slides.map((slide, index) => (
          <CustomSlide key={index} {...slide} />
        ))}
      </Slider>
    </Box>
  );
};

export default Banner;
