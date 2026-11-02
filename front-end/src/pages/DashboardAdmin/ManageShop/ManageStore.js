import { API_ORIGIN } from '../../../utils/apiUrl';
// ManageStore.js
import * as React from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stores from "./Stores";
import { useOutletContext } from "react-router-dom";
import axios from "axios";

export default function ManageStore() {
  const { handleSetDashboardTitle } = useOutletContext();
  const [stores, setStores] = React.useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Set the dashboard title
  React.useEffect(() => {
    handleSetDashboardTitle("Manage Stores");
  }, [handleSetDashboardTitle]);

  // Fetch stores with ratings and pagination
  const updateStoreList = async (page = 1) => {
    try {
      const res = await axios.get(
        `${API_ORIGIN}/api/admin/stores?page=${page}&limit=10&withRatings=true`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setStores(res.data.data);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || 1);
    } catch (error) {
      console.error("Error fetching store list:", error);
    }
  };

  React.useEffect(() => {
    updateStoreList(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateStoreList(newPage);
    }
  };

  return (
    <>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
          <Stores
            stores={stores}
            onStoreUpdated={updateStoreList}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </Paper>
      </Grid>
    </>
  );
}
