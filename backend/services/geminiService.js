const { GoogleGenerativeAI } = require("@google/generative-ai");
const Activity = require("../models/activity");

// Cache storage
const recommendationCache = new Map();

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
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
      
      // Generate content
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
        activitySuggestions: []
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

    return `
      Analyze this user's environmental activities and provide recommendations:

      USER ACTIVITY SUMMARY:
      - Total activities: ${activities.length}
      - Positive activities: ${positiveActivities.length}
      - Negative activities: ${negativeActivities.length}
      - Total eco-score: ${totalScore}
      
      ACTIVITIES BY CATEGORY:
      ${Object.entries(activitiesByCategory).map(([category, acts]) => `
        ${category}: ${acts.length} activities
      `).join('')}

      RECENT ACTIVITIES (last 10):
      ${activities.slice(0, 10).map(a => `
        - ${a.activityName} (${a.points} points, ${a.category})
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
}

module.exports = new GeminiService();