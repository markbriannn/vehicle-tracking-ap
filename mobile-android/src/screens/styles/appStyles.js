/**
 * =============================================================================
 * APP-LEVEL STYLES
 * =============================================================================
 */

import { StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

export const appStyles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
});

export default appStyles;
