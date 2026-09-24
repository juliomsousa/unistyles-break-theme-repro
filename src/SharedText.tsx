import React from 'react';
import {Text} from 'react-native';
import {StyleSheet} from 'react-native-unistyles';

// shared dynamic style function called with different args by different screens,
// the cross-contamination bug (if present) makes one screen's args leak into another's
const styles = StyleSheet.create(theme => ({
  styledText: ({color, alignCenter}: {color: keyof typeof theme.colors; alignCenter: boolean}) => ({
    color: theme.colors[color],
    textAlign: alignCenter ? 'center' : undefined,
  }),
}));

type Props = {
  color: 'green' | 'white';
  alignCenter: boolean;
  children: React.ReactNode;
  testID?: string;
};

export const SharedText = ({color, alignCenter, children, testID}: Props) => (
  <Text testID={testID} style={styles.styledText({color, alignCenter})}>
    {children}
  </Text>
);
