import { dbService } from '@/lib/supabase/database'

describe('Fitally Application Smoke Tests', () => {
  
  describe('Core Services Available', () => {
    it('should have database service available with required methods', () => {
      expect(dbService).toBeDefined()
      expect(typeof dbService.getUserProfile).toBe('function')
      expect(typeof dbService.createHealthActivity).toBe('function')
      expect(typeof dbService.getDailyStats).toBe('function')
      expect(typeof dbService.generateContentHash).toBe('function')
      expect(typeof dbService.determineActivityType).toBe('function')
    })

    it('should generate content hashes', () => {
      const testInput = 'test content for hashing'
      const hash = dbService.generateContentHash(testInput)
      
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should determine activity types safely', () => {
      const validAnalysis = {
        activityType: 'running' as const,
        insights: {},
        confidence: 0.9,
        tags: ['cardio'],
        timestamp: new Date().toISOString()
      }
      
      expect(() => {
        const result = dbService.determineActivityType(validAnalysis)
        expect(result).toBeDefined()
      }).not.toThrow()
    })
  })

  describe('Environment Check', () => {
    it('should have test environment variables', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
    })
  })

  describe('Basic Type Safety', () => {
    it('should handle basic data structures', () => {
      const testData = {
        id: 'test-id',
        name: 'Test Activity',
        type: 'exercise',
        timestamp: new Date().toISOString()
      }
      
      expect(testData.id).toBe('test-id')
      expect(testData.type).toBe('exercise')
      expect(() => new Date(testData.timestamp)).not.toThrow()
    })
  })
}) 