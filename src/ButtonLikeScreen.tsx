import React from 'react';
import {Button, StyleSheet, View} from 'react-native';
import {StackActions} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SharedText} from './SharedText';
import type {HomeStackParamList} from './types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Step3'>;

export const ButtonLikeScreen = ({navigation}: Props) => (
  <View style={styles.container}>
    <SharedText testID="button-like-text" color="white" alignCenter>
      Button
    </SharedText>
    <Button title="Back to Home" onPress={() => navigation.dispatch(StackActions.popToTop())} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#111111',
  },
});
