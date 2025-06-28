import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
    name: 'ui',
    initialState: {
        theme: 'light',
        sidebarOpen: true,
        toolbarOpen: true,
        zoom: 1,
        pan: { x: 0, y: 0 },
        showGrid: false,
        showMinimap: true,
        showNodeLabels: true,
        showEdgeLabels: false,
        nodeSize: 'medium',
        edgeStyle: 'solid',
        colorScheme: 'default',
        layout: 'horizontal',
        autoLayout: false,
        snapToGrid: false,
        gridSize: 20,
        minimapPosition: 'bottom-right',
        notifications: [],
        modals: {
            export: false,
            import: false,
            settings: false,
            help: false
        }
    },
    reducers: {
        setTheme: (state, action) => {
            state.theme = action.payload;
        },
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        toggleToolbar: (state) => {
            state.toolbarOpen = !state.toolbarOpen;
        },
        setZoom: (state, action) => {
            state.zoom = Math.max(0.1, Math.min(3, action.payload));
        },
        setPan: (state, action) => {
            state.pan = action.payload;
        },
        resetView: (state) => {
            state.zoom = 1;
            state.pan = { x: 0, y: 0 };
        },
        toggleGrid: (state) => {
            state.showGrid = !state.showGrid;
        },
        toggleMinimap: (state) => {
            state.showMinimap = !state.showMinimap;
        },
        toggleNodeLabels: (state) => {
            state.showNodeLabels = !state.showNodeLabels;
        },
        toggleEdgeLabels: (state) => {
            state.showEdgeLabels = !state.showEdgeLabels;
        },
        setNodeSize: (state, action) => {
            state.nodeSize = action.payload;
        },
        setEdgeStyle: (state, action) => {
            state.edgeStyle = action.payload;
        },
        setColorScheme: (state, action) => {
            state.colorScheme = action.payload;
        },
        setLayout: (state, action) => {
            state.layout = action.payload;
        },
        toggleAutoLayout: (state) => {
            state.autoLayout = !state.autoLayout;
        },
        toggleSnapToGrid: (state) => {
            state.snapToGrid = !state.snapToGrid;
        },
        setGridSize: (state, action) => {
            state.gridSize = action.payload;
        },
        setMinimapPosition: (state, action) => {
            state.minimapPosition = action.payload;
        },
        addNotification: (state, action) => {
            state.notifications.push({
                id: Date.now(),
                type: 'info',
                message: '',
                duration: 5000,
                ...action.payload
            });
        },
        removeNotification: (state, action) => {
            state.notifications = state.notifications.filter(
                notification => notification.id !== action.payload
            );
        },
        clearNotifications: (state) => {
            state.notifications = [];
        },
        openModal: (state, action) => {
            state.modals[action.payload] = true;
        },
        closeModal: (state, action) => {
            state.modals[action.payload] = false;
        },
        closeAllModals: (state) => {
            Object.keys(state.modals).forEach(key => {
                state.modals[key] = false;
            });
        }
    }
});

export const {
    setTheme,
    toggleSidebar,
    toggleToolbar,
    setZoom,
    setPan,
    resetView,
    toggleGrid,
    toggleMinimap,
    toggleNodeLabels,
    toggleEdgeLabels,
    setNodeSize,
    setEdgeStyle,
    setColorScheme,
    setLayout,
    toggleAutoLayout,
    toggleSnapToGrid,
    setGridSize,
    setMinimapPosition,
    addNotification,
    removeNotification,
    clearNotifications,
    openModal,
    closeModal,
    closeAllModals
} = uiSlice.actions;

export default uiSlice.reducer; 