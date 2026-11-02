// File: /pages/Dashboard/Overview/CustomLegend.js
import { Box, Typography } from '@mui/material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function CustomLegend({ items }) {
  return (
    <Box sx={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'flex-start', // QUAN TRỌNG!
      gap: 3,
      mt: 1,
      mb: 1,
      ml: 1,
      minHeight: 28, // Đảm bảo đủ cao khi ít/many legend
    }}>
      {items.map((item, idx) => (
        <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
          <Box sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: COLORS[idx % COLORS.length],
            mr: 1
          }} />
          <Typography variant="body1" sx={{
            color: COLORS[idx % COLORS.length],
            fontWeight: 500,
            fontSize: 16,
          }}>{item.name}</Typography>
        </Box>
      ))}
    </Box>
  );
}
