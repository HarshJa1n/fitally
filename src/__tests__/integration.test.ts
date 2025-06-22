import { dbService } from '@/lib/supabase/database'

// Simple integration tests to verify basic functionality
describe('Application Integration Tests', () => {
  
  describe('Core Services', () => {
    it('should have database service available', () => {
      expect(dbService).toBeDefined()
      expect(typeof dbService.getUserProfile).toBe('function')
      expect(typeof dbService.createHealthActivity).toBe('function')
      expect(typeof dbService.getDailyStats).toBe('function')
    })

    it('should generate content hash correctly', () => {
      const testInput = 'test content'
      const hash = dbService.generateContentHash(testInput)
      
      expect(hash).toBeDefined()
      expect(typeof hash).toBe('string')
      expect(hash.length).toBe(64) // SHA-256 hash length
    })

    it('should determine activity types correctly', () => {
      // Test exercise detection
      const exerciseAnalysis = {
        activityType: 'running' as const,
        insights: {},
        confidence: 0.9,
        tags: ['cardio'],
        timestamp: new Date().toISOString()
      }
      expect(dbService.determineActivityType(exerciseAnalysis)).toBe('exercise')

      // Test nutrition detection
      const nutritionAnalysis = {
        activityType: 'meal' as const,
        insights: {},
        nutritionalInfo: { macros: { protein: 20 } },
        confidence: 0.8,
        tags: ['nutrition'],
        timestamp: new Date().toISOString()
      }
      expect(dbService.determineActivityType(nutritionAnalysis)).toBe('nutrition')

      // Test health detection  
      const healthAnalysis = {
        activityType: 'sleep' as const,
        insights: {},
        confidence: 0.7,
        tags: ['health'],
        timestamp: new Date().toISOString()
      }
      expect(dbService.determineActivityType(healthAnalysis)).toBe('health')
    })
  })

  describe('Environment Configuration', () => {
    it('should have required environment variables for testing', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
    })
  })

  describe('Type Safety', () => {
    it('should handle undefined values safely', () => {
      const analysisWithUndefined = {
        activityType: undefined,
        confidence: 0.5,
        tags: [],
        timestamp: new Date().toISOString()
      }
      
      // Should not throw error
      expect(() => {
        const type = dbService.determineActivityType(analysisWithUndefined as any)
        expect(type).toBe('other')
      }).not.toThrow()
    })

    it('should handle empty analysis objects', () => {
      const emptyAnalysis = {
        confidence: 0,
        tags: [],
        timestamp: new Date().toISOString()
      }
      
      expect(() => {
        const type = dbService.determineActivityType(emptyAnalysis as any)
        expect(type).toBe('other')
      }).not.toThrow()
    })
  })
}) 