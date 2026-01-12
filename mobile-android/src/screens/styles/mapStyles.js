/**
 * =============================================================================
 * MAP SCREEN STYLES
 * =============================================================================
 */

import { StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { spacing, borderRadius, fontSize } from '../../styles/spacing';

export const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },

  // Header
  header: {
    position: 'absolute',
    top: 50,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButton: {
    padding: spacing.sm,
  },
  menuIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },

  // User Menu
  userMenu: {
    position: 'absolute',
    top: 110,
    left: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 200,
  },
  userInfo: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  logoutButton: {
    paddingVertical: spacing.sm,
  },
  logoutText: {
    fontSize: fontSize.md,
    color: colors.danger,
    fontWeight: '500',
  },

  // Filter
  filterButton: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  filterButtonText: {
    fontSize: fontSize.md,
  },
  filterPanel: {
    position: 'absolute',
    top: 110,
    right: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  filterOptionActive: {
    backgroundColor: colors.primaryLight,
  },

  // Markers
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  markerIcon: {
    fontSize: 20,
  },

  // Center button
  centerButton: {
    position: 'absolute',
    bottom: 100,
    right: spacing.xl,
    width: 50,
    height: 50,
    backgroundColor: colors.white,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  centerButtonText: {
    fontSize: 24,
  },

  // SOS Button
  sosButton: {
    position: 'absolute',
    bottom: 30,
    left: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.danger,
    borderRadius: borderRadius.lg,
    padding: spacing.xl - 2,
    alignItems: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sosButtonText: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    maxHeight: '70%',
  },
  modalClose: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 1,
  },
  modalCloseText: {
    fontSize: 24,
    color: colors.textHint,
  },

  // Vehicle details in modal
  vehicleImage: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.gray[100],
  },
  vehicleInfo: {
    paddingBottom: spacing.xl,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  vehicleNumber: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  statusOnline: {
    backgroundColor: colors.statusOnline,
  },
  statusOffline: {
    backgroundColor: colors.statusOffline,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  licensePlate: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoLabel: {
    color: colors.textSecondary,
  },
  infoValue: {
    fontWeight: '500',
  },
  speedContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.gray[50],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  speedLabel: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  speedValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Route info in modal
  routeInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  routeIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  routeText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2,
  },

  // ETA Display
  etaContainer: {
    backgroundColor: colors.success + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  etaMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  etaInfo: {
    flex: 1,
  },
  etaLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  etaTime: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 2,
  },
  etaDistance: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.success + '20',
  },
  etaDistanceValue: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  etaDistanceLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  etaNote: {
    fontSize: fontSize.xs,
    color: colors.textHint,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  etaUnavailable: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  etaUnavailableText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // SOS Modal
  sosModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  sosModalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  sosModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  sosModalIcon: {
    fontSize: 32,
    marginRight: spacing.sm,
  },
  sosModalTitle: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.danger,
  },
  sosModalSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  sosReasonInput: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSize.md,
    minHeight: 120,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  sosModalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sosModalCancelButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
  },
  sosModalCancelText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sosModalSendButton: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  sosModalSendButtonDisabled: {
    backgroundColor: colors.gray[400],
  },
  sosModalSendText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
  sosModalNote: {
    fontSize: fontSize.xs,
    color: colors.textHint,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default mapStyles;
