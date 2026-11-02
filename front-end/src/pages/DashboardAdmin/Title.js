import * as React from 'react';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';

function Title({ children, align = 'left', highlight = false, ...props }) {
  return (
    <Box sx={{ position: 'relative', mb: 2 }}>
      <Typography 
        component="h2" 
        variant="h5" 
        color="primary" 
        fontWeight={600}
        textAlign={align}
        sx={{
          position: 'relative',
          zIndex: 1,
          display: 'inline-block',
          pb: 1,
          ...(highlight && {
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 0,
              bottom: 0,
              height: '3px',
              width: '40px',
              backgroundColor: 'secondary.main',
              borderRadius: '2px'
            }
          }),
          ...props.sx
        }}
        {...props}
      >
        {children}
      </Typography>
    </Box>
  );
}

Title.propTypes = {
  children: PropTypes.node,
  align: PropTypes.oneOf(['left', 'center', 'right']),
  highlight: PropTypes.bool,
};

export default Title;
