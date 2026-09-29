import './src/theme'
import {NavigationContainer} from '@react-navigation/native'
import {GestureHandlerRootView} from 'react-native-gesture-handler'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {enableFreeze, enableScreens} from 'react-native-screens'
import {StyleSheet} from 'react-native-unistyles'
import {RootNavigator} from './src/RootNavigator'

enableScreens(true)
enableFreeze(true)

const App = () => (
  <GestureHandlerRootView style={styles.container}>
    <SafeAreaProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  </GestureHandlerRootView>
)

const styles = StyleSheet.create({
  container: {flex: 1}
})

export default App
