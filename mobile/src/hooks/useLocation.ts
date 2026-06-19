import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Coordinates } from '../types';

export const useLocation = () => {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission denied. Using default location.');
        // Default: IIT Bombay coordinates (for demo)
        setLocation({ latitude: 19.1334, longitude: 72.9133 });
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (err) {
      setError('Could not get location. Using default.');
      setLocation({ latitude: 19.1334, longitude: 72.9133 });
    } finally {
      setLoading(false);
    }
  };

  const refreshLocation = async () => {
    await requestLocation();
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return { location, error, loading, refreshLocation };
};