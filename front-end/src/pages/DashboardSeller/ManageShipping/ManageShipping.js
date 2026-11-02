import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Title from "../Title";
import { useOutletContext } from "react-router-dom";
import { Pagination, Select, Modal, Button, Table, message, Tag, Badge, Space, Popconfirm } from "antd";
import axios from "axios";
import { ReloadOutlined } from "@ant-design/icons";

const { Option } = Select;

const statusColors = {
  pending: "orange",
  shipping: "blue",
  shipped: "green",
  "failed to ship": "red",
  rejected: "red",
};

const ManageShipping = () => {
  const { handleSetDashboardTitle } = useOutletContext();
  useEffect(() => { handleSetDashboardTitle("Shipping Management"); }, [handleSetDashboardTitle]);
  const token = useSelector((state) => state.auth.token);
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [confirmShippedVisible, setConfirmShippedVisible] = useState(false);

  // Fetch shipping data
  const fetchShippingData = async () => {
    try {
      setLoading(true);
      const baseURL = (process.env.REACT_APP_API_URL || 'http://localhost:9999').replace(/\/api\/?$/, '');
      console.log('Fetching shipping data from:', `${baseURL}/api/seller/shipping`);
      
      const response = await axios.get(
        `${baseURL}/api/seller/shipping`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('Shipping API response:', response.data);
      
      if (response.data.success) {
        setShipments(response.data.data);
      } else {
        message.error(response.data.message || "Failed to load shipping information");
      }
    } catch (error) {
      console.error("Error fetching shipping data:", error.response || error);
      message.error("Failed to load shipping information. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchShippingData();
    } else {
      console.error("No authentication token available");
      message.error("Please log in to access shipping information");
    }
  }, [token]);

  // Handle status update button click
  const handleUpdateClick = () => {
    if (selectedStatus === "shipped") {
      setConfirmShippedVisible(true);
    } else {
      updateShippingStatus();
    }
  };

  // Update shipping status
  const updateShippingStatus = async () => {
    if (!selectedShipment || !selectedStatus) return;
    if (selectedStatus === 'rejected' && !window.confirm('Xác nhận shop đã nhận lại hàng giao lỗi và muốn hoàn kho?')) return;

    try {
      setLoading(true);
      const baseURL = (process.env.REACT_APP_API_URL || 'http://localhost:9999').replace(/\/api\/?$/, '');
      
      const response = await axios.put(
        `${baseURL}/api/seller/shipping/${selectedShipment.shippingInfo._id}/status`,
        { status: selectedStatus, returnedToStock: selectedStatus === 'rejected' },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        message.success("Shipping status updated successfully");
        setStatusModalVisible(false);
        setConfirmShippedVisible(false);
        fetchShippingData(); // Refresh data
      } else {
        message.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating shipping status:", error.response || error);
      message.error(error.response?.data?.message || 'Không thể cập nhật trạng thái.');
    } finally {
      setLoading(false);
    }
  };

  // Open status update modal
  const showStatusModal = (record) => {
    setSelectedShipment(record);
    setSelectedStatus(record.shippingInfo?.status || "shipping");
    setStatusModalVisible(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusBadge = (status) => (
    <Tag color={statusColors[status] || "default"}>
      {status?.toUpperCase() || "UNKNOWN"}
    </Tag>
  );

  // Get button type based on status
  const getButtonTypeByStatus = (status) => {
    switch (status) {
      case "shipping":
        return "primary";
      case "shipped":
        return "success";
      case "failed to ship":
        return "danger";
      default:
        return "default";
    }
  };

  // Get button color based on status for consistent UI
  const getButtonColorProps = (status) => {
    switch (status) {
      case "shipping":
        return { type: "primary", danger: false };
      case "shipped":
        return { type: "success" };
      case "failed to ship":
        return { type: "primary", danger: true };
      default:
        return { type: "default", danger: false };
    }
  };

  // Table columns
  const columns = [
    {
      title: "Order ID",
      dataIndex: ["orderItem", "orderId"],
      key: "orderId",
      render: (orderId) => orderId?._id ? orderId._id.substring(0, 8) + "..." : "N/A",
    },
    {
      title: "Product",
      dataIndex: ["orderItem", "productId"],
      key: "product",
      render: (product) => (
        <div className="flex items-center">
          {product?.image && (
            <img 
              src={product.image} 
              alt={product.title} 
              className="w-12 h-12 object-cover mr-2 rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/100";
              }}
            />
          )}
          <div>
            <div className="font-medium">{product?.title || "N/A"}</div>
            <div className="text-xs text-gray-500">{product?.categoryId?.name || ""}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Buyer",
      dataIndex: ["orderItem", "orderId", "buyerId"],
      key: "buyer",
      render: (buyer) => buyer?.fullname || buyer?.username || "N/A",
    },
    {
      title: "Quantity",
      dataIndex: ["orderItem", "quantity"],
      key: "quantity",
    },
    {
      title: "Tracking #",
      dataIndex: ["shippingInfo", "trackingNumber"],
      key: "trackingNumber",
    },
    {
      title: "Carrier",
      dataIndex: ["shippingInfo", "carrier"],
      key: "carrier",
      render: (carrier) => carrier || "GHTK",
    },
    {
      title: "Est. Delivery",
      dataIndex: ["shippingInfo", "estimatedArrival"],
      key: "estimatedArrival",
      render: (date) => formatDate(date),
    },
    {
      title: "Shipping Status",
      dataIndex: ["shippingInfo", "status"],
      key: "shippingStatus",
      render: (status) => getStatusBadge(status),
    },

    {
      title: "Created At",
      dataIndex: ["shippingInfo", "createdAt"],
      key: "createdAt",
      render: (date) => formatDate(date),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          {record.shippingInfo && (
            <Button 
              type={record.shippingInfo.status === "shipped" ? "default" : "primary"} 
              size="small"
              ghost={record.shippingInfo.status !== "shipped"}
              disabled={['shipped', 'rejected'].includes(record.orderItem.status)}
              onClick={() => showStatusModal(record)}
            >
              {record.shippingInfo.status === "shipped" ? "Completed" : "Update Status"}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Filter out items without shipping info for table display
  const tableData = shipments.filter(item => item.shippingInfo);

  return (
    <div className="w-full">
      <div className="w-full flex flex-col gap-4">
        <div className="w-full flex flex-row justify-between">
          <Title>Shipping Management</Title>
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={fetchShippingData}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <Table
            dataSource={tableData}
            columns={columns}
            rowKey={(record) => record.shippingInfo?._id || record.orderItem?._id}
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: tableData.length,
              onChange: (page) => setCurrentPage(page),
              onShowSizeChange: (_, size) => setPageSize(size),
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} items`,
            }}
          />
        </div>
      </div>

      {/* Status Update Modal */}
      <Modal
        title="Update Shipping Status"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={[
          <Button key="cancel" type="default" onClick={() => setStatusModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type={selectedStatus === "shipped" ? "default" : "primary"}
            ghost={selectedStatus !== "shipped"}
            loading={loading}
            onClick={handleUpdateClick}
          >
            {selectedStatus === "shipped" ? "Complete Shipping" : "Update Status"}
          </Button>,
        ]}
      >
        <div className="mb-4">
          <p>
            <strong>Order ID:</strong>{" "}
            {selectedShipment?.orderItem?.orderId?._id || "N/A"}
          </p>
          <p>
            <strong>Product:</strong>{" "}
            {selectedShipment?.orderItem?.productId?.title || "N/A"}
          </p>
          <p>
            <strong>Current Status:</strong>{" "}
            {getStatusBadge(selectedShipment?.shippingInfo?.status)}
          </p>
        </div>
        <div>
          <label className="block mb-2">New Status:</label>
          <Select
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value)}
            style={{ width: "100%" }}
          >
            {selectedShipment?.orderItem?.status === 'failed to ship' ? <>
              <Option value="shipping">Giao lại</Option>
              <Option value="rejected">Đã nhận lại hàng — hoàn kho</Option>
            </> : <>
              <Option value="shipping">Đang giao</Option>
              <Option value="shipped">Đã giao (chưa xác nhận thu COD)</Option>
              <Option value="failed to ship">Giao không thành công</Option>
            </>}
          </Select>
        </div>
      </Modal>

      {/* Confirmation Modal for Shipped Status */}
      <Modal
        title="Confirm Final Status Update"
        open={confirmShippedVisible}
        onCancel={() => setConfirmShippedVisible(false)}
        footer={[
          <Button key="cancel" type="default" onClick={() => setConfirmShippedVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="success"
            loading={loading}
            onClick={updateShippingStatus}
          >
            Confirm as Shipped
          </Button>,
        ]}
      >
        <div className="text-red-500 font-medium mb-4">
          Warning: This action cannot be undone!
        </div>
        <p>
          You are about to mark this shipment as <strong>SHIPPED</strong>. Once updated, 
          the status cannot be changed again. Are you sure you want to proceed?
        </p>
      </Modal>
    </div>
  );
};

export default ManageShipping; 