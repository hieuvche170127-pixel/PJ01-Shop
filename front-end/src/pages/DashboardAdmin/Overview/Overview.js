import { formatVND } from '../../../utils/currency';
import { API_URL } from '../../../utils/apiUrl';
import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Link as MuiLink,
  IconButton,
  Chip,
  Stack,
  LinearProgress,
  Avatar,
  useTheme,
  Tooltip,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart, 
  Line,
  Radar,
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  RadialBarChart, 
  RadialBar
} from "recharts";
import { Link } from "react-router-dom";
import axios from "axios";
import CustomLegend from "./CustomLegend";
import { useOutletContext } from "react-router-dom";
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import StoreIcon from '@mui/icons-material/Store';
import TimelineIcon from '@mui/icons-material/Timeline';
import Title from "../Title";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Custom colors for charts
const COLORS = [
  "#1a237e", // primary main
  "#ff6f00", // secondary main
  "#0288d1", // blue
  "#43a047", // green
  "#7b1fa2", // purple
  "#c62828", // red
  "#f9a825", // amber
  "#00897b", // teal
  "#5d4037", // brown
  "#455a64", // blueGrey
];

const TIME_OPTIONS = [
  { value: "", label: "All Time" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "year", label: "Last 12 Months" },
];

// Component for stats card
const StatCard = ({ title, value, icon, color = "primary.main", percentChange = null }) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 24px 0 rgba(0,0,0,0.12)'
        }
      }}
    >
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 0, 
          right: 0, 
          width: '30%', 
          height: '100%', 
          bgcolor: `${color}15`, 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {icon}
      </Box>
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" color="primary" fontWeight="bold" mb={1}>
          {value}
        </Typography>
        {percentChange !== null && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {percentChange >= 0 ? (
              <TrendingUpIcon fontSize="small" color="success" />
            ) : (
              <TrendingDownIcon fontSize="small" color="error" />
            )}
            <Typography 
              variant="body2" 
              color={percentChange >= 0 ? "success.main" : "error.main"}
              ml={0.5}
            >
              {Math.abs(percentChange)}% {percentChange >= 0 ? "increase" : "decrease"}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const Overview = () => {
  const { handleSetDashboardTitle } = useOutletContext();
  const theme = useTheme();
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    handleSetDashboardTitle("Dashboard Overview");
  }, [handleSetDashboardTitle]);

  const fetchData = async (selectedPeriod = "") => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_URL}/admin/report${
          selectedPeriod ? `?period=${selectedPeriod}` : ""
        }`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
          },
        }
      );
      if (!res.data.success) {
        throw new Error("API response unsuccessful");
      }
      // Calculate percentages for revenueByCategory
      const revenueByCategory = res.data.insights.revenueByCategory || [];
      const totalRevenue = revenueByCategory.reduce(
        (sum, item) => sum + (item.value || 0),
        0
      );
      const revenueByCategoryWithPercent = revenueByCategory.map((item) => ({
        ...item,
        value:
          totalRevenue > 0
            ? Number(((item.value / totalRevenue) * 100).toFixed(1))
            : 0,
      }));
      // Prepare orderStatus for PieChart
      const orderStatus = res.data.summary.orderStatus || {};
      const orderStatusData = Object.entries(orderStatus)
        .map(([name, value]) => ({
          name,
          value,
        }))
        .filter((item) => item.value > 0);
      setReport({
        ...res.data,
        insights: {
          ...res.data.insights,
          revenueByCategory: revenueByCategoryWithPercent,
        },
        summary: {
          ...res.data.summary,
          orderStatus: orderStatusData,
        },
      });
    } catch (error) {
      console.error("Error fetching report:", error.message);
      setError("Failed to load data. Please try again.");
      setReport(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  // Định dạng số để hiển thị dấu phân cách hàng nghìn
  const formatNumber = (num) => {
    return num?.toLocaleString() || "0";
  };

  return (
    <Box>
      {report && <Typography sx={{ mb: 2 }} color="text.secondary">Doanh thu là tiền đã thu sau giảm giá, theo ngày đặt đơn. Còn phải thu: {formatVND(report.summary?.totalOutstanding)}. {report.summary?.legacyIssueCount > 0 && `Có ${report.summary.legacyIssueCount} dữ liệu lịch sử cần kiểm tra.`}</Typography>}
      {/* Title và các bộ lọc */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Title highlight={true}>Dashboard Analytics</Title>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <FormControl size="small" variant="outlined">
            <InputLabel id="period-label">Time Period</InputLabel>
            <Select
              labelId="period-label"
              value={period}
              label="Time Period"
              onChange={(e) => setPeriod(e.target.value)}
              sx={{ minWidth: 150 }}
              startAdornment={<FilterAltIcon sx={{ mr: 1, color: 'text.secondary' }} fontSize="small" />}
            >
              {TIME_OPTIONS.map((opt) => (
                <MenuItem value={opt.value} key={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Refresh data">
            <IconButton
              color="primary"
              onClick={() => fetchData(period)}
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ width: '100%', mt: 2, mb: 4 }}>
          <LinearProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : !report ? (
        <Typography color="error">No data available</Typography>
      ) : (
        <Grid container spacing={3}>
          {/* Summary Cards - first row */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Đã thu sau giảm giá (Shipped)" 
              value={formatVND(report.summary.totalRevenue)} 
              icon={<AttachMoneyIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Total Orders" 
              value={formatNumber(report.summary.totalOrders)} 
              icon={<ShoppingCartIcon sx={{ fontSize: 40, color: 'secondary.main' }} />} 
              color="secondary.main"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Total Users" 
              value={formatNumber(report.summary.totalUsers)} 
              icon={<PeopleIcon sx={{ fontSize: 40, color: '#0288d1' }} />} 
              color="#0288d1"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Unique Customers" 
              value={formatNumber(report.summary.uniqueCustomers)} 
              icon={<PersonIcon sx={{ fontSize: 40, color: '#43a047' }} />} 
              color="#43a047"
            />
          </Grid>
          
          {/* Summary Cards - second row */}
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Products Shipped" 
              value={formatNumber(report.summary.productsShipped)} 
              icon={<LocalShippingIcon sx={{ fontSize: 40, color: '#7b1fa2' }} />} 
              color="#7b1fa2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Active Buyers" 
              value={formatNumber(report.summary.activeBuyers)} 
              icon={<PersonOutlineIcon sx={{ fontSize: 40, color: '#c62828' }} />} 
              color="#c62828"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Active Sellers" 
              value={formatNumber(report.summary.activeSellers)} 
              icon={<StoreIcon sx={{ fontSize: 40, color: '#f9a825' }} />} 
              color="#f9a825"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Conversion Rate" 
              value={`${report.summary.conversionRate || 0}%`} 
              icon={<TimelineIcon sx={{ fontSize: 40, color: '#00897b' }} />} 
              color="#00897b"
            />
          </Grid>

          {/* Order Status Breakdown */}
          {report.summary.orderStatus?.length > 0 && (
            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: 420 }}>
                <CardContent
                  sx={{
                    height: '100%',
                    display: "flex",
                    flexDirection: "column",
                    p: 3,
                    "&:last-child": { pb: 3 },
                  }}
                >
                  <Title highlight={false}>Order Status Breakdown</Title>
                  <Box sx={{ flexGrow: 1, minHeight: 250, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={report.summary.orderStatus}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40} // Donut chart
                          label={({ name, value }) => `${value}`}
                          labelLine={false}
                        >
                          {report.summary.orderStatus.map((entry, index) => (
                            <Cell
                              key={`status-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value, name) => [`${value}`, `${name}`]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <CustomLegend items={report.summary.orderStatus} colors={COLORS} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Revenue by Category */}
          {report.insights.revenueByCategory?.length > 0 && (
            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ height: 420 }}>
                <CardContent
                  sx={{
                    height: '100%',
                    display: "flex",
                    flexDirection: "column",
                    p: 3,
                    "&:last-child": { pb: 3 },
                  }}
                >
                  <Title highlight={false}>Revenue by Category (%)</Title>
                  <Box sx={{ flexGrow: 1, minHeight: 250, mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report.insights.revenueByCategory}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="name" 
                          tick={{fontSize: 12}}
                          interval={0} 
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis />
                        <RechartsTooltip formatter={(value) => [`${value}%`, 'Revenue']} />
                        <Bar 
                          dataKey="value" 
                          fill={theme.palette.primary.main}
                          radius={[4, 4, 0, 0]} // rounded corners
                        >
                          {report.insights.revenueByCategory.map((entry, index) => (
                            <Cell 
                              key={`cat-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
          
          {/* User Activity / Recent Orders */}
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ height: 420 }}>
              <CardContent sx={{ p: 3, height: '100%' }}>
                <Title highlight={false}>Recent Users</Title>
                <Box sx={{ mt: 2, maxHeight: '330px', overflow: 'auto' }}>
                  {report.insights.recentUsers ? (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>User</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {report.insights.recentUsers.map((user, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Avatar 
                                  src={user.avatar}
                                  alt={user.name} 
                                  sx={{ width: 30, height: 30 }} 
                                />
                                <Typography variant="body2">{user.name}</Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              {user.type === 'seller' ? (
                                <Chip 
                                  size="small" 
                                  label="Seller" 
                                  color="secondary"
                                  sx={{ fontWeight: 500, fontSize: '0.7rem' }}
                                />
                              ) : (
                                <Chip 
                                  size="small" 
                                  label="Buyer" 
                                  color="primary"
                                  sx={{ fontWeight: 500, fontSize: '0.7rem' }}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                size="small" 
                                label={user.status}
                                variant="outlined"
                                color={user.status === 'active' ? 'success' : 'default'}
                                sx={{ fontWeight: 500, fontSize: '0.7rem' }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No recent users available.
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Các biểu đồ khác nếu có */}
          {/* ... */}
        </Grid>
      )}
    </Box>
  );
};

export default Overview;
