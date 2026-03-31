const MCQTest = require('../models/MCQTest');
const Job = require('../models/Job');
const AssessmentTemplate = require('../models/AssessmentTemplate');
const crypto = require('crypto');
const { BrevoClient } = require('@getbrevo/brevo');
const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');
const { getRuntimePublicUrls } = require('../utils/runtimeConfig');

// AI-powered question generation using Groq (airllm approach)
const normalizeResumeData = (resumeData, candidateName, candidateEmail, requiredSkills = []) => {
    const normalizedSkills = Array.isArray(resumeData?.skills)
        ? resumeData.skills
            .map((skill) => {
                if (!skill) {
                    return null;
                }

                if (typeof skill === 'string') {
                    return {
                        name: skill,
                        proficiency: 'Required',
                        category: 'Job Requirement'
                    };
                }

                return {
                    name: skill.name || skill.skill || skill.category || 'General',
                    proficiency: skill.proficiency || 'Intermediate',
                    category: skill.category || 'General',
                    confidence: skill.confidence
                };
            })
            .filter(Boolean)
        : [];

    const fallbackRequiredSkills = requiredSkills.map((skill) => ({
        name: skill,
        proficiency: 'Required',
        category: 'Job Requirement'
    }));

    return {
        name: resumeData?.name || candidateName || 'Candidate',
        email: resumeData?.email || candidateEmail || '',
        summary: resumeData?.summary || '',
        skills: normalizedSkills.length > 0 ? normalizedSkills : fallbackRequiredSkills,
        projects: Array.isArray(resumeData?.projects) ? resumeData.projects : [],
        experiences: Array.isArray(resumeData?.experiences) ? resumeData.experiences : []
    };
};

const generateAIQuestions = async (skills) => {
    try {
        const groq = new Groq({
            apiKey: process.env.GROQ_API_KEY
        });

        // Create a prompt for generating MCQ questions based on skills
        const skillNames = skills.map(s => s.name || s.category).join(', ');
        const prompt = `Generate 10 multiple choice questions (MCQs) for a technical assessment based on these skills: ${skillNames}.

For each question, provide:
1. The question text
2. 4 answer options (labeled A, B, C, D)
3. The correct answer index (0-3)
4. The skill it tests
5. Difficulty level (easy/medium/hard)

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "skill": "${skillNames.split(',')[0]}",
      "difficulty": "medium"
    }
  ]
}

Make questions practical, relevant to real-world scenarios, and appropriately challenging.`;

        console.log('🤖 Generating AI questions for skills:', skillNames);

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert technical interviewer who creates high-quality MCQ questions. Always respond with valid JSON only, no additional text.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama-3.3-70b-versatile', // Using Groq's powerful model
            temperature: 0.7,
            max_tokens: 2000,
        });

        const responseText = completion.choices[0]?.message?.content || '{}';
        console.log('📝 Raw AI response:', responseText.substring(0, 200) + '...');

        // Clean the response (remove markdown code blocks if present)
        let cleanedResponse = responseText.trim();
        if (cleanedResponse.startsWith('```json')) {
            cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedResponse.startsWith('```')) {
            cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
        }

        const parsed = JSON.parse(cleanedResponse);
        const questions = parsed.questions || [];

        console.log('✅ AI generated', questions.length, 'questions');

        return questions.slice(0, 10);

    } catch (error) {
        console.error('❌ AI question generation failed:', error.message);
        console.log('⚠️ Falling back to hardcoded questions');
        return null; // Will trigger fallback to hardcoded questions
    }
};

// Fallback: Generate MCQ questions based on resume skills (hardcoded)
const generateMCQQuestions = (skills) => {
    const questions = [];
    const questionBank = {
        'JavaScript': [
            { q: 'What is the output of typeof null in JavaScript?', options: ['null', 'undefined', 'object', 'number'], correct: 2 },
            { q: 'Which method is used to remove the last element from an array?', options: ['shift()', 'pop()', 'push()', 'unshift()'], correct: 1 },
            { q: 'What does === operator do in JavaScript?', options: ['Assignment', 'Loose equality', 'Strict equality', 'Comparison only'], correct: 2 }
        ],
        'Python': [
            { q: 'What is the correct way to create a function in Python?', options: ['function myFunc():', 'def myFunc():', 'create myFunc():', 'func myFunc():'], correct: 1 },
            { q: 'Which of these is a Python tuple?', options: ['[1, 2, 3]', '{1, 2, 3}', '(1, 2, 3)', '<1, 2, 3>'], correct: 2 },
            { q: 'What does len() function return?', options: ['Length of object', 'Length of string only', 'Length of list only', 'Memory size'], correct: 0 }
        ],
        'React': [
            { q: 'What is useState in React?', options: ['A component', 'A Hook', 'A library', 'A method'], correct: 1 },
            { q: 'What does JSX stand for?', options: ['JavaScript XML', 'Java Syntax Extension', 'JavaScript Extension', 'Java XML'], correct: 0 },
            { q: 'Which hook is used for side effects?', options: ['useState', 'useEffect', 'useContext', 'useReducer'], correct: 1 }
        ],
        'Node.js': [
            { q: 'What is npm?', options: ['Node Package Manager', 'Node Project Manager', 'New Package Module', 'Node Programming Method'], correct: 0 },
            { q: 'Which module is used to create a web server?', options: ['fs', 'http', 'path', 'url'], correct: 1 },
            { q: 'What does require() do?', options: ['Imports modules', 'Exports modules', 'Creates modules', 'Deletes modules'], correct: 0 }
        ]
    };

    // Add questions for each skill
    skills.forEach(skill => {
        const skillQuestions = questionBank[skill.name] || questionBank[skill.category];
        if (skillQuestions) {
            questions.push(...skillQuestions.map(q => ({
                question: q.q,
                options: q.options,
                correctAnswer: q.correct,
                skill: skill.name,
                difficulty: skill.proficiency === 'Expert' ? 'hard' : skill.proficiency === 'Advanced' ? 'medium' : 'easy'
            })));
        }
    });

    // If no specific questions, add general programming questions
    if (questions.length === 0) {
        questions.push(
            { question: 'What is the time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctAnswer: 1, skill: 'Algorithms', difficulty: 'medium' },
            { question: 'Which data structure uses LIFO?', options: ['Queue', 'Stack', 'Array', 'Linked List'], correctAnswer: 1, skill: 'Data Structures', difficulty: 'easy' },
            { question: 'What is the primary key in a database?', options: ['Unique identifier', 'Foreign key', 'Index', 'Constraint'], correctAnswer: 0, skill: 'Database', difficulty: 'easy' }
        );
    }

    return questions.slice(0, 10); // Return max 10 questions
};

const normalizeToken = (token) => typeof token === 'string' ? token.trim() : '';

const normalizeAnswerText = (value) => (value || '')
    .toString()
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const uniqueWords = (text) => Array.from(new Set(
    normalizeAnswerText(text)
        .split(' ')
        .filter((word) => word.length >= 4)
));

const evaluatePhase2Answer = (question, answer) => {
    const trimmedAnswer = (answer || '').toString().trim();

    if (!trimmedAnswer) {
        return {
            questionId: question.id,
            selectedAnswer: '',
            status: 'wrong',
            score: 0,
            matchedKeywords: [],
            expectedPoints: question.evaluationPoints || [],
            expectedApproach: question.expectedApproach || ''
        };
    }

    const keywordPool = [
        question.skill,
        question.title,
        question.expectedApproach,
        ...(Array.isArray(question.evaluationPoints) ? question.evaluationPoints : [])
    ].join(' ');

    const expectedKeywords = uniqueWords(keywordPool).slice(0, 12);
    const answerWords = uniqueWords(trimmedAnswer);
    const matchedKeywords = expectedKeywords.filter((keyword) => answerWords.includes(keyword));
    const keywordCoverage = expectedKeywords.length > 0
        ? matchedKeywords.length / expectedKeywords.length
        : 0;

    const lengthBonus = Math.min(trimmedAnswer.length / 220, 1) * 30;
    const score = Math.round(Math.min(100, keywordCoverage * 70 + lengthBonus));

    let status = 'wrong';
    if (score >= 70) {
        status = 'right';
    } else if (score >= 40) {
        status = 'partial';
    }

    return {
        questionId: question.id,
        selectedAnswer: trimmedAnswer,
        status,
        score,
        matchedKeywords,
        expectedPoints: question.evaluationPoints || [],
        expectedApproach: question.expectedApproach || ''
    };
};

// Create and send MCQ test
const createAndSendMCQTest = async (req, res) => {
    try {
        const {
            candidateEmail,
            candidateName,
            skills,
            assessmentId,
            assessmentTitle,
            requiredSkills,
            resumeData,
            recruiterId
        } = req.body;

        if (!candidateEmail || !candidateName) {
            return res.status(400).json({ message: 'Candidate email and name required' });
        }

        // Generate unique test link and token
        const testToken = crypto.randomBytes(32).toString('hex');
        
        const { backendUrl, frontendUrl } = getRuntimePublicUrls();

        if (!backendUrl || !frontendUrl) {
            return res.status(500).json({
                message: 'Deep link email setup incomplete. Set BACKEND_URL and FRONTEND_URL to the current public tunnel URLs.'
            });
        }

        const testLink = `${frontendUrl}/mcq-test/${testToken}`;
        const appRedirectLink = `${backendUrl}/open-app/${testToken}?token=${testToken}&fallback=${encodeURIComponent(testLink)}`;

        // Generate questions using AI (airllm approach with Groq)
        let questions = await generateAIQuestions(skills || []);

        // Fallback to hardcoded questions if AI fails
        if (!questions || questions.length === 0) {
            console.log('⚠️ Using fallback hardcoded questions');
            questions = generateMCQQuestions(skills || []);
        }

        // Create test record
        const mcqTest = new MCQTest({
            candidateEmail,
            candidateName,
            assessmentId,
            assessmentTitle,
            requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
            resumeData: normalizeResumeData(
                resumeData,
                candidateName,
                candidateEmail,
                Array.isArray(requiredSkills) ? requiredSkills : []
            ),
            testLink,
            testToken,
            questions,
            totalQuestions: questions.length,
            duration: questions.length * 2, // 2 minutes per question
            status: 'pending',
            recruiterId: recruiterId || null
        });

        await mcqTest.save();

        // Attempt to send email; do not fail the whole flow in dev
        let emailSent = false;
        let previewUrl;
        try {
            const result = await sendTestEmail(candidateEmail, candidateName, appRedirectLink, testLink, mcqTest.duration);
            emailSent = !!result?.emailSent;
            previewUrl = result?.previewUrl;
        } catch (e) {
            console.warn('Email send failed, continuing with link-only response:', e.message);
        }

        // Update status based on email outcome
        mcqTest.status = emailSent ? 'sent' : 'pending';
        if (emailSent) mcqTest.sentAt = new Date();
        await mcqTest.save();

        res.json({ 
            success: true, 
            emailSent,
            previewUrl,
            message: emailSent ? 'MCQ test created and email sent' : 'MCQ test created. Email not sent; use testLink',
            testId: mcqTest._id,
            testLink
        });

    } catch (error) {
        console.error('Error creating MCQ test:', error);
        res.status(500).json({ message: 'Failed to create MCQ test', error: error.message });
    }
};

// Send test email
const sendTestEmail = async (email, name, appRedirectLink, testLink, duration) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 30px; border-radius: 12px;">
            <h2 style="color: #b794f6;">Hello ${name || 'Test Candidate'},</h2>
            <p style="color: #d1d5db; font-size: 16px; line-height: 1.6;">Your MCQ assessment is ready! Click the button below to start your test.</p>

            <div style="background: #2d2d2d; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <p style="color: #d1d5db; margin: 8px 0;"><strong>Test Duration:</strong> ${duration} minutes</p>
                <p style="color: #d1d5db; margin: 8px 0;"><strong>Instructions:</strong></p>
                <ul style="color: #d1d5db; margin: 8px 0; padding-left: 20px;">
                    <li>Ensure you have a stable internet connection</li>
                    <li>Answer all questions to the best of your ability</li>
                    <li>You can navigate between questions</li>
                    <li>The test will auto-submit when time is up</li>
                </ul>
            </div>

            <a href="${appRedirectLink}"
               style="display: block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                      color: white; padding: 20px 50px; text-decoration: none; border-radius: 12px;
                      font-weight: bold; text-align: center; margin: 30px 0; font-size: 20px;
                      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);">
                Open in App
            </a>

            <a href="${testLink}"
               style="display: block; background: #2d2d2d; color: #d1d5db; padding: 16px 40px; text-decoration: none;
                      border-radius: 12px; font-weight: bold; text-align: center; margin: -10px 0 30px; font-size: 16px;
                      border: 1px solid #4b5563;">
                Open in Browser
            </a>

            <p style="text-align: center; color: #f59e0b; font-weight: bold; margin-top: 30px; font-size: 14px;">
                This link is unique to you. Do not share it with anyone.
            </p>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #2d2d2d; text-align: center;">
                <p style="color: #6b7280; font-size: 12px; margin: 5px 0;">
                    TalentLeague - Talent Assessment Platform
                </p>
                <p style="color: #6b7280; font-size: 11px; margin: 5px 0;">
                    If you have any questions, please contact support.
                </p>
            </div>
        </div>
    `;

    try {
        const brevoApiKey = process.env.BREVO_API_KEY;
        if (!brevoApiKey) {
            console.error('BREVO_API_KEY not set');
            return { emailSent: false, error: 'Email service not configured' };
        }

        const client = new BrevoClient({ apiKey: brevoApiKey });
        console.log(`Sending email to ${email} via Brevo...`);

        const result = await client.transactionalEmails.sendTransacEmail({
            sender: { name: 'TalentLeague', email: 'noreply@talentleague.dev' },
            to: [{ email }],
            subject: 'Your MCQ Test Link - TalentLeague',
            htmlContent: html
        });

        console.log('Email sent successfully:', result?.messageId);
        return { emailSent: true };
    } catch (err) {
        console.error('EMAIL SEND ERROR:', err.message, err.body || '');
        return { emailSent: false, error: err.message };
    }
};

// Verify test token
const verifyTestToken = async (req, res) => {
    try {
        const { token } = req.params;
        
        const test = await MCQTest.findOne({ testToken: token });
        
        if (!test) {
            return res.status(404).json({ message: 'Invalid test link' });
        }

        if (test.status === 'completed') {
            return res.status(400).json({ message: 'Test already completed' });
        }

        if (test.status === 'expired') {
            return res.status(400).json({ message: 'Test link expired' });
        }

        res.json({
            valid: true,
            candidateName: test.candidateName,
            candidateEmail: test.candidateEmail,
            duration: test.duration,
            totalQuestions: test.totalQuestions
        });

    } catch (error) {
        res.status(500).json({ message: 'Error verifying test', error: error.message });
    }
};

// Get test questions
const getTestQuestions = async (req, res) => {
    try {
        const { token } = req.params;
        
        const test = await MCQTest.findOne({ testToken: token });
        
        if (!test || test.status === 'completed') {
            return res.status(404).json({ message: 'Test not found or completed' });
        }

        // Update status to started
        if (test.status !== 'started') {
            test.status = 'started';
            test.startedAt = new Date();
            await test.save();
        }

        // Return questions without correct answers
        const questions = test.questions.map(q => ({
            question: q.question,
            options: q.options,
            skill: q.skill,
            difficulty: q.difficulty
        }));

        res.json({ questions, duration: test.duration });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching questions', error: error.message });
    }
};

// Submit test
const submitTest = async (req, res) => {
    try {
        const token = normalizeToken(req.params.token);
        const { answers, violations } = req.body;

        const test = await MCQTest.findOne({ testToken: token });
        
        if (!test || test.status === 'completed') {
            return res.status(404).json({ message: 'Test not found or already completed' });
        }

        // Calculate score
        let correctCount = 0;
        answers.forEach((answer, index) => {
            if (test.questions[index] && answer === test.questions[index].correctAnswer) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / test.totalQuestions) * 100);

        // Update test
        test.status = 'completed';
        test.completedAt = new Date();
        test.score = score;
        test.correctAnswers = correctCount;
        test.submittedAnswers = answers;
        test.proctoringViolations = violations || [];
        test.testPhase = 2; // Move to phase 2
        await test.save();

        res.json({
            success: true,
            score,
            correctAnswers: correctCount,
            totalQuestions: test.totalQuestions,
            testPhase: 2,
            message: 'Test submitted successfully. Proceeding to Phase 2...'
        });

    } catch (error) {
        res.status(500).json({ message: 'Error submitting test', error: error.message });
    }
};

const submitPhase2 = async (req, res) => {
    try {
        const token = normalizeToken(req.params.token);
        const { answers, questions, candidateName } = req.body;

        const test = await MCQTest.findOne({ testToken: token });
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        const questionList = Array.isArray(questions) ? questions : [];
        const evaluation = questionList.map((question) =>
            evaluatePhase2Answer(question, answers?.[question.id] || '')
        );

        const rightCount = evaluation.filter((item) => item.status === 'right').length;
        const partialCount = evaluation.filter((item) => item.status === 'partial').length;
        const wrongCount = evaluation.filter((item) => item.status === 'wrong').length;
        const averageScore = evaluation.length > 0
            ? Math.round(evaluation.reduce((sum, item) => sum + item.score, 0) / evaluation.length)
            : 0;

        test.phase2Submission = {
            candidateName: candidateName || test.candidateName,
            submittedAt: new Date().toISOString(),
            answers: answers || {},
            questions: questionList,
            evaluation,
            summary: {
                averageScore,
                rightCount,
                partialCount,
                wrongCount,
                totalQuestions: evaluation.length
            }
        };

        await test.save();

        res.json({
            success: true,
            phase2Submission: test.phase2Submission
        });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting Phase 2', error: error.message });
    }
};

// Get test result
const getTestResult = async (req, res) => {
    try {
        const { token } = req.params;
        
        const test = await MCQTest.findOne({ testToken: token });
        
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        res.json({
            candidateName: test.candidateName,
            candidateEmail: test.candidateEmail,
            score: test.score,
            correctAnswers: test.correctAnswers,
            totalQuestions: test.totalQuestions,
            status: test.status,
            testPhase: test.testPhase,
            violations: test.proctoringViolations,
            assessmentId: test.assessmentId,
            assessmentTitle: test.assessmentTitle,
            requiredSkills: test.requiredSkills || []
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching result', error: error.message });
    }
};

const getPhase2Context = async (req, res) => {
    try {
        const token = normalizeToken(req.params.token);

        const test = await MCQTest.findOne({ testToken: token });

        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }

        res.json({
            resumeData: normalizeResumeData(
                test.resumeData,
                test.candidateName,
                test.candidateEmail,
                test.requiredSkills || []
            ),
            assessmentContext: {
                id: test.assessmentId || null,
                title: test.assessmentTitle || null,
                skills: test.requiredSkills || []
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching Phase 2 context', error: error.message });
    }
};

const getAssessmentResult = async (req, res) => {
    try {
        const token = normalizeToken(req.params.token);
        const test = await MCQTest.findOne({ testToken: token }).lean();

        if (!test) {
            return res.status(404).json({ message: 'Result not found' });
        }

        const phase1Questions = Array.isArray(test.questions)
            ? test.questions.map((question, index) => ({
                question: question.question,
                options: question.options || [],
                skill: question.skill || 'General',
                difficulty: question.difficulty || 'medium',
                selectedAnswer: Array.isArray(test.submittedAnswers) ? test.submittedAnswers[index] : -1,
                correctAnswer: question.correctAnswer,
                isCorrect: Array.isArray(test.submittedAnswers)
                    ? test.submittedAnswers[index] === question.correctAnswer
                    : null
            }))
            : [];

        res.json({
            candidateName: test.candidateName,
            candidateEmail: test.candidateEmail,
            assessmentTitle: test.assessmentTitle || 'Assessment',
            requiredSkills: test.requiredSkills || [],
            phase1: {
                score: test.score || 0,
                correctAnswers: test.correctAnswers || 0,
                totalQuestions: test.totalQuestions || phase1Questions.length,
                violations: test.proctoringViolations || [],
                submittedAt: test.completedAt || test.updatedAt,
                questions: phase1Questions
            },
            phase2: test.phase2Submission || null
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assessment result', error: error.message });
    }
};

// List MCQ tests (basic)
const listMCQTests = async (req, res) => {
    try {
        const { email, recruiterId } = req.query;
        const filter = {};
        if (email) filter.candidateEmail = email;
        if (recruiterId) filter.recruiterId = recruiterId;
        const tests = await MCQTest.find(filter)
            .sort({ createdAt: -1 })
            .select('-questions.correctAnswer') // omit correct answers
            .lean();
        res.json({ count: tests.length, tests });
    } catch (error) {
        res.status(500).json({ message: 'Error listing tests', error: error.message });
    }
};

// Get Recruiter Dashboard Stats
const getRecruiterStats = async (req, res) => {
    try {
        const { recruiterId } = req.query;
        if (!recruiterId) return res.status(400).json({ message: 'recruiterId is required' });
        
        const filter = { recruiterId };

        const totalTests = await MCQTest.countDocuments(filter);
        const activeTests = await MCQTest.countDocuments({ ...filter, status: { $in: ['sent', 'started', 'pending'] } });
        const completedTests = await MCQTest.countDocuments({ ...filter, status: 'completed' });
        
        const completedResults = await MCQTest.find({ ...filter, status: 'completed' }, 'score');
        const avgScore = completedResults.length > 0
            ? Math.round(completedResults.reduce((sum, t) => sum + (t.score || 0), 0) / completedResults.length)
            : 0;

        const totalJobs = await Job.countDocuments(filter);
        const activeJobs = await Job.countDocuments({ ...filter, status: 'active' });
        const totalTemplates = await AssessmentTemplate.countDocuments(filter);

        res.json({
            totalCandidates: totalTests,
            activeTests,
            completedTests,
            avgScore: avgScore > 0 ? `${avgScore}%` : '--',
            totalJobs,
            activeJobs,
            totalTemplates
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching recruiter stats', error: error.message });
    }
};

module.exports = {
    createAndSendMCQTest,
    verifyTestToken,
    getTestQuestions,
    submitTest,
    submitPhase2,
    getTestResult,
    getPhase2Context,
    getAssessmentResult,
    listMCQTests,
    getRecruiterStats
};
