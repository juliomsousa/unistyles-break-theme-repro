import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {StackActions} from '@react-navigation/native';
import {navigationRef} from './navigationRef';

// time between individual pushes, so react-navigation doesn't drop overlapping transitions
const TRANSITION_DELAY_MS = 400;
// extra wait once Step3 is focused, so react-native-screens actually freezes Home before we pop
// (popping too fast can skip the freeze entirely - see spec section 5)
const FREEZE_SETTLE_DELAY_MS = 400;
// pause after popping back to Home, so a human can actually watch each cycle's result
const CYCLE_COOLDOWN_MS = 1500;

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// drives push Step1 -> push Step2 -> push Step3 -> (wait for freeze) -> pop to Home in one shot,
// looped, with no manual tapping. Rendered outside the stack's Screens so it keeps running while
// they're frozen.
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
        await delay(TRANSITION_DELAY_MS);
        if (stoppedRef.current) break;

        setStatus(`cycle ${n}: push Step2`);
        navigationRef.current?.dispatch(StackActions.push('Step2'));
        await delay(TRANSITION_DELAY_MS);
        if (stoppedRef.current) break;

        setStatus(`cycle ${n}: push Step3 (ButtonLikeScreen)`);
        navigationRef.current?.dispatch(StackActions.push('Step3'));
        await delay(TRANSITION_DELAY_MS);
        if (stoppedRef.current) break;

        setStatus(`cycle ${n}: waiting for Home to freeze`);
        await delay(FREEZE_SETTLE_DELAY_MS);
        if (stoppedRef.current) break;

        setStatus(`cycle ${n}: pop to Home (single event)`);
        navigationRef.current?.dispatch(StackActions.popToTop());
        console.log(`[AutoRunner] completed cycle ${n}`);

        await delay(CYCLE_COOLDOWN_MS);
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
    backgroundColor: '#ffffffcc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
