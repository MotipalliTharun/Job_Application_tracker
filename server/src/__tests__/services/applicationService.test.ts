import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Application } from '../../models/Application.js';

// Create mock functions that will be used in the mock
const mockLoadApplicationsFn = jest.fn();
const mockSaveApplicationsFn = jest.fn();

// Mock the excelService BEFORE importing the service
jest.mock('../../services/excelService.js', () => {
  return {
    loadApplications: jest.fn(),
    saveApplications: jest.fn(),
  };
});

// Import after mocking
import { getAllApplications, createApplicationsFromLinks, updateApplication, softDeleteApplication, hardDeleteApplication } from '../../services/applicationService.js';
import { loadApplications, saveApplications } from '../../services/excelService.js';

// Cast to any to access mock methods
const mockLoadApplications = loadApplications as any;
const mockSaveApplications = saveApplications as any;

describe('Application Service', () => {
  const mockApplications: Application[] = [
    {
      id: '1',
      url: 'https://example.com/job1',
      linkTitle: 'Job 1',
      company: 'Example Corp',
      roleTitle: 'Software Engineer',
      location: 'Remote',
      status: 'TODO',
      priority: 'MEDIUM',
      notes: 'Test notes',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllApplications', () => {
    it('should return all applications', async () => {
      mockLoadApplications.mockResolvedValue(mockApplications);
      const result = await getAllApplications();
      expect(result).toEqual(mockApplications);
    });

    it('should create dummy application when none exist', async () => {
      mockLoadApplications.mockResolvedValue([]);
      mockSaveApplications.mockResolvedValue(undefined);
      
      const result = await getAllApplications();
      
      expect(result.length).toBe(1);
      expect(result[0].url).toBe('https://example.com/job-posting');
      expect(mockSaveApplications).toHaveBeenCalled();
    });
  });

  describe('createApplicationsFromLinks', () => {
    it('should create applications from URLs', async () => {
      mockLoadApplications.mockResolvedValue([]);
      mockSaveApplications.mockResolvedValue(undefined);
      
      const links = ['https://example.com/job1', 'https://example.com/job2'];
      const result = await createApplicationsFromLinks(links);
      
      expect(result.length).toBe(2);
      expect(mockSaveApplications).toHaveBeenCalled();
    });

    it('should handle "Title|URL" format', async () => {
      mockLoadApplications.mockResolvedValue([]);
      mockSaveApplications.mockResolvedValue(undefined);
      
      const links = ['Software Engineer|https://example.com/job'];
      const result = await createApplicationsFromLinks(links);
      
      expect(result.length).toBe(1);
      expect(result[0].linkTitle).toBe('Software Engineer');
      expect(result[0].url).toBe('https://example.com/job');
    });

    it('should skip duplicate URLs', async () => {
      mockLoadApplications.mockResolvedValue([mockApplications[0]]);
      mockSaveApplications.mockResolvedValue(undefined);
      
      const links = ['https://example.com/job1', 'https://example.com/job2'];
      const result = await createApplicationsFromLinks(links);
      
      expect(result.length).toBe(1); // Only job2 should be added
      expect(result[0].url).toBe('https://example.com/job2');
    });
  });

  describe('updateApplication', () => {
    it('should update an existing application', async () => {
      mockLoadApplications.mockResolvedValue(mockApplications);
      mockSaveApplications.mockResolvedValue(undefined);
      
      const result = await updateApplication('1', { company: 'New Company' });
      
      expect(result.company).toBe('New Company');
      expect(mockSaveApplications).toHaveBeenCalled();
    });

    it('should auto-set appliedDate when status changes to APPLIED', async () => {
      mockLoadApplications.mockResolvedValue(mockApplications);
      mockSaveApplications.mockResolvedValue(undefined);
      
      const result = await updateApplication('1', { status: 'APPLIED' });
      
      expect(result.status).toBe('APPLIED');
      expect(result.appliedDate).toBeDefined();
    });

    it('should throw error if application not found', async () => {
      mockLoadApplications.mockResolvedValue(mockApplications);
      
      await expect(updateApplication('999', { company: 'Test' })).rejects.toThrow('not found');
    });
  });

  describe('softDeleteApplication', () => {
    it('should archive an application', async () => {
      mockLoadApplications.mockResolvedValue(mockApplications);
      mockSaveApplications.mockResolvedValue(undefined);
      
      const result = await softDeleteApplication('1');
      
      expect(result.status).toBe('ARCHIVED');
      expect(mockSaveApplications).toHaveBeenCalled();
    });
  });

  describe('hardDeleteApplication', () => {
    it('should permanently delete an application', async () => {
      mockLoadApplications.mockResolvedValue(mockApplications);
      mockSaveApplications.mockResolvedValue(undefined);
      
      await hardDeleteApplication('1');
      
      expect(mockSaveApplications).toHaveBeenCalled();
      // Verify it was called with filtered array (without the deleted app)
      const callArgs = mockSaveApplications.mock.calls[0][0];
      expect(callArgs).toEqual([]);
    });
  });
});
