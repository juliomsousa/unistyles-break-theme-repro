import {Button, View} from 'react-native'
import {StackActions} from '@react-navigation/native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {StyleSheet} from 'react-native-unistyles'
import {SharedText} from './SharedText'
import {type RootStackParamList} from './types'

type Props = NativeStackScreenProps<RootStackParamList, 'Step1' | 'Step2'> & {
  nextRoute: keyof RootStackParamList
  stepLabel: string
  testID: string
}

// generic "push another screen" screen, reused for Step1 and Step2 - same green/left style as
// Home, so any other color/alignment showing up here or on Home means contamination from Step3
export const StepScreen = ({
  navigation,
  nextRoute,
  stepLabel,
  testID
}: Props) => (
  <View style={styles.container}>
    <SharedText color="green" testID={testID}>
      {stepLabel}
    </SharedText>
    <Button
      title={`Push ${nextRoute}`}
      onPress={() => navigation.dispatch(StackActions.push(nextRoute))}
    />
    <Button title="Back" onPress={() => navigation.goBack()} />
  </View>
)

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12}
})
