import { IssueCategory, IssueSeverity, AIClassificationResult, Issue, Coordinates } from '../types';
import { supabase } from '../lib/supabase';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

// Initialize Groq client
const groq = new Groq({
  apiKey: GROQ_API_KEY,
  dangerouslyAllowBrowser: true, // Required for React Native
});

// Category and severity mapping for prompts
const CATEGORIES: IssueCategory[] = ['roads', 'water', 'electricity', 'safety', 'sanitation'];
const SEVERITIES: IssueSeverity[] = ['low', 'medium', 'high', 'critical'];

// Category descriptions for AI
const CATEGORY_DESCRIPTIONS = {
  roads: 'Road damage, potholes, broken footpaths, traffic signal issues',
  water: 'Water leakage, contaminated water, drainage problems, flooding',
  electricity: 'Power cuts, exposed wires, broken streetlights, electrical hazards',
  safety: 'Crime, harassment, unsafe areas, lack of police patrol, dark streets',
  sanitation: 'Garbage dumping, overflowing bins, sewage issues, unclean public spaces',
};

/**
 * Classify a civic issue image using Groq AI (LLaMA vision model)
 */
export const classifyIssue = async (
  imageUrl: string | null,
  description: string
): Promise<AIClassificationResult> => {
  try {
    const prompt = `You are a civic issue classifier for Indian cities. Analyze this reported civic problem.

${imageUrl ? `Image URL: ${imageUrl}\n` : ''}User Description: "${description}"

Classify this issue into EXACTLY ONE category and ONE severity level.

Categories:
- roads: ${CATEGORY_DESCRIPTIONS.roads}
- water: ${CATEGORY_DESCRIPTIONS.water}
- electricity: ${CATEGORY_DESCRIPTIONS.electricity}
- safety: ${CATEGORY_DESCRIPTIONS.safety}
- sanitation: ${CATEGORY_DESCRIPTIONS.sanitation}

Severity Levels:
- low: Minor issue, not urgent
- medium: Needs attention within a week
- high: Requires prompt action (1-2 days)
- critical: Immediate danger to public safety

Return ONLY a valid JSON object with this exact format, no other text:
{"category": "category_here", "severity": "severity_here"}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: imageUrl ? 'llama-3.2-11b-vision-preview' : 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Parse the JSON response
    const result = JSON.parse(responseText);
    
    // Validate category
    const category = CATEGORIES.includes(result.category) 
      ? result.category 
      : 'roads';
    
    // Validate severity
    const severity = SEVERITIES.includes(result.severity)
      ? result.severity
      : 'medium';

    return { category, severity, confidence: 0.9 };
  } catch (error) {
    console.error('AI Classification error:', error);
    
    // Fallback: simple keyword matching from description
    return fallbackClassification(description);
  }
};

/**
 * Fallback classification when AI fails
 */
const fallbackClassification = (description: string): AIClassificationResult => {
  const text = description.toLowerCase();
  
  let category: IssueCategory = 'roads';
  if (text.includes('water') || text.includes('leak') || text.includes('drain')) {
    category = 'water';
  } else if (text.includes('electric') || text.includes('power') || text.includes('wire')) {
    category = 'electricity';
  } else if (text.includes('crime') || text.includes('safety') || text.includes('harass')) {
    category = 'safety';
  } else if (text.includes('garbage') || text.includes('trash') || text.includes('clean')) {
    category = 'sanitation';
  }

  let severity: IssueSeverity = 'medium';
  if (text.includes('critical') || text.includes('emergency') || text.includes('dangerous')) {
    severity = 'critical';
  } else if (text.includes('severe') || text.includes('urgent') || text.includes('immediate')) {
    severity = 'high';
  } else if (text.includes('minor') || text.includes('small') || text.includes('slight')) {
    severity = 'low';
  }

  return { category, severity, confidence: 0.5 };
};

/**
 * Generate a title from description and category
 */
export const generateTitle = (
  category: IssueCategory,
  description: string
): string => {
  const categoryPrefix: Record<IssueCategory, string> = {
    roads: 'Road Issue',
    water: 'Water Problem',
    electricity: 'Electrical Issue',
    safety: 'Safety Concern',
    sanitation: 'Sanitation Problem',
  };

  const shortDesc = description.length > 40 
    ? description.substring(0, 37) + '...' 
    : description;

  return `${categoryPrefix[category]}: ${shortDesc}`;
};

// Check for duplicate issues nearby
export const checkDuplicates = async (
  description: string,
  category: IssueCategory,
  coordinates: Coordinates
): Promise<Issue[]> => {
  try {
    // Get recent issues within 200m
    const { data: nearbyIssues } = await supabase
      .from('issues')
      .select('*')
      .eq('category', category)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    if (!nearbyIssues) return [];

    // Simple keyword matching
    const keywords = description.toLowerCase().split(' ').filter(w => w.length > 3);
    
    const duplicates = nearbyIssues.filter(issue => {
      const issueText = (issue.title + ' ' + (issue.description || '')).toLowerCase();
      const matchCount = keywords.filter(kw => issueText.includes(kw)).length;
      
      // If 3+ keywords match, consider it a duplicate
      return matchCount >= 3;
    });

    return duplicates as Issue[];
  } catch (error) {
    console.error('Duplicate check error:', error);
    return [];
  }
};