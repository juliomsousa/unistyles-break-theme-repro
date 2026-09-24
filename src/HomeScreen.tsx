import React from 'react';
import {StyleSheet, View} from 'react-native';
import {SharedText} from './SharedText';

export const HomeScreen = () => (
  <View style={styles.container}>
    <SharedText testID="home-text" color="green" alignCenter={false}>
      Home
    </SharedText>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 24,
  },
});
