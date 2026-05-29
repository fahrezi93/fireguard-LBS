import { NextRequest } from 'next/server';
import * as db from '@/lib/db';
import * as cors from '@/lib/cors';
import * as rateLimit from '@/lib/rate-limit';

// Mock dependencies
jest.mock('@/lib/db', () => ({
  execute: jest.fn(),
  formatDateForMySQL: jest.fn(),
}));
jest.mock('@/lib/cors');
jest.mock('@/lib/rate-limit');

let POST: (request: NextRequest) => Promise<Response>;

describe('POST /api/notifications/register', () => {
  const mockExecute = db.execute as jest.MockedFunction<typeof db.execute>;
  const mockFormatDateForMySQL = db.formatDateForMySQL as jest.MockedFunction<typeof db.formatDateForMySQL>;
  const mockGetAuthPayloadFromRequest = cors.getAuthPayloadFromRequest as jest.MockedFunction<typeof cors.getAuthPayloadFromRequest>;
  const mockJsonWithCors = cors.jsonWithCors as jest.MockedFunction<typeof cors.jsonWithCors>;
  const mockEnforceRateLimit = rateLimit.enforceRateLimit as jest.MockedFunction<typeof rateLimit.enforceRateLimit>;

  beforeAll(async () => {
    ({ POST } = await import('./route'));
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

  it('should successfully register a device token', async () => {
    // Arrange
    const mockUserId = 123;
    mockGetAuthPayloadFromRequest.mockResolvedValue({
      id: mockUserId,
      email: 'test@example.com',
      name: 'Test User'
    });
    mockExecute.mockResolvedValue(1);

    const request = new NextRequest('http://localhost:3000/api/notifications/register', {
      method: 'POST',
      body: JSON.stringify({
        deviceToken: 'test-device-token-123',
        platform: 'android'
      })
    });

    // Act
    await POST(request);

    // Assert
    expect(mockGetAuthPayloadFromRequest).toHaveBeenCalledWith(request);
    expect(mockExecute).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO device_tokens'),
      expect.arrayContaining([
        mockUserId,
        'test-device-token-123',
        'android',
        '2024-01-01 00:00:00',
        '2024-01-01 00:00:00',
        '2024-01-01 00:00:00'
      ])
    );
    expect(mockJsonWithCors).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String)
      }),
      expect.objectContaining({ status: 200 })
    );
  });

  it('should default to android platform if not specified', async () => {
    // Arrange
    mockGetAuthPayloadFromRequest.mockResolvedValue({
      id: 456,
      email: 'test@example.com',
      name: 'Test User'
    });
    mockExecute.mockResolvedValue(1);

    const request = new NextRequest('http://localhost:3000/api/notifications/register', {
      method: 'POST',
      body: JSON.stringify({
        deviceToken: 'test-device-token-456'
      })
    });

    // Act
    await POST(request);

    // Assert
    expect(mockExecute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([
        456,
        'test-device-token-456',
        'android', // Should default to android
        expect.any(String),
        expect.any(String),
        expect.any(String)
      ])
    );
  });

  it('should reject invalid device token', async () => {
    // Arrange
    mockGetAuthPayloadFromRequest.mockResolvedValue({
      id: 789,
      email: 'test@example.com',
      name: 'Test User'
    });

    const request = new NextRequest('http://localhost:3000/api/notifications/register', {
      method: 'POST',
      body: JSON.stringify({
        deviceToken: '',
        platform: 'android'
      })
    });

    // Act
    await POST(request);

    // Assert
    expect(mockExecute).not.toHaveBeenCalled();
    expect(mockJsonWithCors).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Device token tidak valid.'
      }),
      expect.objectContaining({ status: 400 })
    );
  });

  it('should reject invalid platform', async () => {
    // Arrange
    mockGetAuthPayloadFromRequest.mockResolvedValue({
      id: 789,
      email: 'test@example.com',
      name: 'Test User'
    });

    const request = new NextRequest('http://localhost:3000/api/notifications/register', {
      method: 'POST',
      body: JSON.stringify({
        deviceToken: 'valid-token',
        platform: 'windows' // Invalid platform
      })
    });

    // Act
    await POST(request);

    // Assert
    expect(mockExecute).not.toHaveBeenCalled();
    expect(mockJsonWithCors).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Platform harus 'android' atau 'ios'."
      }),
      expect.objectContaining({ status: 400 })
    );
  });

  it('should handle authentication failure', async () => {
    // Arrange
    mockGetAuthPayloadFromRequest.mockRejectedValue(new Error('Token autentikasi tidak ditemukan.'));

    const request = new NextRequest('http://localhost:3000/api/notifications/register', {
      method: 'POST',
      body: JSON.stringify({
        deviceToken: 'test-token',
        platform: 'ios'
      })
    });

    // Act
    await POST(request);

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

    const request = new NextRequest('http://localhost:3000/api/notifications/register', {
      method: 'POST',
      body: JSON.stringify({
        deviceToken: 'test-token',
        platform: 'android'
      })
    });

    // Act
    await POST(request);

    // Assert
    expect(mockGetAuthPayloadFromRequest).not.toHaveBeenCalled();
    expect(mockExecute).not.toHaveBeenCalled();
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

  it('should trim whitespace from device token', async () => {
    // Arrange
    mockGetAuthPayloadFromRequest.mockResolvedValue({
      id: 999,
      email: 'test@example.com',
      name: 'Test User'
    });
    mockExecute.mockResolvedValue(1);

    const request = new NextRequest('http://localhost:3000/api/notifications/register', {
      method: 'POST',
      body: JSON.stringify({
        deviceToken: '  token-with-spaces  ',
        platform: 'ios'
      })
    });

    // Act
    await POST(request);

    // Assert
    expect(mockExecute).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([
        999,
        'token-with-spaces', // Should be trimmed
        'ios',
        expect.any(String),
        expect.any(String),
        expect.any(String)
      ])
    );
  });
});
