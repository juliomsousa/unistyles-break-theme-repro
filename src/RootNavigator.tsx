import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HomeScreen} from './HomeScreen';
import {StepScreen} from './StepScreen';
import {ButtonLikeScreen} from './ButtonLikeScreen';
import {AutoRunner} from './AutoRunner';
import type {HomeStackParamList, RootTabParamList} from './types';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator = () => (
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
);

const OtherScreen = () => (
  <View style={styles.otherContainer}>
    <Text>Other tab</Text>
  </View>
);

const Tab = createBottomTabNavigator<RootTabParamList>();

export const RootNavigator = () => (
  <View style={styles.flex}>
    <Tab.Navigator detachInactiveScreens screenOptions={{headerShown: false}}>
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{title: 'Home'}} />
      <Tab.Screen name="Other" component={OtherScreen} />
    </Tab.Navigator>
    <AutoRunner />
  </View>
);

const styles = StyleSheet.create({
  flex: {flex: 1},
  otherContainer: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});
