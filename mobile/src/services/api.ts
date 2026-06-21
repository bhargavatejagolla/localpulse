import { Platform } from 'react-native';

/**
 * Helper to determine the backend URL based on the environment.
 * Android Emulators map localhost to 10.0.2.2.
 * Physical devices or iOS simulators might need your actual local IP or 127.0.0.1.
 */
const getBackendUrl = () => {
  // If running on an Android Emulator, use the magic IP:
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  // For iOS Simulator, localhost works
  return 'http://127.0.0.1:8000';
};

/**
 * Triggers the Python AI Notification Engine to dispatch emails for a new issue.
 */
export const triggerNotification = async (issueId: string) => {
  try {
    const baseUrl = getBackendUrl();
    console.log(`Triggering notification engine for issue ${issueId} at ${baseUrl}/notify...`);
    
    const response = await fetch(`${baseUrl}/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ issue_id: issueId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('Backend notification failed:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log('Notification Engine Success:', data);
    return true;
  } catch (error) {
    console.error('Failed to connect to Python Backend Notification Engine:', error);
    return false;
  }
};
