import {View} from 'react-native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {StyleSheet} from 'react-native-unistyles'
import {ButtonLikeScreen} from './ButtonLikeScreen'
import {HomeScreen} from './HomeScreen'
import {StepScreen} from './StepScreen'
import {type RootStackParamList} from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

// flat stack, no tabs: tab switching is not the trigger for this bug, only stack push/pop
// depth is (see spec section 3) - keeping tabs out avoids an unrequired confounding variable
export const RootNavigator = () => (
  <View style={styles.flex}>
    <Stack.Navigator>
      <Stack.Screen
        component={HomeScreen}
        name="Home"
        options={{title: 'Home'}}
      />
      <Stack.Screen name="Step1" options={{title: 'Step 1'}}>
        {props => (
          <StepScreen
            {...props}
            nextRoute="Step2"
            stepLabel="Step 1"
            testID="step1-text"
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Step2" options={{title: 'Step 2'}}>
        {props => (
          <StepScreen
            {...props}
            nextRoute="Step3"
            stepLabel="Step 2"
            testID="step2-text"
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        component={ButtonLikeScreen}
        name="Step3"
        options={{title: 'Step 3'}}
      />
    </Stack.Navigator>
  </View>
)

const styles = StyleSheet.create({
  flex: {flex: 1}
})
