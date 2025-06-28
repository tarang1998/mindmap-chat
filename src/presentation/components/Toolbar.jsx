import React from 'react';
import { useAppDispatch } from '../../hooks/useAppSelector.js';
import { toggleSidebar, toggleToolbar } from '../../store/ui/uiSlice.js';
import './Toolbar.css';

const Toolbar = ({
    onNew,
    onSave,
    onAddNode,
    onDeleteNode,
    onResetView,
    onExport,
    onImport,
    hasSelection,
    hasMindMap
}) => {
    const dispatch = useAppDispatch();

    return (
        <div className="toolbar">
            <div className="toolbar-left">
                <button onClick={onNew} className="toolbar-btn primary">
                    New
                </button>
                <button onClick={onSave} className="toolbar-btn" disabled={!hasMindMap}>
                    Save
                </button>
                <button onClick={onImport} className="toolbar-btn">
                    Import
                </button>
                <button onClick={onExport} className="toolbar-btn" disabled={!hasMindMap}>
                    Export
                </button>
            </div>

            <div className="toolbar-center">
                <button onClick={onAddNode} className="toolbar-btn" disabled={!hasMindMap}>
                    Add Node
                </button>
                <button onClick={onDeleteNode} className="toolbar-btn danger" disabled={!hasSelection}>
                    Delete Node
                </button>
                <button onClick={onResetView} className="toolbar-btn">
                    Reset View
                </button>
            </div>

            <div className="toolbar-right">
                <button
                    onClick={() => dispatch(toggleSidebar())}
                    className="toolbar-btn"
                    title="Toggle Sidebar"
                >
                    ☰
                </button>
                <button
                    onClick={() => dispatch(toggleToolbar())}
                    className="toolbar-btn"
                    title="Toggle Toolbar"
                >
                    ⚙️
                </button>
            </div>
        </div>
    );
};

export default Toolbar; 