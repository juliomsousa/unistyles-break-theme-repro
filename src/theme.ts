import {StyleSheet} from 'react-native-unistyles'

export const theme = {
  colors: {
    green: '#02594C',
    white: '#FFFFFF',
    dark: '#111111',
    mutedText: '#666666'
  }
} as const

export type AppTheme = typeof theme

declare module 'react-native-unistyles' {
  export interface UnistylesThemes {
    app: AppTheme
  }
}

StyleSheet.configure({
  themes: {app: theme},
  settings: {initialTheme: 'app'}
})
