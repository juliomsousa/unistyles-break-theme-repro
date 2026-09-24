import React from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';
import {StackActions} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {HomeStackParamList} from './types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Step1' | 'Step2'> & {
  nextRoute: keyof HomeStackParamList;
  stepLabel: string;
};

// generic "push another screen" screen, reused for Step1 and Step2
export const StepScreen = ({navigation, nextRoute, stepLabel}: Props) => (
  <View style={styles.container}>
    <Text style={styles.text}>{stepLabel}</Text>
    <Button
      title={`Push ${nextRoute}`}
      onPress={() => navigation.dispatch(StackActions.push(nextRoute))}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  text: {fontSize: 20, fontWeight: '600'},
});
