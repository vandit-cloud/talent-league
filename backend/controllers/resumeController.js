const pdf = require('pdf-parse');
const axios = require('axios');
require('dotenv').config();

// Hybrid AI Resume Parser - Groq + Google Gemini (Free Tier)

const analyzeResume = async (req, res) => {
    const startTime = Date.now();
    try {
        console.log('\n========================================');
        console.log('📥 Received upload request at', new Date().toISOString());
        console.log('📁 File info:', req.file ? { name: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype } : 'No file');
        
        if (!req.file) {
            console.log('❌ No file in request');
            return res.status(400).json({ message: 'No resume file uploaded' });
        }

        console.log('📄 Parsing PDF resume...');
        
        // Parse PDF to extract text
        let pdfData;
        try {
            pdfData = await pdf(req.file.buffer);
        } catch (pdfError) {
            console.error('❌ PDF parsing failed:', pdfError.message);
            return res.status(400).json({ message: 'Failed to parse PDF. Please upload a valid PDF file.' });
        }
        
        const resumeText = pdfData.text;
        
        console.log('📊 Extracted text length:', resumeText.length);
        console.log('📝 First 300 chars:', resumeText.substring(0, 300));
        
        if (resumeText.length < 50) {
            console.log('❌ PDF text too short or empty');
            return res.status(400).json({ message: 'PDF appears to be empty or scanned image. Please upload a text-based PDF.' });
        }
        
        // Step 1: Fast extraction with Groq (Llama 3) - FREE
        console.log('\n⚡ Step 1: Fast parsing with Groq (Llama 3)...');
        let groqData = null;
        let groqConfidence = 0;
        let groqError = null;
        
        try {
            groqData = await getGroqAnalysis(resumeText);
            groqConfidence = calculateConfidence(groqData);
            console.log('✅ Groq success - Confidence:', groqConfidence);
        } catch (error) {
            groqError = error;
            console.log('⚠️ Groq failed:', error.message);
            if (error.response) {
                console.log('   Status:', error.response.status);
                console.log('   Data:', JSON.stringify(error.response.data).substring(0, 200));
            }
        }
        
        // Step 2: If Groq fails or low confidence, use Google Gemini - FREE
        let finalData = groqData;
        let aiSource = 'Groq (Llama 3)';
        let geminiEnhanced = false;
        let geminiError = null;
        
        if (!groqData || groqConfidence < 0.7) {
            console.log('\n🔍 Step 2: Using Google Gemini (backup)...');
            try {
                const geminiData = await getGeminiAnalysis(resumeText);
                
                // Merge: Use best data from both
                finalData = mergeResults(groqData, geminiData);
                aiSource = 'Groq + Gemini (Hybrid)';
                geminiEnhanced = true;
                console.log('✅ Gemini enhancement applied');
            } catch (error) {
                geminiError = error;
                console.log('⚠️ Gemini failed:', error.message);
                if (error.response) {
                    console.log('   Status:', error.response.status);
                    console.log('   Data:', JSON.stringify(error.response.data).substring(0, 200));
                }
                if (!groqData) {
                    console.log('\n❌ Both free AI models failed');
                    console.log('   Groq error:', groqError?.message);
                    console.log('   Gemini error:', geminiError?.message);
                    return res.status(500).json({ 
                        message: 'Both AI models failed. Please check your API keys.',
                        details: {
                            groq: groqError?.message,
                            gemini: geminiError?.message
                        }
                    });
                }
            }
        }
        
        // Step 3: Generate test questions based on skills and projects
        console.log('\n🎯 Step 3: Generating assessment questions...');
        try {
            finalData.assessmentQuestions = await generateTestQuestions(finalData);
            console.log('✅ Generated', finalData.assessmentQuestions.length, 'questions');
        } catch (qError) {
            console.log('⚠️ Question generation failed:', qError.message);
            finalData.assessmentQuestions = [];
        }
        
        finalData.aiConfidence = geminiEnhanced ? 0.92 : groqConfidence;
        finalData.aiSource = aiSource;
        finalData.parsedAt = new Date().toISOString();

        const processingTime = Date.now() - startTime;
        console.log('\n✅ Resume analysis complete in', processingTime, 'ms');
        console.log('📊 Results:', finalData.skills?.length || 0, 'skills,', 
                    finalData.projects?.length || 0, 'projects,',
                    finalData.experiences?.length || 0, 'experiences');
        console.log('========================================\n');
        
        res.json(finalData);

    } catch (err) {
        console.error('\n❌ Resume Analysis Error:', err);
        console.error('Stack:', err.stack);
        res.status(500).json({ message: err.message || 'Error parsing resume' });
    }
};

// Get AI analysis from Groq (FREE - Llama 3)
async function getGroqAnalysis(resumeText) {
    const apiKey = process.env.GROQ_API_KEY;
    console.log('🔑 Groq API Key check:', apiKey ? `Present (${apiKey.substring(0, 10)}...)` : 'MISSING');
    
    if (!apiKey) {
        throw new Error('Groq API key not configured. Get free key at https://console.groq.com');
    }
    
    console.log('🤖 Calling Groq API (Llama 3)...');
    try {
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: 'You are an expert resume parser. Extract information accurately and return valid JSON only.' },
                { role: 'user', content: createFastResumePrompt(resumeText) }
            ],
            temperature: 0.1,
            max_tokens: 4000
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        let aiResponse = response.data.choices[0].message.content;
        console.log('📝 Groq raw response:', aiResponse.substring(0, 500));
        
        aiResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
        
        const parsed = JSON.parse(aiResponse);
        validateParsedData(parsed);
        
        console.log('✅ Groq extracted:', parsed.skills?.length || 0, 'skills');
        return parsed;
    } catch (error) {
        console.error('❌ Groq Error:', error.response?.data || error.message);
        throw error;
    }
}

// Get AI analysis from Google Gemini (FREE)
async function getGeminiAnalysis(resumeText) {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('🔑 Gemini API Key check:', apiKey ? `Present (${apiKey.substring(0, 10)}...)` : 'MISSING');
    
    if (!apiKey) {
        throw new Error('Gemini API key not configured. Get free key at https://makersuite.google.com/app/apikey');
    }
    
    console.log('🤖 Calling Google Gemini API...');
    try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            contents: [{
                parts: [{
                    text: createFastResumePrompt(resumeText)
                }]
            }],
            generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 4000
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        let aiResponse = response.data.candidates[0].content.parts[0].text;
        console.log('📝 Gemini raw response:', aiResponse.substring(0, 500));
        
        aiResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
        
        const parsed = JSON.parse(aiResponse);
        validateParsedData(parsed);
        
        console.log('✅ Gemini extracted:', parsed.skills?.length || 0, 'skills');
        return parsed;
    } catch (error) {
        console.error('❌ Gemini Error:', error.response?.data || error.message);
        throw error;
    }
}

// Calculate confidence score based on data completeness
function calculateConfidence(data) {
    if (!data) return 0;
    
    let score = 0;
    let total = 0;
    
    // Check basic fields (30%)
    if (data.name && data.name.length > 2) score += 10;
    if (data.email && data.email.includes('@')) score += 10;
    if (data.phone && data.phone.length > 8) score += 10;
    total += 30;
    
    // Check skills (30%)
    if (data.skills && data.skills.length >= 5) score += 30;
    else if (data.skills && data.skills.length > 0) score += (data.skills.length * 5);
    total += 30;
    
    // Check projects (20%)
    if (data.projects && data.projects.length >= 2) score += 20;
    else if (data.projects && data.projects.length > 0) score += (data.projects.length * 10);
    total += 20;
    
    // Check experience (20%)
    if (data.experiences && data.experiences.length >= 1) score += 20;
    total += 20;
    
    return score / total;
}

// Merge results from OpenAI and Claude
function mergeResults(openAIData, claudeData) {
    if (!openAIData) return claudeData;
    if (!claudeData) return openAIData;
    
    return {
        // Use OpenAI for basic info (faster, more accurate for simple fields)
        name: openAIData.name || claudeData.name,
        email: openAIData.email || claudeData.email,
        phone: openAIData.phone || claudeData.phone,
        location: openAIData.location || claudeData.location,
        linkedin: openAIData.linkedin || claudeData.linkedin,
        
        // Use Claude for complex analysis (better at understanding context)
        summary: claudeData.summary || openAIData.summary,
        skills: mergeSkills(openAIData.skills, claudeData.skills),
        experiences: claudeData.experiences?.length > 0 ? claudeData.experiences : openAIData.experiences,
        projects: claudeData.projects?.length > 0 ? claudeData.projects : openAIData.projects,
        education: claudeData.education?.length > 0 ? claudeData.education : openAIData.education
    };
}

// Merge skills from both sources
function mergeSkills(openAISkills, claudeSkills) {
    const skillMap = new Map();
    
    // Add OpenAI skills
    (openAISkills || []).forEach(skill => {
        const name = typeof skill === 'string' ? skill : skill.name;
        skillMap.set(name.toLowerCase(), { name, source: 'openai' });
    });
    
    // Add/Enhance with Claude skills
    (claudeSkills || []).forEach(skill => {
        const name = typeof skill === 'string' ? skill : skill.name;
        const key = name.toLowerCase();
        if (skillMap.has(key)) {
            skillMap.set(key, { ...skillMap.get(key), ...skill, source: 'both' });
        } else {
            skillMap.set(key, { name, source: 'claude' });
        }
    });
    
    return Array.from(skillMap.values());
}

// Generate test questions based on resume
async function generateTestQuestions(data) {
    const questions = [];
    
    // Technical questions based on skills
    const technicalSkills = (data.skills || [])
        .filter(s => ['Programming', 'Framework', 'Database', 'Cloud', 'AI/ML'].includes(s.category))
        .slice(0, 5);
    
    technicalSkills.forEach((skill, idx) => {
        questions.push({
            id: `tech_${idx + 1}`,
            type: 'technical',
            skill: skill.name,
            question: `Explain your experience with ${skill.name}. What projects have you built using it?`,
            difficulty: skill.proficiency === 'Expert' ? 'hard' : skill.proficiency === 'Intermediate' ? 'medium' : 'easy'
        });
    });
    
    // Project-based questions
    (data.projects || []).slice(0, 3).forEach((project, idx) => {
        questions.push({
            id: `proj_${idx + 1}`,
            type: 'project',
            project: project.name,
            question: `Describe your role in ${project.name}. What challenges did you face and how did you solve them?`,
            difficulty: 'medium'
        });
    });
    
    // Experience-based questions
    (data.experiences || []).slice(0, 2).forEach((exp, idx) => {
        questions.push({
            id: `exp_${idx + 1}`,
            type: 'experience',
            company: exp.company,
            question: `At ${exp.company}, what was your most significant contribution as a ${exp.role}?`,
            difficulty: 'hard'
        });
    });
    
    return questions;
}

// Fast parsing prompt for OpenAI
function createFastResumePrompt(resumeText) {
    return `You are an expert resume analyzer. Analyze this resume deeply and extract information with REALISTIC assessments.

Analyze each project and rate 1-10 based on:
- Complexity (technologies, architecture, features)
- Scope (modules, scale, integrations)
- Impact (users, performance, business value)
- Quality (testing, docs, best practices)

For skills, determine proficiency (Beginner/Intermediate/Advanced/Expert) based on:
- Years of experience with the skill
- Number of projects using it
- Depth of usage mentioned
- Complexity of implementations

Return this JSON structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "location": "City, State",
  "linkedin": "linkedin url or null",
  "github": "github url or null",
  "summary": "brief professional summary",
  "skills": [
    {
      "name": "Skill Name",
      "proficiency": "Beginner|Intermediate|Advanced|Expert",
      "category": "Programming|Framework|Database|Cloud|Tool|Soft Skill",
      "confidence": 0.85
    }
  ],
  "experiences": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2020 - Present",
      "description": "brief description",
      "achievements": ["achievement1"]
    }
  ],
  "internships": [
    {
      "company": "Company Name",
      "role": "Intern Role",
      "duration": "3 months",
      "description": "what you did",
      "technologies": ["Tech1", "Tech2"],
      "rating": 7,
      "ratingReason": "Justification with points"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "what the project does",
      "technologies": ["Tech1", "Tech2"],
      "complexity": "Low|Medium|High",
      "rating": 7,
      "ratingReason": "Justification with points",
      "impact": "measurable impact",
      "duration": "3 months"
    }
  ],
  "achievements": [
    {
      "title": "Achievement Title",
      "description": "what you achieved",
      "year": "2023"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "year": "2020-2024"
    }
  ]
}

CRITICAL RATING INSTRUCTIONS - YOU MUST FOLLOW EXACTLY:

For EACH project, calculate rating by counting points:

COMPLEXITY POINTS:
- +3 points: Full-stack (frontend + backend + database)
- +2 points: Multiple advanced technologies (5+)
- +1 point: API integrations, authentication, or cloud deployment
- +0 points: Simple frontend only or basic CRUD

SCOPE POINTS:
- +3 points: Multiple modules/features described in detail
- +2 points: Real-world problem with clear solution
- +1 point: Basic functionality working
- +0 points: Very limited scope

IMPACT POINTS:
- +2 points: Quantified results (users, performance %, revenue)
- +1 point: Mentioned positive outcomes
- +0 points: No impact mentioned

QUALITY POINTS:
- +2 points: Testing, documentation, or CI/CD mentioned
- +1 point: Clean code practices or architecture mentioned
- +0 points: No quality indicators

TOTAL = sum of points (max 10). Be STRICT - most student projects score 4-6.

ratingReason MUST explain the specific points: "Full-stack (+3), 6 technologies (+2), authentication (+1), real-world problem (+2), no testing (-0) = 8/10"

Resume Text:
${resumeText.substring(0, 6000)}

Return ONLY valid JSON. Calculate ratings EXACTLY as specified above.`;
}

// Deep analysis prompt for Claude
function createDeepResumePrompt(resumeText) {
    return `You are an expert resume analyzer. Extract detailed information and return ONLY valid JSON.

Extract these fields with high accuracy:
- name: Full name exactly as written
- email: Email address
- phone: Phone number exactly as written
- location: City, state/country
- linkedin: LinkedIn URL
- summary: Professional summary (2-3 sentences)
- skills: Array of {name, proficiency (Beginner/Intermediate/Expert), category}
  Categories: Programming, Frontend, Backend, Database, Cloud/DevOps, AI/ML, Mobile, Testing, Tools
- experiences: Array of {company, role, duration, description, achievements}
- projects: Array of {name, description, technologies, role, duration}
- education: Array of {degree, institution, year, gpa}

For skills, analyze the resume deeply to determine proficiency levels based on:
- Years of experience mentioned
- Context of usage in projects
- Depth of knowledge demonstrated

Resume Text:
${resumeText.substring(0, 8000)}

Return ONLY valid JSON. No markdown, no explanations.`;
}

// Validate and format parsed data
function validateParsedData(parsed) {
    // Format skills - ensure they have all required fields
    if (!parsed.skills) parsed.skills = [];
    parsed.skills = parsed.skills.map((skill, index) => {
        if (typeof skill === 'string') {
            return {
                name: skill,
                proficiency: 'Intermediate',
                category: 'Technical',
                source: 'Inferred',
                confidence: 0.8
            };
        }
        return {
            name: skill.name || skill.skill || 'Unknown Skill',
            proficiency: skill.proficiency || 'Intermediate',
            category: skill.category || 'Technical',
            source: skill.source || 'Inferred',
            confidence: skill.confidence || 0.8
        };
    });
    
    // Format projects - calculate REAL ratings based on actual content
    if (!parsed.projects) parsed.projects = [];
    parsed.projects = parsed.projects.map((project, index) => {
        const calculated = calculateProjectRating(project);
        // Use AI rating if provided and reasonable, otherwise use calculated
        const aiRating = parseInt(project.rating);
        const useAiRating = aiRating && aiRating >= 1 && aiRating <= 10 && project.ratingReason;
        
        return {
            name: project.name || project.title || 'Unnamed Project',
            description: project.description || '',
            technologies: project.technologies || project.techStack || [],
            complexity: calculated.label, // Always use calculated complexity
            rating: useAiRating ? aiRating : calculated.rating,
            ratingReason: useAiRating ? project.ratingReason : calculated.reason,
            impact: project.impact || '',
            duration: project.duration || ''
        };
    });
    
    // Format internships with REAL ratings
    if (!parsed.internships) parsed.internships = [];
    parsed.internships = parsed.internships.map((internship, index) => {
        const calculated = calculateProjectRating(internship);
        const aiRating = parseInt(internship.rating);
        const useAiRating = aiRating && aiRating >= 1 && aiRating <= 10 && internship.ratingReason;
        
        return {
            company: internship.company || 'Unknown Company',
            role: internship.role || 'Intern',
            duration: internship.duration || '',
            description: internship.description || '',
            technologies: internship.technologies || [],
            rating: useAiRating ? aiRating : calculated.rating,
            ratingReason: useAiRating ? internship.ratingReason : calculated.reason
        };
    });
    
    // Format achievements
    if (!parsed.achievements) parsed.achievements = [];
    parsed.achievements = parsed.achievements.map((achievement, index) => {
        if (typeof achievement === 'string') {
            return {
                title: achievement,
                description: '',
                year: ''
            };
        }
        return {
            title: achievement.title || 'Achievement',
            description: achievement.description || '',
            year: achievement.year || ''
        };
    });
    
    if (!parsed.experiences) parsed.experiences = [];
    if (!parsed.education) parsed.education = [];
    if (!parsed.github) parsed.github = null;
    return parsed;
}

// Calculate project rating (1-10) based on actual project attributes
function calculateProjectRating(project) {
    let score = 0;
    let reasons = [];
    
    // COMPLEXITY POINTS
    const techs = project.technologies || project.techStack || [];
    const desc = (project.description || '').toLowerCase();
    
    // Full-stack detection
    const hasFrontend = desc.includes('react') || desc.includes('vue') || desc.includes('angular') || desc.includes('frontend') || desc.includes('ui') || desc.includes('html');
    const hasBackend = desc.includes('node') || desc.includes('express') || desc.includes('django') || desc.includes('flask') || desc.includes('backend') || desc.includes('api');
    const hasDatabase = desc.includes('database') || desc.includes('mongodb') || desc.includes('mysql') || desc.includes('postgres') || desc.includes('firebase');
    
    if (hasFrontend && hasBackend && hasDatabase) {
        score += 3;
        reasons.push('Full-stack (+3)');
    } else if (hasFrontend && hasBackend) {
        score += 2;
        reasons.push('Frontend+Backend (+2)');
    } else if (hasFrontend || hasBackend) {
        score += 1;
        reasons.push('Single tier (+1)');
    }
    
    // Technology count
    if (techs.length >= 5) {
        score += 2;
        reasons.push(`${techs.length} technologies (+2)`);
    } else if (techs.length >= 3) {
        score += 1;
        reasons.push(`${techs.length} technologies (+1)`);
    }
    
    // Advanced features
    if (desc.includes('authentication') || desc.includes('login') || desc.includes('auth')) {
        score += 1;
        reasons.push('Authentication (+1)');
    }
    if (desc.includes('deploy') || desc.includes('cloud') || desc.includes('aws') || desc.includes('vercel')) {
        score += 1;
        reasons.push('Deployment (+1)');
    }
    
    // SCOPE POINTS
    const featureCount = (desc.match(/\b(feature|module|page|component|function)\b/g) || []).length;
    if (featureCount >= 4) {
        score += 3;
        reasons.push('Multiple features (+3)');
    } else if (featureCount >= 2) {
        score += 2;
        reasons.push('Some features (+2)');
    } else if (desc.length > 50) {
        score += 1;
        reasons.push('Basic scope (+1)');
    }
    
    // IMPACT POINTS
    if (desc.includes('user') || desc.includes('customer') || desc.includes('client')) {
        score += 1;
        reasons.push('Real users (+1)');
    }
    if (/\d+%/.test(desc) || desc.includes('improved') || desc.includes('increased') || desc.includes('reduced')) {
        score += 1;
        reasons.push('Quantified impact (+1)');
    }
    
    // QUALITY POINTS
    if (desc.includes('test') || desc.includes('testing')) {
        score += 1;
        reasons.push('Testing (+1)');
    }
    if (desc.includes('document')) {
        score += 1;
        reasons.push('Documentation (+1)');
    }
    
    // Ensure minimum score for any project
    if (score === 0 && desc.length > 20) score = 3;
    
    // Cap at 10
    score = Math.min(score, 10);
    
    // Determine label
    let label = 'Medium';
    if (score >= 8) label = 'High';
    else if (score <= 4) label = 'Low';
    
    const reasonText = reasons.length > 0 ? reasons.join(', ') + ` = ${score}/10` : `Score: ${score}/10`;
    
    return { rating: score, label, reason: reasonText };
}

module.exports = {
    analyzeResume
};
