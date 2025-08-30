const { GoogleGenerativeAI } = require("@google/generative-ai");
const Activity = require("../models/activity");

// Cache storage
const recommendationCache = new Map();

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  // Add this method to clear cache for a specific user
  clearCacheForUser(userId) {
    const cacheKey = `recommendations:${userId}`;
    recommendationCache.delete(cacheKey);
    console.log('🤖 Cleared recommendations cache for user:', userId);
  }

  async generateRecommendations(userId) {
    try {
      // Check if we have a cached result that's less than an hour old
      const cacheKey = `recommendations:${userId}`;
      const cachedData = recommendationCache.get(cacheKey);
      
      if (cachedData && (Date.now() - cachedData.timestamp) < 60 * 60 * 1000) {
        console.log('🤖 Returning cached recommendations for user:', userId);
        return cachedData.recommendations;
      }

      // Get user activities
      const activities = await Activity.find({ userId }).sort({ date: -1 }).limit(50);
      
      if (activities.length === 0) {
        const result = {
          generalAdvice: "Start logging your eco-activities to get personalized recommendations!",
          activitySuggestions: []
        };
        
        // Cache even empty results
        recommendationCache.set(cacheKey, {
          timestamp: Date.now(),
          recommendations: result
        });
        
        return result;
      }

      // Prepare prompt for Gemini
      const prompt = this.createPrompt(activities);
      
      // Generate content with retry logic for overloaded API
      let retries = 3;
      let lastError;
      
      while (retries > 0) {
        try {
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          // Parse the response
          const recommendations = this.parseGeminiResponse(text);
          
          // Cache the result with timestamp
          recommendationCache.set(cacheKey, {
            timestamp: Date.now(),
            recommendations
          });
          
          console.log('🤖 New recommendations generated and cached for user:', userId);
          return recommendations;
        } catch (error) {
          lastError = error;
          retries--;
          
          if (error.status === 503 && retries > 0) {
            console.log(`🤖 API overloaded, retrying in ${(4 - retries) * 2} seconds...`);
            await new Promise(resolve => setTimeout(resolve, (4 - retries) * 2000));
          } else {
            throw error;
          }
        }
      }
      
      throw lastError;
      
    } catch (error) {
      console.error('Error generating Gemini recommendations:', error);
      
      // Try to return cached data even if it's stale when API fails
      const cacheKey = `recommendations:${userId}`;
      const cachedData = recommendationCache.get(cacheKey);
      
      if (cachedData) {
        console.log('🤖 API failed, returning stale cached recommendations for user:', userId);
        return cachedData.recommendations;
      }
      
      // Fallback if no cache exists
      return {
        generalAdvice: "We're having trouble generating recommendations right now. Keep tracking your eco-activities!",
        activitySuggestions: [
          { activityName: "Use reusable shopping bags", points: 3, category: "Shopping", emoji: "🛍️" },
          { activityName: "Meal prep to reduce food waste", points: 4, category: "Food", emoji: "🍲" },
          { activityName: "Set thermostat 1 degree lower", points: 2, category: "Energy", emoji: "🌡️" }
        ]
      };
    }
  }

  createPrompt(activities) {
    // Group activities by category for better analysis
    const activitiesByCategory = {};
    activities.forEach(activity => {
      const category = activity.category || 'General';
      if (!activitiesByCategory[category]) {
        activitiesByCategory[category] = [];
      }
      activitiesByCategory[category].push(activity);
    });

    // Calculate some basic stats
    const positiveActivities = activities.filter(a => a.points > 0);
    const negativeActivities = activities.filter(a => a.points < 0);
    const totalScore = activities.reduce((sum, a) => sum + a.points, 0);
    
    // Calculate total carbon emissions
    const totalCarbon = activities.reduce((sum, a) => sum + (a.carbonEmission || 0), 0);

    return `
      Analyze this user's environmental activities and provide recommendations:

      USER ACTIVITY SUMMARY:
      - Total activities: ${activities.length}
      - Positive activities: ${positiveActivities.length}
      - Negative activities: ${negativeActivities.length}
      - Total eco-score: ${totalScore}
      - Net carbon impact: ${totalCarbon.toFixed(2)} kg CO₂e

      ACTIVITIES BY CATEGORY:
      ${Object.entries(activitiesByCategory).map(([category, acts]) => `
        ${category}: ${acts.length} activities
      `).join('')}

      RECENT ACTIVITIES (last 10):
      ${activities.slice(0, 10).map(a => `
        - ${a.activityName} (${a.points} points, ${a.category}, ${a.carbonEmission >= 0 ? '+' : ''}${a.carbonEmission.toFixed(2)} kg CO₂e)
      `).join('')}

      Please provide:
      1. 2-3 specific, actionable recommendations to reduce carbon emissions based on their activity patterns
      2. 3-5 suggested activities they could pin to their dashboard, formatted as:
        [Activity Name]|[Points]|[Category]|[Emoji]
        
      Format your response as:
      ADVICE:
      [Your advice here, with each recommendation on a new line]
      
      SUGGESTIONS:
      [Activity 1 Name]|[Points]|[Category]|[Emoji]
      [Activity 2 Name]|[Points]|[Category]|[Emoji]
      [Activity 3 Name]|[Points]|[Category]|[Emoji]
    `;
  }

  parseGeminiResponse(text) {
    const lines = text.split('\n');
    let currentSection = null;
    const result = {
      generalAdvice: '',
      activitySuggestions: []
    };

    for (const line of lines) {
      if (line.startsWith('ADVICE:')) {
        currentSection = 'advice';
        result.generalAdvice = line.replace('ADVICE:', '').trim();
      } else if (line.startsWith('SUGGESTIONS:')) {
        currentSection = 'suggestions';
      } else if (currentSection === 'advice' && line.trim()) {
        result.generalAdvice += '\n' + line.trim();
      } else if (currentSection === 'suggestions' && line.trim() && line.includes('|')) {
        const [activityName, points, category, emoji] = line.split('|').map(s => s.trim());
        if (activityName && points && category) {
          result.activitySuggestions.push({
            activityName,
            points: parseInt(points),
            category,
            emoji: emoji || '🌱'
          });
        }
      }
    }

    return result;
  }
  
  getCacheStatus(userId) {
    const cacheKey = `recommendations:${userId}`;
    const cachedData = recommendationCache.get(cacheKey);
    
    if (!cachedData) {
      return { 
        hasCache: false,
        message: 'No cached recommendations found for this user'
      };
    }
    
    const ageInMinutes = Math.floor((Date.now() - cachedData.timestamp) / (60 * 1000));
    const expiresInMinutes = 60 - ageInMinutes;
    
    return {
      hasCache: true,
      cacheAge: `${ageInMinutes} minutes`,
      expiresIn: `${expiresInMinutes} minutes`,
      willRefresh: expiresInMinutes <= 0
    };
  } 
}

module.exports = new GeminiService();