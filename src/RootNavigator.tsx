import React from 'react';
import {StyleSheet, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen} from './HomeScreen';
import {StepScreen} from './StepScreen';
import {ButtonLikeScreen} from './ButtonLikeScreen';
import {AutoRunner} from './AutoRunner';
import type {HomeStackParamList} from './types';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

export const RootNavigator = () => (
  <View style={styles.flex}>
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{title: 'Home'}} />
      <HomeStack.Screen name="Step1" options={{title: 'Step 1'}}>
        {props => <StepScreen {...props} nextRoute="Step2" stepLabel="Step 1" />}
      </HomeStack.Screen>
      <HomeStack.Screen name="Step2" options={{title: 'Step 2'}}>
        {props => <StepScreen {...props} nextRoute="Step3" stepLabel="Step 2" />}
      </HomeStack.Screen>
      <HomeStack.Screen name="Step3" component={ButtonLikeScreen} options={{title: 'Step 3'}} />
    </HomeStack.Navigator>
    <AutoRunner />
  </View>
);

const styles = StyleSheet.create({
  flex: {flex: 1},
});
