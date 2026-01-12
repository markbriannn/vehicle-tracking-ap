/**
 * =============================================================================
 * REGISTER VEHICLE SCREEN STYLES
 * =============================================================================
 */

import { StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { spacing, borderRadius, fontSize } from '../../styles/spacing';

export const registerVehicleStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
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
  
  // Form
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    fontSize: fontSize.lg,
  },

  // Vehicle type selector
  typeContainer: {
    marginBottom: spacing.xl,
  },
  typeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  typeOptionText: {
    fontSize: fontSize.md,
  },

  // Photo upload
  photoContainer: {
    marginBottom: spacing.xl,
  },
  photoPreview: {
    width: '100%',
    height: 150,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  photoPlaceholder: {
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
  photoPlaceholderText: {
    color: colors.textHint,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoButton: {
    flex: 1,
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  photoButtonText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },

  // Submit button
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

export default registerVehicleStyles;
