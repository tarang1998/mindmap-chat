import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import { MindMap } from '../domain/entities/MindMap.js';

import mindMapReducer from '../store/mindMap/mindMapSlice.js';
import uiReducer from '../store/ui/uiSlice.js';
import errorReducer from '../store/error/errorSlice.js';
import { createLogger } from 'redux-logger';


// Custom transformer to handle MindMap instances
const mindMapTransform = createTransform(
  // Transform state on its way to being serialized and persisted
  (inboundState) => {
    // Convert MindMap instances to JSON for storage
    if (inboundState.currentMindMap && typeof inboundState.currentMindMap.toJSON === 'function') {
      return {
        ...inboundState,
        currentMindMap: inboundState.currentMindMap.toJSON()
      };
    }
    return inboundState;
  },
  // Transform state being rehydrated
  (outboundState) => {
    // Convert JSON back to MindMap instances
    if (outboundState.currentMindMap && typeof outboundState.currentMindMap === 'object' && outboundState.currentMindMap.id) {
      return {
        ...outboundState,
        currentMindMap: MindMap.fromJSON(outboundState.currentMindMap)
      };
    }
    return outboundState;
  },
  { whitelist: ['mindMap'] }
);

const persistConfig = {
  key: 'mindmap-root',
  storage,
  whitelist: ['mindMap', 'ui'], // Only persist these reducers
  blacklist: ['error'], // Don't persist errors
  transforms: [mindMapTransform]
};

const rootReducer = combineReducers({
  mindMap: mindMapReducer,
  ui: uiReducer,
  error: errorReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const logger = createLogger({
  collapsed: true,    // start each action log collapsed
  diff: true,         // show diff of state
  // customize colors if you like:
  colors: {
    title: () => 'yellow',        // action / state title
    prevState: () => 'blue',
    action: () => 'green',
    nextState: () => 'magenta',
  },
});

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => {
    const base = getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['mindMap.currentMindMap']
      }
    });

    // add logger in dev only
    if (process.env.NODE_ENV !== 'production') {
      return base.concat(logger);
    }
    return base;
  },
  devTools: process.env.NODE_ENV !== 'production'
});


export const persistor = persistStore(store);


