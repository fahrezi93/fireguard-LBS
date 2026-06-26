/**
 * Tests for Notification Service
 * 
 * Tests the main orchestration method sendReportStatusNotification
 */

// Mock dependencies before importing
jest.mock('@/lib/db', () => ({
  queryRows: jest.fn(),
  execute: jest.fn(),
  formatDateForMySQL: jest.fn((date: Date) => date.toISOString()),
}));

jest.mock('@/lib/firebase-admin', () => ({
  getMessaging: jest.fn(() => ({
    send: jest.fn(),
  })),
}));

import * as notificationService from './notification-service';
import * as db from '@/lib/db';
import { getMessaging } from '@/lib/firebase-admin';

describe('sendReportStatusNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send notification when user has active device tokens', async () => {
    // Arrange
    const reportId = 123;
    const userId = 456;
    const newStatus = 'approved';

    const mockDeviceTokens = [
      { device_token: 'token123', platform: 'android' }
    ];

    const mockPreferences = [
      {
        approved: true,
        in_progress: true,
        completed: true,
        verified: true,
        false_report: true
      }
    ];

    (db.queryRows as jest.Mock)
      .mockResolvedValueOnce(mockDeviceTokens)
      .mockResolvedValueOnce(mockPreferences);
    (db.execute as jest.Mock).mockResolvedValue(1);
    const sendMock = jest.fn().mockResolvedValue('message-id');
    (getMessaging as jest.Mock).mockReturnValue({ send: sendMock });

    // Act
    await notificationService.sendReportStatusNotification(reportId, userId, newStatus);

    // Assert
    expect(db.queryRows).toHaveBeenCalledWith(
      expect.stringContaining('platform IN (?, ?)'),
      [userId, 'android', 'ios']
    );
    const messagingInstance = await getMessaging();
    expect(messagingInstance?.send).toHaveBeenCalledWith(
      expect.objectContaining({
        notification: {
          title: 'Laporan Disetujui',
          body: 'Laporan Anda telah disetujui dan sedang diproses',
        },
        android: expect.objectContaining({
          priority: 'high',
          notification: expect.objectContaining({
            channelId: 'siagabencana_reports',
            priority: 'high',
            sound: 'default',
          }),
        }),
        data: expect.objectContaining({
          target: 'mobile',
        }),
      })
    );
    expect(db.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO notification_logs'),
      expect.arrayContaining([reportId, userId, 'token123', newStatus])
    );
  });

  it('should not send notification when user has no active device tokens', async () => {
    // Arrange
    const reportId = 123;
    const userId = 456;
    const newStatus = 'approved';

    (db.queryRows as jest.Mock).mockResolvedValueOnce([]);

    // Act
    await notificationService.sendReportStatusNotification(reportId, userId, newStatus);

    // Assert
    const messagingInstance = await getMessaging();
    expect(messagingInstance?.send).not.toHaveBeenCalled();
  });

  it('should not send notification when user has disabled that notification type', async () => {
    // Arrange
    const reportId = 123;
    const userId = 456;
    const newStatus = 'approved';

    const mockDeviceTokens = [
      { device_token: 'token123', platform: 'android' }
    ];

    const mockPreferences = [
      {
        approved: 0, // MySQL can return BOOLEAN as 0/1
        in_progress: true,
        completed: true,
        verified: true,
        false_report: true
      }
    ];

    (db.queryRows as jest.Mock)
      .mockResolvedValueOnce(mockDeviceTokens)
      .mockResolvedValueOnce(mockPreferences);

    // Act
    await notificationService.sendReportStatusNotification(reportId, userId, newStatus);

    // Assert
    const messagingInstance = await getMessaging();
    expect(messagingInstance?.send).not.toHaveBeenCalled();
  });

  it('should normalize legacy status before checking notification preferences', async () => {
    // Arrange
    const reportId = 123;
    const userId = 456;
    const newStatus = 'diproses';

    const mockDeviceTokens = [
      { device_token: 'token123', platform: 'android' }
    ];

    const mockPreferences = [
      {
        approved: true,
        in_progress: false, // User disabled in_progress notifications
        completed: true,
        verified: true,
        false_report: true
      }
    ];

    (db.queryRows as jest.Mock)
      .mockResolvedValueOnce(mockDeviceTokens)
      .mockResolvedValueOnce(mockPreferences);

    // Act
    await notificationService.sendReportStatusNotification(reportId, userId, newStatus);

    // Assert
    const messagingInstance = await getMessaging();
    expect(messagingInstance?.send).not.toHaveBeenCalled();
  });

  it('should send canonical status in payload for legacy status alias', async () => {
    // Arrange
    const reportId = 123;
    const userId = 456;
    const newStatus = 'false';

    const mockDeviceTokens = [
      { device_token: 'token123', platform: 'android' }
    ];

    const mockPreferences = [
      {
        approved: true,
        in_progress: true,
        completed: true,
        verified: true,
        false_report: true
      }
    ];

    (db.queryRows as jest.Mock)
      .mockResolvedValueOnce(mockDeviceTokens)
      .mockResolvedValueOnce(mockPreferences);
    (db.execute as jest.Mock).mockResolvedValue(1);
    const sendMock = jest.fn().mockResolvedValue('message-id');
    (getMessaging as jest.Mock).mockReturnValue({ send: sendMock });

    // Act
    await notificationService.sendReportStatusNotification(reportId, userId, newStatus);

    // Assert
    const messagingInstance = await getMessaging();
    expect(messagingInstance?.send).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'false_report'
        })
      })
    );
  });

  it('should handle errors gracefully without throwing', async () => {
    // Arrange
    const reportId = 123;
    const userId = 456;
    const newStatus = 'approved';

    (db.queryRows as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

    // Act & Assert - should not throw
    await expect(
      notificationService.sendReportStatusNotification(reportId, userId, newStatus)
    ).resolves.not.toThrow();
  });

  it('should log notification attempt even if sending fails', async () => {
    // Arrange
    const reportId = 123;
    const userId = 456;
    const newStatus = 'approved';

    const mockDeviceTokens = [
      { device_token: 'token123', platform: 'android' }
    ];

    const mockPreferences = [
      {
        approved: true,
        in_progress: true,
        completed: true,
        verified: true,
        false_report: true
      }
    ];

    (db.queryRows as jest.Mock)
      .mockResolvedValueOnce(mockDeviceTokens)
      .mockResolvedValueOnce(mockPreferences);
    (db.execute as jest.Mock).mockResolvedValue(1);
    const sendMock = jest.fn().mockRejectedValue(new Error('FCM error'));
    (getMessaging as jest.Mock).mockReturnValue({ send: sendMock });

    // Act
    await notificationService.sendReportStatusNotification(reportId, userId, newStatus);

    // Assert - should still log the attempt
    expect(db.execute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO notification_logs'),
      expect.arrayContaining([
        reportId,
        userId,
        'token123',
        newStatus,
        expect.any(String), // title
        expect.any(String), // body
        'failed',
        expect.any(String), // error message
        expect.any(Number), // retry count
        expect.any(String)  // timestamp
      ])
    );
  });
});
