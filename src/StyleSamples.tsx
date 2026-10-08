import {View} from 'react-native'
import {StyleSheet} from 'react-native-unistyles'
import {BodyBold, Link} from './LinkText'
import {type SharedTextProps} from './SharedText'

type Props = Pick<SharedTextProps, 'color' | 'alignCenter'>

// every line below must stay in the weight stated in its own label after navigating back
export const StyleSamples = ({color, alignCenter}: Props) => (
  <View style={styles.container}>
    <Link.Bold alignCenter={alignCenter} color={color} testID="link-bold">
      Link.Bold - expected BOLD (4 levels)
    </Link.Bold>
    <Link.Regular
      alignCenter={alignCenter}
      color={color}
      testID="link-regular">
      Link.Regular - expected REGULAR
    </Link.Regular>
    <BodyBold alignCenter={alignCenter} color={color} testID="body-bold">
      BodyBold - expected BOLD (3 levels, control)
    </BodyBold>
  </View>
)

const styles = StyleSheet.create({
  container: {gap: 8}
})
