import {StyleSheet} from 'react-native-unistyles';

const theme = {
  colors: {
    green: '#02594C',
    white: '#FFFFFF',
  },
};

type AppThemes = {
  app: typeof theme;
};

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
}

StyleSheet.configure({
  themes: {app: theme},
  settings: {initialTheme: 'app'},
});
