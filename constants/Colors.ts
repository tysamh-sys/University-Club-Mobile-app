/**
 * Below are the colors that are used in the app.
 * Adapted from the prototype's shadcn theme.
 */

const primary = '#030213';
const accent = '#e9ebef';
const background = '#ffffff';

export const Colors = {
  light: {
    text: '#030213',
    background: '#ffffff',
    tint: primary,
    icon: '#717182',
    tabIconDefault: '#717182',
    tabIconSelected: primary,
    primary: primary,
    accent: accent,
    card: '#ffffff',
    border: 'rgba(0, 0, 0, 0.1)',
    notification: '#d4183d',
    muted: '#ececf0',
    mutedForeground: '#717182',
    inputBackground: '#f3f3f5',
  },
  dark: {
    text: '#f8f8f8',
    background: '#030213',
    tint: '#f8f8f8',
    icon: '#717182',
    tabIconDefault: '#717182',
    tabIconSelected: '#f8f8f8',
    primary: '#f8f8f8',
    accent: '#269000', // Adjusted from oklch
    card: '#030213',
    border: 'rgba(255, 255, 255, 0.1)',
    notification: '#d4183d',
    muted: '#269000',
    mutedForeground: '#717182',
    inputBackground: '#1a1a2e',
  },
};
