/**
 * =============================================================================
 * REGISTER DRIVER SCREEN STYLES
 * =============================================================================
 */

import { StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { spacing, borderRadius, fontSize } from '../../styles/spacing';

export const registerDriverStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },

  // Progress indicator
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressStep: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStepActive: {
    backgroundColor: colors.primary,
  },
  progressText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  progressLine: {
    width: 60,
    height: 3,
    backgroundColor: colors.gray[300],
    marginHorizontal: spacing.md,
  },

  // Step container
  stepContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  stepTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  stepSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  // Form inputs
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    fontSize: fontSize.lg,
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
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputSmall: {
    flex: 1,
    maxWidth: 70,
  },
  inputMedium: {
    flex: 2,
  },

  // Buttons
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    flex: 1,
  },
  buttonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },

  // Document upload
  documentContainer: {
    marginBottom: spacing.xl,
  },
  documentLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  documentImage: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  documentPlaceholder: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
  },
  documentPlaceholderText: {
    color: colors.textHint,
  },
  documentButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  documentButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  documentButtonText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },

  // Vehicle type selection
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  typeOptionSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  typeOptionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  typeOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  ownershipNote: {
    fontSize: fontSize.sm,
    color: colors.textHint,
    backgroundColor: colors.info + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.info,
  },
});

export default registerDriverStyles;
