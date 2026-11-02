import { formatVND } from '../../../utils/currency';
import React, { useEffect, useState } from 'react';
import {
    Grid, Card, CardContent, Typography, Box, Divider,
    Select, MenuItem, FormControl, InputLabel, Button,
    CircularProgress, useTheme, Avatar, Skeleton
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import SellerService from '../../../services/api/SellerService';
import CustomLegend from './CustomLegend';
import { useOutletContext } from 'react-router-dom';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { alpha } from '@mui/material/styles';
import { api } from '../../../services/index';
import { toast } from 'react-toastify';

const TIME_OPTIONS = [
    { value: '', label: 'All Time' },
    { value: 'week', label: 'Last 7 Days' },
    { value: 'month', label: 'Last 30 Days' },
    { value: 'year', label: 'Last 12 Months' }
];

const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", 
  "#A28FD0", "#FF6492", "#36CFC9", "#FFD700", 
  "#8B5CF6", "#EC4899"
];

// Custom tooltip for the charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box
        sx={{
          bgcolor: 'background.paper',
          p: 2,
          borderRadius: 1,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #f0f0f0',
        }}
      >
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        <Typography variant="body2" color="primary">
          Revenue: {formatVND(payload[0].value)}
        </Typography>
      </Box>
    );
  }
  return null;
};

const Overview = () => {
    const theme = useTheme();
    const { handleSetDashboardTitle } = useOutletContext();
    const [report, setReport] = useState(null);
    const [period, setPeriod] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [appliedFilter, setAppliedFilter] = useState({});
    // Thêm state cho filter ngày
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        handleSetDashboardTitle("Dashboard");
    }, [handleSetDashboardTitle]);

    // Hàm fetchData nhận thêm from/to
    const fetchData = async (selectedPeriod = '', from = '', to = '') => {
        setLoading(true);
        try {
            let query = `seller/report`;
            const params = [];
            if (selectedPeriod) params.push(`period=${selectedPeriod}`);
            if (from) params.push(`from=${from}`);
            if (to) params.push(`to=${to}`);
            if (params.length > 0) query += `?${params.join('&')}`;
            const res = await api.get(query);
            setReport(res.data.data);
            setAppliedFilter({ period: selectedPeriod, ...(from ? { from } : {}), ...(to ? { to } : {}) });
        } catch (error) {
            console.error('Error fetching report:', error);
            setReport(null);
        } finally {
            setLoading(false);
        }
    };

    // Khi period thay đổi, reset ngày và fetch lại
    useEffect(() => {
        fetchData(period, '', '');
        setStartDate('');
        setEndDate('');
    }, [period]);

    const downloadReport = async () => {
      setDownloading(true);
      try {
        const response = await api.get('seller/report/download.csv', { responseType: 'blob', params: appliedFilter });
        const url = URL.createObjectURL(response.data), link = document.createElement('a');
        link.href = url; link.download = 'shopii-sales-report.csv'; document.body.appendChild(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch { toast.error('Không tải được báo cáo'); }
      finally { setDownloading(false); }
    };

    // Format date for better display
    const formatChartData = (data) => {
        if (!data || !Array.isArray(data)) return [];
        
        return data.map(item => ({
            ...item,
            date: new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            }),
            revenue: Number(item.revenue)
        }));
    };

    return (
        <Box>
            {/* Time & Date Filter */}
            <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 3, 
                gap: 2,
                flexWrap: 'wrap',
                justifyContent: 'space-between'
            }}>
                <Typography variant="h5" fontWeight={600} color="text.primary">
                    Sales Overview
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel id="period-label">Time Period</InputLabel>
                        <Select
                            labelId="period-label"
                            value={period}
                            label="Time Period"
                            onChange={e => setPeriod(e.target.value)}
                        >
                            {TIME_OPTIONS.map(opt => (
                                <MenuItem value={opt.value} key={opt.value}>{opt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {/* Date to Date filter */}
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            style={{ height: 40, borderRadius: 4, border: '1px solid #ccc', padding: '0 8px' }}
                        />
                        <Typography variant="body2">to</Typography>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            style={{ height: 40, borderRadius: 4, border: '1px solid #ccc', padding: '0 8px' }}
                        />
                        <Button 
                            variant="contained" 
                            size="small" 
                            sx={{ height: 40, ml: 1 }}
                            onClick={() => {
                                setPeriod('');
                                fetchData('', startDate, endDate);
                            }}
                            disabled={!startDate || !endDate}
                        >
                            Lọc
                        </Button>
                    </Box>
                    <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => {
                            setPeriod('');
                            setStartDate('');
                            setEndDate('');
                            fetchData('', '', '');
                        }}
                        sx={{ height: 40 }}
                    >
                        Reset
                    </Button>
                </Box>
            </Box>

            {loading ? (
                <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : !report ? (
                <Box sx={{ 
                    py: 6, 
                    display: 'flex', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    backgroundColor: alpha(theme.palette.error.light, 0.1),
                    borderRadius: 2
                }}>
                    <Typography variant="h6" color="error" gutterBottom>
                        No data available
                    </Typography>
                    <Typography color="text.secondary">
                        Try selecting a different time period or check back later
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    <Grid item xs={12}><Typography color="text.secondary">Thống kê theo ngày đặt đơn (giờ Việt Nam). Đã giao sau giảm giá: {formatVND(report.totalDeliveredPayable)} · Còn phải thu: {formatVND(report.totalOutstanding)}.</Typography>{report.legacyIssueCount > 0 && <Typography color="error">Có {report.legacyIssueCount} dữ liệu lịch sử cần kiểm tra, chưa tính vào doanh thu.</Typography>}</Grid>
                    <Grid item xs={12}><Button variant="outlined" onClick={downloadReport} disabled={downloading}>{downloading ? 'Đang tải…' : 'Tải báo cáo CSV'}</Button></Grid>
                    {/* Summary Cards */}
                    <Grid item xs={12} md={4}>
                        <Card sx={{ 
                            height: '100%', 
                            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.15)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`
                        }}>
                            <CardContent sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between'
                            }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        Đã thu sau giảm giá
                                    </Typography>
                                    <Typography variant="h4" color="primary.main" fontWeight={700} sx={{ my: 1 }}>
                                        {formatVND(report.totalRevenue)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        For {TIME_OPTIONS.find(opt => opt.value === period)?.label || 'All Time'}
                                    </Typography>
                                </Box>
                                <Avatar sx={{ 
                                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                                    color: theme.palette.primary.main,
                                    width: 56, 
                                    height: 56,
                                    boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                                }}>
                                    <MonetizationOnIcon fontSize="large" />
                                </Avatar>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ 
                            height: '100%',
                            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.light, 0.15)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.1)}`
                        }}>
                            <CardContent sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between'
                            }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        Unique Customers
                                    </Typography>
                                    <Typography variant="h4" color="secondary.main" fontWeight={700} sx={{ my: 1 }}>
                                        {report.uniqueCustomers || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Who made purchases
                                    </Typography>
                                </Box>
                                <Avatar sx={{ 
                                    bgcolor: alpha(theme.palette.secondary.main, 0.15),
                                    color: theme.palette.secondary.main,
                                    width: 56, 
                                    height: 56,
                                    boxShadow: `0 4px 8px ${alpha(theme.palette.secondary.main, 0.2)}`
                                }}>
                                    <PeopleAltIcon fontSize="large" />
                                </Avatar>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ 
                            height: '100%',
                            background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.success.light, 0.15)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.1)}`
                        }}>
                            <CardContent sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between'
                            }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                        Products Shipped
                                    </Typography>
                                    <Typography variant="h4" color="success.main" fontWeight={700} sx={{ my: 1 }}>
                                        {report.productsShipped || 0}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Số đơn vị sản phẩm đã giao
                                    </Typography>
                                </Box>
                                <Avatar sx={{ 
                                    bgcolor: alpha(theme.palette.success.main, 0.15),
                                    color: theme.palette.success.main,
                                    width: 56, 
                                    height: 56,
                                    boxShadow: `0 4px 8px ${alpha(theme.palette.success.main, 0.2)}`
                                }}>
                                    <Inventory2Icon fontSize="large" />
                                </Avatar>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Revenue Over Time */}
                    <Grid item xs={12}>
                        <Card sx={{ 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            overflow: 'hidden'
                        }}>
                            <CardContent>
                                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                                    Revenue Over Time
                                </Typography>
                                <Box sx={{ height: 300 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={formatChartData(report.revenueOverTime)}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.secondary, 0.1)} />
                                            <XAxis 
                                                dataKey="date" 
                                                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                                            />
                                            <YAxis 
                                                tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                                                width={100} tickFormatter={(value) => formatVND(value)}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar 
                                                dataKey="revenue" 
                                                name="Revenue" 
                                                fill={theme.palette.primary.main} 
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Revenue by Category */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ 
                            height: 420, 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`
                        }}>
                            <CardContent
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    p: 3,
                                    '&:last-child': { pb: 3 },
                                }}
                            >
                                <Typography variant="h6" fontWeight={600}>
                                    Revenue by Category
                                </Typography>
                                <Box sx={{ flexGrow: 1, height: 280, display: 'flex', alignItems: 'center' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={report.revenueByCategory}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={90}
                                                innerRadius={55}
                                                labelLine={false}
                                                paddingAngle={3}
                                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                            >
                                                {report.revenueByCategory?.map((entry, index) => (
                                                    <Cell 
                                                        key={`cat-${index}`} 
                                                        fill={COLORS[index % COLORS.length]} 
                                                        stroke="none"
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Box sx={{ mt: 1 }}>
                                    <CustomLegend items={report.revenueByCategory} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Top Destinations */}
                    <Grid item xs={12} md={6}>
                        <Card sx={{ 
                            height: 420, 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`
                        }}>
                            <CardContent
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    p: 3,
                                    '&:last-child': { pb: 3 },
                                }}
                            >
                                <Typography variant="h6" fontWeight={600}>
                                    Top Shipping Destinations
                                </Typography>
                                <Box sx={{ flexGrow: 1, height: 280, display: 'flex', alignItems: 'center' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={report.topDestinations}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={90}
                                                innerRadius={55}
                                                labelLine={false}
                                                paddingAngle={3}
                                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                            >
                                                {report.topDestinations?.map((entry, index) => (
                                                    <Cell 
                                                        key={`dest-${index}`} 
                                                        fill={COLORS[index % COLORS.length]} 
                                                        stroke="none" 
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Box sx={{ mt: 1 }}>
                                    <CustomLegend items={report.topDestinations} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Top Products */}
                    <Grid item xs={12}>
                        <Card sx={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Top Selling Products
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container sx={{ 
                                    py: 1,
                                    px: 2, 
                                    bgcolor: alpha(theme.palette.primary.main, 0.05), 
                                    borderRadius: 1 
                                }}>
                                    <Grid item xs={6}>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Product
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Quantity Sold
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Revenue
                                        </Typography>
                                    </Grid>
                                </Grid>
                                {report.topProducts?.map((p, index) => (
                                    <Grid 
                                        container 
                                        key={index} 
                                        sx={{ 
                                            py: 2,
                                            px: 2,
                                            borderBottom: index !== report.topProducts.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none',
                                            '&:hover': {
                                                bgcolor: alpha(theme.palette.background.default, 0.5)
                                            }
                                        }}
                                    >
                                        <Grid item xs={6}>
                                            <Typography variant="body2" fontWeight={500}>
                                                {p.product}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="body2">
                                                {p.quantity}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={3}>
                                            <Typography variant="body2" fontWeight={500} color="primary.main">
                                                {formatVND(p.revenue)}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default Overview;
