import {createNavigationContainerRef} from '@react-navigation/native';
import type {HomeStackParamList} from './types';

// held outside any Screen so it keeps working while the stack's screens are frozen
export const navigationRef = createNavigationContainerRef<HomeStackParamList>();
