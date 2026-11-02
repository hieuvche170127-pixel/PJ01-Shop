import { API_ORIGIN } from '../../../utils/apiUrl';
// ManageProduct.js
import * as React from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Products from "./Products";
import { useOutletContext } from "react-router-dom";
import axios from "axios";

export default function ManageProductA() {
  const { handleSetDashboardTitle } = useOutletContext();
  const [products, setProducts] = React.useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Set the dashboard title
  React.useEffect(() => {
    handleSetDashboardTitle("Manage Products");
  }, [handleSetDashboardTitle]);

  // Fetch products with pagination
  const updateProductList = async (page = 1) => {
    try {
      const res = await axios.get(
        `${API_ORIGIN}/api/admin/products?page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setProducts(res.data.data);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || 1);
    } catch (error) {
      console.error("Error fetching product list:", error);
    }
  };

  React.useEffect(() => {
    updateProductList(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateProductList(newPage);
    }
  };

  return (
    <>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
          <Products
            products={products}
            onProductUpdated={updateProductList}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </Paper>
      </Grid>
    </>
  );
}