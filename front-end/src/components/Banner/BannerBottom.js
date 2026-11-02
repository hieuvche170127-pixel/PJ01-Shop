import React from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button
} from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const BannerBottom = () => {
  const categories = [
    {
      id: 1,
      title: "Điện thoại",
      description: "Khám phá các dòng điện thoại thông minh mới nhất",
      image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=2027&auto=format&fit=crop",
      link: "/phones"
    },
    {
      id: 2,
      title: "Laptop",
      description: "Hiệu suất mạnh mẽ cho công việc và giải trí",
      image: "https://images.unsplash.com/photo-1611078489935-0cb964de46d6?q=80&w=1974&auto=format&fit=crop",
      link: "/laptops"
    },
    {
      id: 3,
      title: "Thiết bị thông minh",
      description: "Nâng cấp trải nghiệm sống với công nghệ hiện đại",
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1964&auto=format&fit=crop",
      link: "/smart-devices"
    },
  ];

  const featuredProducts = [
    {
      id: 1,
      title: "Sản phẩm mới nhất",
      buttonText: "Xem ngay",
      bgColor: "linear-gradient(135deg, #0F52BA 0%, #4ECDC4 100%)",
      link: "/new-arrivals"
    },
    {
      id: 2,
      title: "Giảm giá đặc biệt",
      buttonText: "Mua ngay",
      bgColor: "linear-gradient(135deg, #FF6B6B 0%, #FFD166 100%)",
      link: "/special-offers"
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ pt: 6, pb: 10 }}>
      {/* Section title */}
      <Box sx={{ mb: 5, textAlign: "center" }} className="animate-fade-in">
        <Typography 
          variant="h4" 
          fontWeight="bold" 
          sx={{ 
            mb: 1,
            position: "relative",
            display: "inline-block",
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: "-8px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "80px",
              height: "3px",
              backgroundColor: "#0F52BA",
              borderRadius: "2px",
            }
          }}
        >
          Danh mục nổi bật
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 3, maxWidth: "700px", mx: "auto" }}>
          Khám phá các danh mục sản phẩm chất lượng cao với mức giá cạnh tranh nhất trên thị trường
        </Typography>
      </Box>

      {/* Categories */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {categories.map((category, index) => (
          <Grid 
            item 
            key={category.id} 
            xs={12} 
            md={4} 
            className="animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <Card 
              className="product-card" 
              sx={{ 
                height: "100%",
                overflow: "hidden",
                borderRadius: "12px",
                position: "relative",
                "&:hover img": {
                  transform: "scale(1.05)",
                },
                "&:hover .overlay": {
                  opacity: 1,
                }
              }}
            >
              <CardMedia
                component="img"
                height="240"
                image={category.image}
                alt={category.title}
                sx={{ 
                  transition: "transform 0.6s ease",
                }}
              />
              <Box 
                className="overlay"
                sx={{ 
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  p: 3,
                  opacity: 0.9,
                  transition: "opacity 0.3s ease",
                }}
              >
                <Typography 
                  variant="h5" 
                  fontWeight="bold" 
                  color="white"
                  sx={{ mb: 1 }}
                >
                  {category.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="white" 
                  sx={{ 
                    mb: 2,
                    opacity: 0.9
                  }}
                >
                  {category.description}
                </Typography>
                <Button
                  component={Link}
                  to={category.link}
                  variant="outlined"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    color: "white",
                    borderColor: "white",
                    width: "fit-content",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.1)",
                      borderColor: "white",
                    }
                  }}
                >
                  Xem thêm
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Featured sections */}
      <Grid container spacing={3}>
        {featuredProducts.map((item, index) => (
          <Grid 
            item 
            key={item.id} 
            xs={12} 
            md={6}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            <Box
              sx={{
                height: "180px",
                borderRadius: "12px",
                background: item.bgColor,
                position: "relative",
                overflow: "hidden",
                p: 4,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.2)",
                }
              }}
            >
              <Typography 
                variant="h4" 
                fontWeight="bold" 
                color="white"
                sx={{ mb: 2 }}
              >
                {item.title}
              </Typography>
              
              <Button
                component={Link}
                to={item.link}
                variant="contained"
                className="hoverEffect"
                sx={{
                  backgroundColor: "white",
                  color: "#0F52BA",
                  width: "fit-content",
                  fontWeight: "bold",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  borderRadius: "8px",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.9)",
                  }
                }}
              >
                {item.buttonText}
              </Button>

              {/* Decorative elements */}
              <Box 
                sx={{ 
                  position: "absolute",
                  top: "-30px",
                  right: "-30px",
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.1)",
                }}
              />
              <Box 
                sx={{ 
                  position: "absolute",
                  bottom: "-40px",
                  right: "30%",
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.1)",
                }}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default BannerBottom;
