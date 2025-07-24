'use client';
import { createContext, useContext } from 'react';
import type { Map as OLMap } from 'ol';

export const MapContext = createContext<OLMap | null>(null);
export const useMap = () => {
    const context = useContext(MapContext);
    if (!context) {
        throw new Error('useMap must be used within a MapContext.Provider');
    }
    return context;
};
