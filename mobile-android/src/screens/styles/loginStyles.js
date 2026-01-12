/**
 * =============================================================================
 * LOGIN SCREEN STYLES
 * =============================================================================
 */

import { StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { spacing, borderRadius, fontSize } from '../../styles/spacing';

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  
  // Logo section
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Form section
  form: {
    marginBottom: 30,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    fontSize: fontSize.lg,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray[300],
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
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: '600',
  },

  // Register section
  registerContainer: {
    alignItems: 'center',
  },
  registerText: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  registerButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  registerButtonSecondary: {
    borderColor: colors.success,
  },
  registerButtonText: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '500',
  },
  registerButtonTextSecondary: {
    color: colors.success,
  },

  // Hint text
  hintText: {
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.textHint,
    marginTop: spacing.xl,
  },
});

export default loginStyles;
