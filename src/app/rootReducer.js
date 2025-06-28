// src/app/rootReducer.js

import { combineReducers } from '@reduxjs/toolkit';
import nodesReducer from '../features/nodes/nodeSlice';
import edgesReducer from '../features/edges/edgeSlice';

const rootReducer = combineReducers({
    nodes: nodesReducer,
    edges: edgesReducer,
    // Add more slices here as needed
});

export default rootReducer;
