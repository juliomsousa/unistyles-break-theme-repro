import {Text, type TextProps} from 'react-native'
import {StyleSheet} from 'react-native-unistyles'
import {type AppTheme} from './theme'

type SharedFontWeight = 'regular' | 'bold'

export interface SharedTextProps extends TextProps {
  color: keyof AppTheme['colors']
  alignCenter?: boolean
  fontWeight?: SharedFontWeight
}

// one dynamic style function shared by every screen - the cross-contamination bug (if present)
// makes one caller's color/alignCenter leak into another caller's rendered text
export const SharedText = ({
  color,
  alignCenter = false,
  fontWeight = 'regular',
  style,
  ...props
}: SharedTextProps) => (
  <Text
    {...props}
    style={[styles.styledText({color, alignCenter, fontWeight}), style]}
  />
)

const styles = StyleSheet.create(theme => ({
  styledText: ({
    color,
    alignCenter,
    fontWeight
  }: {
    color: keyof AppTheme['colors']
    alignCenter: boolean
    fontWeight: SharedFontWeight
  }) => ({
    color: theme.colors[color],
    textAlign: alignCenter ? 'center' : undefined,
    fontSize: 32,
    fontWeight: fontWeight === 'bold' ? '700' : '400'
  })
}))
