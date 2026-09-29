import {Button, Text, View} from 'react-native'
import {StackActions} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {StyleSheet} from 'react-native-unistyles'
import {SharedText} from './SharedText'
import {type RootStackParamList} from './types'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

export const HomeScreen = ({navigation}: Props) => (
  <View style={styles.container}>
    <SharedText color="green" testID="home-text">
      Home
    </SharedText>
    <Text style={styles.caption}>
      expected: always GREEN + LEFT-aligned (same as Step1/Step2). White + centered means
      contamination from Step3 - check Step1 and Step2 too as you step back through them.
    </Text>
    <Button
      title="Push Step1"
      onPress={() => navigation.dispatch(StackActions.push('Step1'))}
    />
  </View>
)

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 24
  },
  caption: {
    marginTop: 12,
    fontSize: 13,
    color: theme.colors.mutedText
  }
}))
