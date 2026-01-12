/**
 * =============================================================================
 * DRIVER HOME SCREEN STYLES
 * =============================================================================
 */

import { StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { spacing, borderRadius, fontSize } from '../../styles/spacing';

export const driverHomeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: 60,
    backgroundColor: colors.white,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  role: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  logoutButton: {
    padding: spacing.md,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: '500',
  },

  // Status card
  statusCard: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  statusLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  statusHint: {
    fontSize: fontSize.sm,
    color: colors.textHint,
    marginTop: spacing.sm,
  },

  // Vehicle card
  vehicleCard: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.lg,
    color: colors.textPrimary,
  },
  vehicleInfo: {
    marginBottom: spacing.lg,
  },
  vehicleNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  vehiclePlate: {
    fontSize: fontSize.xl,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  vehicleType: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textTransform: 'capitalize',
  },
  registerVehicleButton: {
    backgroundColor: colors.gray[100],
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  registerVehicleText: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Tracking card
  trackingCard: {
    backgroundColor: colors.white,
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  locationInfo: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  speedDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  speedValue: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.primary,
  },
  speedUnit: {
    fontSize: fontSize.xl,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  locationText: {
    fontSize: fontSize.sm,
    color: colors.textHint,
    marginTop: spacing.md,
  },
  trackingButton: {
    padding: spacing.xl - 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  trackingButtonStart: {
    backgroundColor: colors.success,
  },
  trackingButtonStop: {
    backgroundColor: colors.danger,
  },
  trackingButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  trackingButtonText: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: '600',
  },
  trackingButtonTextDisabled: {
    color: colors.gray[500],
  },

  // Requirements box
  requirementsBox: {
    backgroundColor: colors.warning + '15',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  requirementsTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  requirementItem: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    paddingLeft: spacing.sm,
  },

  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    marginRight: spacing.sm,
  },
  offlineDot: {
    backgroundColor: colors.warning,
  },
  trackingIndicatorText: {
    color: colors.success,
    fontSize: fontSize.md,
  },

  // Offline buffer status
  bufferStatus: {
    backgroundColor: colors.warning + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  bufferText: {
    color: colors.warning,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },

  // SOS button
  sosButton: {
    backgroundColor: colors.danger,
    margin: spacing.lg,
    marginTop: 0,
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
  },
  sosButtonText: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
  },

  // Route container
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  routeValue: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  editRouteButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  editRouteText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  routeInput: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSize.lg,
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.gray[200],
  },
  modalButtonCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalButtonSave: {
    backgroundColor: colors.primary,
  },
  modalButtonSaveText: {
    color: colors.white,
    fontWeight: '600',
  },
});

export default driverHomeStyles;
