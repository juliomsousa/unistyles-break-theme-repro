import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {StackActions} from '@react-navigation/native';
import {navigationRef} from './navigationRef';

const CYCLE_DELAY_MS = 700;

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// drives push Step1 -> push Step2 -> push Step3 -> pop to Home, looped, with no manual tapping.
// rendered outside the Home stack's Screens so it keeps running while those screens are frozen.
export const AutoRunner = () => {
  const [cycle, setCycle] = useState(0);
  const [status, setStatus] = useState('starting');
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

    const run = async () => {
      let n = 0;
      while (!stoppedRef.current) {
        n += 1;
        setCycle(n);

        setStatus(`cycle ${n}: push Step1`);
        navigationRef.current?.dispatch(StackActions.push('Step1'));
        await delay(CYCLE_DELAY_MS);
        if (stoppedRef.current) break;

        setStatus(`cycle ${n}: push Step2`);
        navigationRef.current?.dispatch(StackActions.push('Step2'));
        await delay(CYCLE_DELAY_MS);
        if (stoppedRef.current) break;

        setStatus(`cycle ${n}: push Step3 (ButtonLikeScreen)`);
        navigationRef.current?.dispatch(StackActions.push('Step3'));
        await delay(CYCLE_DELAY_MS);
        if (stoppedRef.current) break;

        setStatus(`cycle ${n}: pop to Home`);
        navigationRef.current?.dispatch(StackActions.popToTop());
        await delay(CYCLE_DELAY_MS);

        console.log(`[AutoRunner] completed cycle ${n}`);
      }
    };

    run();

    return () => {
      stoppedRef.current = true;
    };
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      <Text testID="auto-runner-status" style={styles.text}>
        {status} (cycle {cycle})
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    color: '#666666',
  },
});
