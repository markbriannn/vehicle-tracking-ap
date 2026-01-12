/**
 * =============================================================================
 * REGISTER STUDENT SCREEN STYLES
 * =============================================================================
 */

import { StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { spacing, borderRadius, fontSize } from '../../styles/spacing';

export const registerStudentStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    fontSize: fontSize.lg,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputSmall: {
    flex: 1,
  },
  inputMedium: {
    flex: 2,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  passwordInput: {
    flex: 1,
    padding: spacing.lg,
    fontSize: fontSize.lg,
  },
  eyeButton: {
    padding: spacing.md,
    paddingRight: spacing.lg,
  },
  eyeIcon: {
    fontSize: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
});

export default registerStudentStyles;
