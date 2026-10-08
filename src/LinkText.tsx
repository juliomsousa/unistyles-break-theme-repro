import {StyleSheet} from 'react-native-unistyles'
import {SharedText, type SharedTextProps} from './SharedText'

// weight comes only from the static `bold` style, never from the shared dynamic function
type StaticWeightProps = Omit<SharedTextProps, 'fontWeight'>

// with SharedText's own style the nesting is 4 levels: [shared, [link, [regular, [bold, style]]]]
const LinkBold = ({style, ...props}: StaticWeightProps) => (
  <SharedText
    {...props}
    style={[styles.link(true), [styles.regular, [styles.bold, style]]]}
  />
)

const LinkRegular = ({style, ...props}: StaticWeightProps) => (
  <SharedText {...props} style={[styles.link(true), [styles.regular, style]]} />
)

export const Link = {Bold: LinkBold, Regular: LinkRegular}

// control: 3 levels, [shared, [regular, [bold, style]]]
export const BodyBold = ({style, ...props}: StaticWeightProps) => (
  <SharedText {...props} style={[styles.regular, [styles.bold, style]]} />
)

const styles = StyleSheet.create({
  link: (underline: boolean) => ({
    textDecorationLine: underline ? 'underline' : 'none'
  }),
  regular: {fontSize: 18},
  bold: {fontWeight: '700'}
})
