import React, { createContext, useContext, useState, useEffect } from 'react';
import { Coordinates, RadiusOption, DEFAULT_RADIUS, RADIUS_OPTIONS } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocation } from './useLocation';

interface LocationContextType {
  location: Coordinates | null;
  radius: RadiusOption;
  setRadius: (radius: RadiusOption) => void;
  loading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  radiusInMeters: number;
}

const LocationContext = createContext<LocationContextType>({} as LocationContextType);

export const useLocationContext = () => useContext(LocationContext);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { location, error, loading, refreshLocation } = useLocation();
  const [radius, setRadiusState] = useState<RadiusOption>(DEFAULT_RADIUS);

  // Load saved radius from storage
  useEffect(() => {
    AsyncStorage.getItem('selectedRadius').then((value) => {
      if (value) {
        const num = parseInt(value) as RadiusOption;
        if (RADIUS_OPTIONS.includes(num)) {
          setRadiusState(num);
        }
      }
    });
  }, []);

  const setRadius = async (newRadius: RadiusOption) => {
    setRadiusState(newRadius);
    await AsyncStorage.setItem('selectedRadius', newRadius.toString());
  };

  const radiusInMeters = radius * 1000;

  return (
    <LocationContext.Provider
      value={{
        location,
        radius,
        setRadius,
        loading,
        error,
        refreshLocation,
        radiusInMeters,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};