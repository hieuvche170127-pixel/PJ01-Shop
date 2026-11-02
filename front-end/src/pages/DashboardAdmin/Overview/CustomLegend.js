// File: /pages/Dashboard/Overview/CustomLegend.js
import { Box, Typography, Chip } from '@mui/material';

// Default colors nếu không được truyền vào
const DEFAULT_COLORS = [
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

export default function CustomLegend({ items, colors = DEFAULT_COLORS, showValues = true }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Box sx={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center', 
      justifyContent: 'center',
      gap: 1,
      mt: 1,
      mb: 1,
      minHeight: 30,
    }}>
      {items.map((item, idx) => {
        const color = colors[idx % colors.length];
        return (
          <Chip
            key={item.name}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', px: 0.5 }}>
                <Typography variant="body2" fontWeight="medium">
                  {item.name}
                  {showValues && `: ${item.value}`}
                </Typography>
              </Box>
            }
            sx={{
              backgroundColor: `${color}15`, // Light version of the color
              color: color,
              borderColor: color,
              fontWeight: 500,
              m: 0.5,
              '& .MuiChip-label': { px: 1 },
              '&::before': {
                content: '""',
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: color,
                marginRight: 1
              }
            }}
            variant="outlined"
            size="small"
          />
        );
      })}
    </Box>
  );
}
