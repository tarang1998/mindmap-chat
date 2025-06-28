import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';
import { MindMap } from '../domain/entities/MindMap.js';

import mindMapReducer from '../store/mindMap/mindMapSlice.js';
import uiReducer from '../store/ui/uiSlice.js';
import errorReducer from '../store/error/errorSlice.js';

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

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        ignoredPaths: ['mindMap.currentMindMap']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
});

export const persistor = persistStore(store);


