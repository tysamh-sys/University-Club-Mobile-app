// import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import api from './api';

/**
 * 🛡️ NOTIFICATION SERVICE (DORMANT MODE)
 * Note: Remote notifications are NOT supported in Expo Go (SDK 54).
 * This service is currently deactivated to prevent crashes.
 * To activate, use a Development Build and uncomment the libraries below.
 */

// let Notifications: any;
// try {
//   Notifications = require('expo-notifications');
// } catch (e) {}

export async function registerForPushNotificationsAsync() {
  console.log('Push Notifications: Dormant mode active (Expo Go compatibility)');
  return null;
}

export async function saveTokenToBackend(token: string) {
    return;
}
