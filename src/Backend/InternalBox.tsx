import React from 'react';
import { Box } from '@mui/material';

export function InternalBox({ children, sx = {}, ...props }: React.PropsWithChildren<{ sx?: any }>) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 4,
        boxShadow: 6,
        border: '1.5px solid',
        borderColor: 'divider',
        ...sx,
        alignSelf: 'center',
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
