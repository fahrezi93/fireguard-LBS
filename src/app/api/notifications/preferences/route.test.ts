import { NextRequest } from 'next/server';
import * as db from '@/lib/db';
import * as cors from '@/lib/cors';
import * as rateLimit from '@/lib/rate-limit';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  execute: jest.fn(),
  queryRow: jest.fn(),
  formatDateForMySQL: jest.fn(),
}));
jest.mock('@/lib/cors');
jest.mock('@/lib/rate-limit');

type RouteHandler = (request: NextRequest) => Promise<Response>;

let GET: RouteHandler;
let PUT: RouteHandler;

describe('Notification Preferences API', () => {
  const mockExecute = db.execute as jest.MockedFunction<typeof db.execute>;
  const mockQueryRow = db.queryRow as jest.MockedFunction<typeof db.queryRow>;
  const mockFormatDateForMySQL = db.formatDateForMySQL as jest.MockedFunction<typeof db.formatDateForMySQL>;
  const mockGetAuthPayloadFromRequest = cors.getAuthPayloadFromRequest as jest.MockedFunction<typeof cors.getAuthPayloadFromRequest>;
  const mockJsonWithCors = cors.jsonWithCors as jest.MockedFunction<typeof cors.jsonWithCors>;
  const mockEnforceRateLimit = rateLimit.enforceRateLimit as jest.MockedFunction<typeof rateLimit.enforceRateLimit>;

  beforeAll(async () => {
    ({ GET, PUT } = await import('./route'));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockFormatDateForMySQL.mockReturnValue('2024-01-01 00:00:00');
    mockEnforceRateLimit.mockReturnValue({ allowed: true });
    mockJsonWithCors.mockImplementation((data, init) => {
      return new Response(JSON.stringify(data), {
        status: init?.status || 200,
        headers: { 'Content-Type': 'application/json' }
      }) as any;
    });
  });

  describe('GET /api/notifications/preferences', () => {
    it('should retrieve existing notification preferences', async () => {
      // Arrange
      const mockUserId = 123;
      const mockPreferences = {
        id: 1,
        user_id: mockUserId,
        approved: 1,
        in_progress: 0,
        completed: 1,
        verified: 0,
        false_report: 1,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockGetAuthPayloadFromRequest.mockResolvedValue({
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User'
      });
      mockQueryRow.mockResolvedValue(mockPreferences);

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'GET'
      });

      // Act
      await GET(request);

      // Assert
      expect(mockGetAuthPayloadFromRequest).toHaveBeenCalledWith(request);
      expect(mockQueryRow).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM notification_preferences'),
        [mockUserId]
      );
      expect(mockJsonWithCors).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          preferences: {
            approved: true,
            inProgress: false,
            completed: true,
            verified: false,
            falseReport: true
          }
        }),
        expect.objectContaining({ status: 200 })
      );
    });

    it('should create default preferences if none exist', async () => {
      // Arrange
      const mockUserId = 456;
      const defaultPreferences = {
        id: 2,
        user_id: mockUserId,
        approved: true,
        in_progress: true,
        completed: true,
        verified: true,
        false_report: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockGetAuthPayloadFromRequest.mockResolvedValue({
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User'
      });
      mockQueryRow
        .mockResolvedValueOnce(null) // First call returns null (no preferences)
        .mockResolvedValueOnce(defaultPreferences); // Second call returns created preferences
      mockExecute.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'GET'
      });

      // Act
      await GET(request);

      // Assert
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_preferences'),
        expect.arrayContaining([
          mockUserId,
          '2024-01-01 00:00:00',
          '2024-01-01 00:00:00'
        ])
      );
      expect(mockQueryRow).toHaveBeenCalledTimes(2);
      expect(mockJsonWithCors).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          preferences: {
            approved: true,
            inProgress: true,
            completed: true,
            verified: true,
            falseReport: true
          }
        }),
        expect.objectContaining({ status: 200 })
      );
    });

    it('should handle authentication failure', async () => {
      // Arrange
      mockGetAuthPayloadFromRequest.mockRejectedValue(new Error('Token autentikasi tidak ditemukan.'));

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'GET'
      });

      // Act
      await GET(request);

      // Assert
      expect(mockQueryRow).not.toHaveBeenCalled();
      expect(mockJsonWithCors).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Autentikasi gagal')
        }),
        expect.objectContaining({ status: 401 })
      );
    });

    it('should handle rate limiting', async () => {
      // Arrange
      mockEnforceRateLimit.mockReturnValue({ allowed: false, retryAfter: 30 });

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'GET'
      });

      // Act
      await GET(request);

      // Assert
      expect(mockGetAuthPayloadFromRequest).not.toHaveBeenCalled();
      expect(mockJsonWithCors).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Terlalu banyak')
        }),
        expect.objectContaining({
          status: 429,
          headers: { 'Retry-After': '30' }
        })
      );
    });
  });

  describe('PUT /api/notifications/preferences', () => {
    it('should update existing notification preferences', async () => {
      // Arrange
      const mockUserId = 789;
      const existingPreferences = {
        id: 3,
        user_id: mockUserId,
        approved: true,
        in_progress: true,
        completed: true,
        verified: true,
        false_report: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      const updatedPreferences = {
        ...existingPreferences,
        approved: false,
        in_progress: false
      };

      mockGetAuthPayloadFromRequest.mockResolvedValue({
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User'
      });
      mockQueryRow
        .mockResolvedValueOnce(existingPreferences) // Check if exists
        .mockResolvedValueOnce(updatedPreferences); // Return updated
      mockExecute.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          approved: false,
          inProgress: false
        })
      });

      // Act
      await PUT(request);

      // Assert
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notification_preferences'),
        expect.arrayContaining([
          false, // approved
          false, // inProgress
          '2024-01-01 00:00:00',
          mockUserId
        ])
      );
      expect(mockJsonWithCors).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.any(String),
          preferences: {
            approved: false,
            inProgress: false,
            completed: true,
            verified: true,
            falseReport: true
          }
        }),
        expect.objectContaining({ status: 200 })
      );
    });

    it('should create preferences if none exist', async () => {
      // Arrange
      const mockUserId = 999;
      const newPreferences = {
        id: 4,
        user_id: mockUserId,
        approved: false,
        in_progress: true,
        completed: true,
        verified: true,
        false_report: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      mockGetAuthPayloadFromRequest.mockResolvedValue({
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User'
      });
      mockQueryRow
        .mockResolvedValueOnce(null) // No existing preferences
        .mockResolvedValueOnce(newPreferences); // Return created
      mockExecute.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          approved: false,
          falseReport: false
        })
      });

      // Act
      await PUT(request);

      // Assert
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_preferences'),
        expect.arrayContaining([
          mockUserId,
          false, // approved
          true,  // inProgress (default)
          true,  // completed (default)
          true,  // verified (default)
          false, // falseReport
          '2024-01-01 00:00:00',
          '2024-01-01 00:00:00'
        ])
      );
    });

    it('should reject request with no preferences provided', async () => {
      // Arrange
      mockGetAuthPayloadFromRequest.mockResolvedValue({
        id: 111,
        email: 'test@example.com',
        name: 'Test User'
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({})
      });

      // Act
      await PUT(request);

      // Assert
      expect(mockExecute).not.toHaveBeenCalled();
      expect(mockJsonWithCors).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Setidaknya satu preferensi')
        }),
        expect.objectContaining({ status: 400 })
      );
    });

    it('should reject invalid boolean values', async () => {
      // Arrange
      mockGetAuthPayloadFromRequest.mockResolvedValue({
        id: 222,
        email: 'test@example.com',
        name: 'Test User'
      });

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          approved: 'yes', // Invalid: should be boolean
          completed: true
        })
      });

      // Act
      await PUT(request);

      // Assert
      expect(mockExecute).not.toHaveBeenCalled();
      expect(mockJsonWithCors).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('boolean')
        }),
        expect.objectContaining({ status: 400 })
      );
    });

    it('should handle authentication failure', async () => {
      // Arrange
      mockGetAuthPayloadFromRequest.mockRejectedValue(new Error('Token autentikasi tidak ditemukan.'));

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          approved: false
        })
      });

      // Act
      await PUT(request);

      // Assert
      expect(mockExecute).not.toHaveBeenCalled();
      expect(mockJsonWithCors).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Autentikasi gagal')
        }),
        expect.objectContaining({ status: 401 })
      );
    });

    it('should handle rate limiting', async () => {
      // Arrange
      mockEnforceRateLimit.mockReturnValue({ allowed: false, retryAfter: 30 });

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          approved: false
        })
      });

      // Act
      await PUT(request);

      // Assert
      expect(mockGetAuthPayloadFromRequest).not.toHaveBeenCalled();
      expect(mockJsonWithCors).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Terlalu banyak')
        }),
        expect.objectContaining({
          status: 429,
          headers: { 'Retry-After': '30' }
        })
      );
    });

    it('should update only specified preferences', async () => {
      // Arrange
      const mockUserId = 333;
      const existingPreferences = {
        id: 5,
        user_id: mockUserId,
        approved: true,
        in_progress: true,
        completed: true,
        verified: true,
        false_report: true,
        created_at: new Date(),
        updated_at: new Date()
      };
      const updatedPreferences = {
        ...existingPreferences,
        verified: false
      };

      mockGetAuthPayloadFromRequest.mockResolvedValue({
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User'
      });
      mockQueryRow
        .mockResolvedValueOnce(existingPreferences)
        .mockResolvedValueOnce(updatedPreferences);
      mockExecute.mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          verified: false // Only update verified
        })
      });

      // Act
      await PUT(request);

      // Assert
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notification_preferences'),
        expect.arrayContaining([
          false, // verified
          '2024-01-01 00:00:00',
          mockUserId
        ])
      );
      // Should not include other fields in the update
      expect(mockExecute).toHaveBeenCalledWith(
        expect.stringMatching(/verified = \?/),
        expect.any(Array)
      );
    });
  });
});
