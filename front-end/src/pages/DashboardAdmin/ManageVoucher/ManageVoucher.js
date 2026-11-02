import React, { useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import VoucherList from './VoucherList';

const ManageVoucher = () => {
  const { handleSetDashboardTitle } = useOutletContext();
  
  useEffect(() => {
    handleSetDashboardTitle("Voucher Management");
  }, [handleSetDashboardTitle]);

  return <VoucherList />;
};

export default ManageVoucher; 