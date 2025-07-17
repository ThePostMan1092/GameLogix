import React, { useState } from 'react';
import {Button, TextField, Typography, MenuItem, Select, InputLabel, FormControl, Box,} from '@mui/material';
import { useAuth } from '../Backend/AuthProvider';
import { InternalBox } from '../Backend/InternalBox';
import { db } from '../Backend/firebase';
import { setDoc, doc, Timestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';