import { API_ORIGIN } from '../../../utils/apiUrl';
import * as React from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Users from "./Users";
import { useOutletContext } from "react-router-dom";
import axios from "axios";

export default function ManageUser() {
  const { handleSetDashboardTitle } = useOutletContext();
  const [users, setUsers] = React.useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  // Set the dashboard title
  React.useEffect(() => {
    handleSetDashboardTitle("Manage Users");
  }, [handleSetDashboardTitle]);

  // Fetch users with pagination
  const updateUserList = async (page = 1) => {
    try {
      const res = await axios.get(
        `${API_ORIGIN}/api/admin/users?page=${page}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setUsers(res.data.data);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || 1);
    } catch (error) {
      console.error("Error fetching user list:", error);
    }
  };

  React.useEffect(() => {
    updateUserList(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      updateUserList(newPage);
    }
  };

  return (
    <>
      <Grid item xs={12}>
        <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
          <Users
            users={users}
            onUserUpdated={updateUserList}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </Paper>
      </Grid>
    </>
  );
}
