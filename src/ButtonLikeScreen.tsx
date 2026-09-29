import {Button, View} from 'react-native'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import {StyleSheet} from 'react-native-unistyles'
import {SharedText} from './SharedText'
import {type RootStackParamList} from './types'

type Props = NativeStackScreenProps<RootStackParamList, 'Step3'>

export const ButtonLikeScreen = ({navigation}: Props) => (
  <View style={styles.container}>
    <SharedText alignCenter color="white" testID="button-like-text">
      Button
    </SharedText>
    <Button title="Back" onPress={() => navigation.goBack()} />
  </View>
)

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: theme.colors.dark
  }
}))
