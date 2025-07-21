import React, { useState, useEffect } from 'react';
// import useAuth from its correct location
import { useAuth } from '../../Backend/AuthProvider';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
// Adjust the path below if your firebase file is in a different location
import { db } from '../../Backend/firebase';
import { useParams } from 'react-router-dom';
import { Box, Paper, Typography, Divider, Grid, TextField, Alert, Button, Table, TableContainer, 
  TableRow, TableCell, TableHead, TableBody, Menu, MenuItem, IconButton, Chip} from '@mui/material';
import { getUserConversations, addUserToLeagueConversations,  updateJoinRequestStatus, sendMessage } from '../../messaging';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const CustomizationTab: React.FC = () => {
  return (
    <Paper elevation={3} style={{ padding: '16px', margin: '16px 0' }}>
      <Box>
        <Typography variant="h2">League Customization</Typography>
        <Typography variant="body2">Make the league your own!</Typography>
      </Box>

      <Divider style={{ margin: '16px 0' }} />

      <Grid container sx={{spacing: 2, px: 4}} >
        <Grid size={3}>
          <Typography variant="h4">Sport Selection</Typography>
        </Grid>
        <Grid size={9}>
          <Box justifyContent={'space-between'} display="flex" flexDirection="column" height="100%">
          </Box>
        </Grid>
      </Grid>

      <Divider style={{ margin: '16px 0' }} />
    </Paper>
  );
};

export default CustomizationTab;
