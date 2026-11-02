import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import StoreProfile from './StoreProfile';
import { useOutletContext } from 'react-router-dom';

export default function ManageStoreProfile() {
  const { handleSetDashboardTitle } = useOutletContext();
  React.useEffect(() => {
    handleSetDashboardTitle("Manage Store Profile");
  }, [handleSetDashboardTitle]);
  return (
    <Grid item xs={12}>
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <StoreProfile />
      </Paper>
    </Grid>
  );
}
