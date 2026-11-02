import React from "react";
import { Link, useRouteError } from "react-router-dom";
import { Box, Typography, Button, Paper } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import { motion } from "framer-motion";

const ErrorPage = () => {
  const error = useRouteError();
  console.error(error);

  let errorMessage = "An unexpected error has occurred";
  let statusText = "Error";
  
  if (error) {
    if (error.status === 404) {
      statusText = "404 - Page Not Found";
      errorMessage = "The page you are looking for doesn't exist or has been moved.";
    } else if (error.status === 500) {
      statusText = "500 - Server Error";
      errorMessage = "A server error has occurred. Please try again later.";
    } else if (error.message) {
      errorMessage = error.message;
    }
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      padding={3}
      sx={{
        background: "linear-gradient(to right, #f5f7fa, #e4e9f2)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", maxWidth: 600 }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 5,
            width: "100%",
            textAlign: "center",
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          }}
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2
            }}
          >
            <ErrorIcon 
              sx={{ 
                fontSize: 100, 
                color: "#0F52BA", 
                mb: 2,
                opacity: 0.8
              }} 
            />
          </motion.div>
          
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            gutterBottom
            sx={{ color: "#0F52BA" }}
          >
            {statusText}
          </Typography>
          
          <Typography 
            variant="body1" 
            color="text.secondary" 
            paragraph
            sx={{ mb: 4, maxWidth: "80%", mx: "auto" }}
          >
            {errorMessage}
          </Typography>
          
          <Box 
            mt={4} 
            display="flex" 
            justifyContent="center" 
            gap={2}
            sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}
          >
            <Button
              variant="contained"
              component={Link}
              to="/"
              sx={{ 
                px: 4, 
                py: 1.2,
                backgroundColor: "#0F52BA",
                "&:hover": {
                  backgroundColor: "#0A3C8A",
                },
                borderRadius: 2,
                boxShadow: "0 4px 10px rgba(15, 82, 186, 0.3)",
                textTransform: "none",
                fontWeight: 600
              }}
            >
              Return to Home
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => window.history.back()}
              sx={{ 
                px: 4, 
                py: 1.2,
                borderColor: "#0F52BA",
                color: "#0F52BA",
                "&:hover": {
                  borderColor: "#0A3C8A",
                  backgroundColor: "rgba(15, 82, 186, 0.04)",
                },
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600
              }}
            >
              Go Back
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default ErrorPage; 