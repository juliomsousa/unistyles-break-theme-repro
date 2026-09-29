import {Text, type TextProps} from 'react-native'
import {StyleSheet} from 'react-native-unistyles'
import {type AppTheme} from './theme'

interface SharedTextProps extends TextProps {
  color: keyof AppTheme['colors']
  alignCenter?: boolean
}

// one dynamic style function shared by every screen - the cross-contamination bug (if present)
// makes one caller's color/alignCenter leak into another caller's rendered text
export const SharedText = ({
  color,
  alignCenter = false,
  style,
  ...props
}: SharedTextProps) => (
  <Text {...props} style={[styles.styledText({color, alignCenter}), style]} />
)

const styles = StyleSheet.create(theme => ({
  styledText: ({
    color,
    alignCenter
  }: {
    color: keyof AppTheme['colors']
    alignCenter: boolean
  }) => ({
    color: theme.colors[color],
    textAlign: alignCenter ? 'center' : undefined,
    fontSize: 32,
    fontWeight: '700'
  })
}))
