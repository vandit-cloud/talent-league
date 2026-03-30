import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Copy, 
  Brain, 
  Settings, 
  Target, 
  Search,
  Edit,
  Trash2,
  X,
  ChevronRight,
  Users,
  BarChart3,
  FileText,
  Code,
  Database,
  Globe,
  Shield,
  Heart
} from 'lucide-react';

interface AssessmentTemplate {
  _id: string;
  name: string;
  type: 'scratch' | 'clone' | 'ai-generated';
  role: string;
  skills: string[];
  rounds: number;
  weightage: Record<string, number>;
  minScore: number;
  companyFocus: string[];
  createdAt: string;
  status: 'draft' | 'active' | 'archived';
}

interface Question {
  id: string;
  text: string;
  skill: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'multiple-choice' | 'coding' | 'practical' | 'behavioral';
  points: number;
  timeLimit: number;
  isCustom: boolean;
  analytics: {
    attempts: number;
    successRate: number;
    avgTime: number;
  };
}

interface Skill {
  name: string;
  category: string;
  weightage: number;
  isMandatory: boolean;
  questions: number;
  avgDifficulty: number;
}

export default function AssessmentManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'creation' | 'customization'>('creation');
  const [assessments, setAssessments] = useState<AssessmentTemplate[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSkill, setFilterSkill] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [newAssessment, setNewAssessment] = useState({
    name: '',
    role: '',
    rounds: 1,
    minScore: 70,
    skills: [] as string[]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/assessment-templates?recruiterId=${user?._id}`);
        setAssessments(res.data);
        
        // Load fallback mock for skills/questions if needed, or keep empty
        setSkills([
          { name: 'React', category: 'Frontend', weightage: 30, isMandatory: true, questions: 45, avgDifficulty: 3.2 },
          { name: 'TypeScript', category: 'Frontend', weightage: 25, isMandatory: true, questions: 32, avgDifficulty: 2.8 }
        ]);
        
        setQuestions([
          {
            id: '1',
            text: 'Implement a React component with hooks',
            skill: 'React',
            difficulty: 'Medium',
            type: 'coding',
            points: 10,
            timeLimit: 15,
            isCustom: false,
            analytics: { attempts: 156, successRate: 78, avgTime: 12.5 }
          }
        ]);
      } catch (e) {
        console.error('Failed to fetch templates:', e);
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) fetchData();
  }, [user?._id]);

  const handleCreateAssessment = async () => {
    try {
      const res = await axios.post('/api/assessment-templates', {
        ...newAssessment,
        type: 'scratch',
        recruiterId: user?._id
      });
      setAssessments([res.data, ...assessments]);
      setShowCreateModal(false);
      setNewAssessment({
        name: '',
        role: '',
        rounds: 1,
        minScore: 70,
        skills: [] as string[]
      });
    } catch (e) {
      console.error('Failed to create assessment:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.skill.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkill = filterSkill === 'all' || q.skill === filterSkill;
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesSkill && matchesDifficulty;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Management</h1>
          <p className="text-gray-600">Create and customize technical assessments with AI-powered insights</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('creation')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              activeTab === 'creation'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Creation & Configuration
            </div>
          </button>
          <button
            onClick={() => setActiveTab('customization')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              activeTab === 'customization'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Skill & Question Customization
            </div>
          </button>
        </div>

        {activeTab === 'creation' ? (
          /* ASSESSMENT CREATION & CONFIGURATION */
          <div className="space-y-6">
            {/* Creation Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                   onClick={() => setShowCreateModal(true)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Popular</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Create from Scratch</h3>
                <p className="text-gray-600 text-sm mb-4">Build a custom assessment tailored to your specific requirements</p>
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  Start Creating
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                   onClick={() => setShowCreateModal(true)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Copy className="h-6 w-6 text-white" />
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Fast</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Clone Existing</h3>
                <p className="text-gray-600 text-sm mb-4">Duplicate and modify an existing assessment template</p>
                <div className="flex items-center text-purple-600 text-sm font-medium">
                  Browse Templates
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                   onClick={() => setShowCreateModal(true)}>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">AI-Powered</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Generate from JD</h3>
                <p className="text-gray-600 text-sm mb-4">Let AI create an assessment based on your job description</p>
                <div className="flex items-center text-emerald-600 text-sm font-medium">
                  Upload JD
                  <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>

            {/* Role-Based Templates */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Role-Based Templates</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  View All Templates
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { role: 'Frontend Developer', icon: Code, color: 'blue', count: 12 },
                  { role: 'Backend Developer', icon: Database, color: 'green', count: 8 },
                  { role: 'Full Stack Developer', icon: Globe, color: 'purple', count: 15 },
                  { role: 'DevOps Engineer', icon: Shield, color: 'orange', count: 6 },
                  { role: 'Data Scientist', icon: BarChart3, color: 'pink', count: 10 },
                  { role: 'Mobile Developer', icon: Users, color: 'indigo', count: 7 },
                  { role: 'UI/UX Designer', icon: Heart, color: 'red', count: 9 },
                  { role: 'Product Manager', icon: Target, color: 'yellow', count: 5 }
                ].map((template, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`h-8 w-8 rounded-lg bg-${template.color}-100 flex items-center justify-center`}>
                        <template.icon className={`h-4 w-4 text-${template.color}-600`} />
                      </div>
                      <span className="text-xs text-gray-500">{template.count} templates</span>
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm">{template.role}</h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Existing Assessments */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Your Assessments</h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search assessments..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <div key={assessment._id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{assessment.name}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            assessment.type === 'ai-generated' ? 'bg-emerald-100 text-emerald-700' :
                            assessment.type === 'clone' ? 'bg-purple-100 text-purple-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {assessment.type}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            assessment.status === 'active' ? 'bg-green-100 text-green-700' :
                            assessment.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {assessment.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <span>{assessment.role}</span>
                          <span>{assessment.rounds} rounds</span>
                          <span>Min Score: {assessment.minScore}%</span>
                          <span>Created: {assessment.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          {assessment.skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-green-600 transition-colors">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PROCTORING PERSONALIZATION */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Proctoring Personalization</h3>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                  Security Settings
                </button>
              </div>

              {/* Camera / Screen / Tab Monitoring */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Monitoring Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Camera Monitoring</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Face Detection</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Eye Tracking</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Multiple Faces</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Block</option>
                          <option>Warning</option>
                          <option>Allow</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Recording</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Full Session</option>
                          <option>Events Only</option>
                          <option>Disabled</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Screen Monitoring</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Screen Capture</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Continuous</option>
                          <option>Random Intervals</option>
                          <option>Events Only</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Window Detection</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Application Monitoring</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>All Apps</option>
                          <option>Browser Only</option>
                          <option>Whitelist</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Tab Switching</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tab Switch Detection</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Allowed Switches</span>
                        <input type="number" min="0" max="10" defaultValue="3" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Grace Period</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="30" defaultValue="5" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">seconds</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Auto-Warn</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cheating Tolerance Threshold */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Cheating Tolerance Threshold</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Tolerance Level</span>
                      <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                        <option>Strict</option>
                        <option>Moderate</option>
                        <option>Lenient</option>
                        <option>Custom</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tab Switching</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="10" defaultValue="3" className="flex-1" />
                          <span className="text-sm font-medium w-8">3</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Face Away</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="30" defaultValue="10" className="flex-1" />
                          <span className="text-sm font-medium w-8">10s</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">No Person Detected</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="60" defaultValue="15" className="flex-1" />
                          <span className="text-sm font-medium w-8">15s</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Multiple Faces</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="10" defaultValue="1" className="flex-1" />
                          <span className="text-sm font-medium w-8">1</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Warning System</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Warning Count</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="1" max="10" defaultValue="3" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">before action</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Auto-Dismiss</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="5" max="60" defaultValue="10" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">seconds</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Escalation</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Auto-Block</option>
                          <option>Notify Only</option>
                          <option>Manual Review</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disqualification Triggers */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Disqualification Triggers</h4>
                <div className="space-y-4">
                  {[
                    { 
                      trigger: 'Tab Switching',
                      description: 'Excessive tab switching during assessment',
                      threshold: 'More than 5 switches',
                      action: 'Auto-Disqualify',
                      severity: 'High'
                    },
                    { 
                      trigger: 'No Person Detected',
                      description: 'Camera cannot detect person for extended period',
                      threshold: 'More than 30 seconds',
                      action: 'Warning + Block',
                      severity: 'High'
                    },
                    { 
                      trigger: 'Multiple Faces',
                      description: 'Multiple faces detected in camera view',
                      threshold: 'More than 1 face',
                      action: 'Immediate Block',
                      severity: 'Critical'
                    },
                    { 
                      trigger: 'Unauthorized Applications',
                      description: 'Unauthorized applications detected',
                      threshold: 'Any blocked app',
                      action: 'Warning + Block',
                      severity: 'High'
                    }
                  ].map((trigger, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h5 className="font-medium text-gray-900">{trigger.trigger}</h5>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            trigger.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                            trigger.severity === 'High' ? 'bg-orange-100 text-orange-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {trigger.severity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                          </label>
                          <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Configure</button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Description</p>
                          <p className="text-gray-700">{trigger.description}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Threshold</p>
                          <p className="text-gray-700">{trigger.threshold}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Action</p>
                          <p className="text-gray-700">{trigger.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Proctor Intervention */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Live Proctor Intervention</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Live Monitoring</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Proctor Assignment</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Auto-Assign</option>
                          <option>Manual Assign</option>
                          <option>Pool Based</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Max Candidates per Proctor</span>
                        <input type="number" min="1" max="50" defaultValue="10" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Alert Priority</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>High Priority First</option>
                          <option>FIFO</option>
                          <option>Round Robin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Intervention Tools</span>
                      <span className="text-xs text-gray-500">Available Actions</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Send Warning</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Chat with Candidate</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Pause Assessment</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Terminate Assessment</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Anomaly Sensitivity Configuration */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Anomaly Sensitivity Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Detection Sensitivity</span>
                      <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                        <option>Custom</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Behavioral Analysis</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="75" className="flex-1" />
                          <span className="text-sm font-medium w-8">75%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Pattern Recognition</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="80" className="flex-1" />
                          <span className="text-sm font-medium w-8">80%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Environment Detection</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="70" className="flex-1" />
                          <span className="text-sm font-medium w-8">70%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Time Analysis</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="65" className="flex-1" />
                          <span className="text-sm font-medium w-8">65%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">False Positive Reduction</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Learning Period</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="1" max="30" defaultValue="5" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Confirmation Required</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="1" max="10" defaultValue="2" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">events</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Confidence Threshold</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="50" max="95" defaultValue="85" className="flex-1" />
                          <span className="text-sm font-medium w-8">85%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ELIGIBILITY & INVITE CONTROL */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Eligibility & Invite Control</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Candidate Management
                </button>
              </div>

              {/* Experience & Qualification Filters */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Experience & Qualification Filters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Experience Requirements</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Minimum Experience</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>No Minimum</option>
                          <option>6 Months</option>
                          <option>1 Year</option>
                          <option>2 Years</option>
                          <option>3 Years</option>
                          <option>5 Years</option>
                          <option>7+ Years</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Maximum Experience</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>No Maximum</option>
                          <option>2 Years</option>
                          <option>5 Years</option>
                          <option>7 Years</option>
                          <option>10 Years</option>
                          <option>15+ Years</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Experience Type</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Any Experience</option>
                          <option>Relevant Only</option>
                          <option>Industry Specific</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Qualification Requirements</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Education Level</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>No Requirement</option>
                          <option>High School</option>
                          <option>Bachelor's</option>
                          <option>Master's</option>
                          <option>PhD</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Degree Field</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Any Field</option>
                          <option>Computer Science</option>
                          <option>Engineering</option>
                          <option>Mathematics</option>
                          <option>Science</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Certifications</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>No Requirement</option>
                          <option>Preferred</option>
                          <option>Required</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Auto-Invite via Resume Match % */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Auto-Invite via Resume Match</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Auto-Invite System</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Match Threshold</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="70" className="flex-1" />
                          <span className="text-sm font-medium w-12">70%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Auto-Send</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Immediately</option>
                          <option>Daily Batch</option>
                          <option>Weekly Batch</option>
                          <option>Manual Review</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Max Daily Invites</span>
                        <input type="number" min="1" max="100" defaultValue="10" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Matching Criteria</span>
                      <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Configure</button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Skills Match</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="80" className="flex-1" />
                          <span className="text-sm font-medium w-12">80%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Experience Match</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="60" className="flex-1" />
                          <span className="text-sm font-medium w-12">60%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Qualification Match</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="70" className="flex-1" />
                          <span className="text-sm font-medium w-12">70%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Location Match</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="50" className="flex-1" />
                          <span className="text-sm font-medium w-12">50%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bulk Invite & Public Link Option */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Bulk Invite & Public Link Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Bulk Email Invite</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Email Template</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Standard Invite</option>
                          <option>Personalized</option>
                          <option>Custom Template</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">CSV Upload</span>
                        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">Upload CSV</button>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Max Recipients</span>
                        <input type="number" min="10" max="10000" defaultValue="500" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Send Schedule</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Immediate</option>
                          <option>Scheduled</option>
                          <option>Draft</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Public Link Access</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Link Type</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Open Access</option>
                          <option>Registration Required</option>
                          <option>Approval Required</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Link Expiry</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Never</option>
                          <option>7 Days</option>
                          <option>30 Days</option>
                          <option>90 Days</option>
                          <option>Custom</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Max Participants</span>
                        <input type="number" min="1" max="10000" defaultValue="100" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Require Screening</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attempt Limits & Reattempt Rules */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Attempt Limits & Reattempt Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Attempt Limits</span>
                      <span className="text-xs text-gray-500">Per Candidate</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Maximum Attempts</span>
                        <input type="number" min="1" max="10" defaultValue="3" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cooldown Period</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="365" defaultValue="7" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">days</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Grace Period</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="24" defaultValue="24" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">hours</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Reset on Pass</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Reattempt Rules</span>
                      <span className="text-xs text-gray-500">Progress Handling</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress Retention</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Full Retention</option>
                          <option>Partial Retention</option>
                          <option>Reset Progress</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Score History</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Question Shuffle</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Difficulty Adjustment</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Same Difficulty</option>
                          <option>Easier</option>
                          <option>Harder</option>
                          <option>Adaptive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Expiry Configuration */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Assessment Expiry Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Invite Expiry</span>
                      <span className="text-xs text-gray-500">Link Validity</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Default Expiry</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>24 Hours</option>
                          <option>3 Days</option>
                          <option>7 Days</option>
                          <option>30 Days</option>
                          <option>Custom</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Custom Period</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="1" max="365" defaultValue="7" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">days</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Auto-Extend</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Extension Days</span>
                        <input type="number" min="1" max="30" defaultValue="3" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Session Expiry</span>
                      <span className="text-xs text-gray-500">Active Sessions</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Session Timeout</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="30" max="480" defaultValue="120" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Inactivity Timeout</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="5" max="60" defaultValue="15" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Warning Before Expiry</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="5" max="60" defaultValue="10" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Auto-Save Progress</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI PERSONALIZATION ENGINE */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">AI Personalization Engine</h3>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                  AI Settings
                </button>
              </div>

              {/* Resume-Based Adaptive Assessments */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Resume-Based Adaptive Assessments</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Adaptive Mode</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Resume Analysis</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Skill Mapping</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Experience Calibration</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Adaptation Strategy</span>
                      <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                        <option>Conservative</option>
                        <option>Balanced</option>
                        <option>Aggressive</option>
                        <option>Custom</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Starting Difficulty</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Based on Resume</option>
                          <option>Easy</option>
                          <option>Medium</option>
                          <option>Hard</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Adaptation Speed</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="1" max="10" defaultValue="5" className="flex-1" />
                          <span className="text-sm font-medium w-8">5</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Max Difficulty Jump</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>1 Level</option>
                          <option>2 Levels</option>
                          <option>3 Levels</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skill Gap-Based Personalization */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Skill Gap-Based Personalization</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Gap Analysis</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Gap Detection</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Pre-Assessment</option>
                          <option>Real-Time</option>
                          <option>Hybrid</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Focus Priority</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Critical Skills</option>
                          <option>All Gaps</option>
                          <option>Balanced</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Remediation Questions</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="20" defaultValue="5" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">per gap</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Personalization Level</span>
                      <span className="text-xs text-gray-500">AI-Driven</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Weakness Focus</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="70" className="flex-1" />
                          <span className="text-sm font-medium w-8">70%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Strength Challenge</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="30" className="flex-1" />
                          <span className="text-sm font-medium w-8">30%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Learning Path</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Sequential</option>
                          <option>Adaptive</option>
                          <option>Spiral</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Branching Logic */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Dynamic Branching Logic</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Branching Triggers</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Performance Threshold</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="75" className="flex-1" />
                          <span className="text-sm font-medium w-8">75%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Time-Based</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Difficulty-Based</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Branch Paths</span>
                      <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Configure</button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { path: 'Advanced Path', condition: 'Score > 85%', questions: 'Expert-level questions', difficulty: 'Hard' },
                        { path: 'Remedial Path', condition: 'Score < 60%', questions: 'Skill-building questions', difficulty: 'Easy' },
                        { path: 'Exploratory Path', condition: 'Mixed performance', questions: 'Cross-skill questions', difficulty: 'Medium' },
                        { path: 'Challenge Path', condition: 'High potential', questions: 'Stretch questions', difficulty: 'Expert' }
                      ].map((branch, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{branch.path}</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{branch.condition}</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            <p className="mb-1">Questions: {branch.questions}</p>
                            <p>Difficulty: {branch.difficulty}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Potential Estimation */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Learning Potential Estimation</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">AI Analysis</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Learning Velocity</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="75" className="flex-1" />
                          <span className="text-sm font-medium w-8">75%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Adaptability Score</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="80" className="flex-1" />
                          <span className="text-sm font-medium w-8">80%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Problem Solving</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="70" className="flex-1" />
                          <span className="text-sm font-medium w-8">70%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Potential Metrics</span>
                      <span className="text-xs text-gray-500">AI-Generated</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Growth Potential</span>
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">High</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Estimated Growth: 2.5x faster than average</p>
                          <p>Time to Expert: 12-18 months</p>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Learning Capacity</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Very High</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Skill Acquisition Rate: 95%</p>
                          <p>Knowledge Retention: 90%</p>
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Career Trajectory</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">Senior Level</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Expected Role: Senior Developer</p>
                          <p>Timeline: 2-3 years</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Future Performance Prediction */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Future Performance Prediction</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Prediction Model</span>
                      <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                        <option>ML-Based</option>
                        <option>Statistical</option>
                        <option>Hybrid</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Prediction Accuracy</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="85" className="flex-1" />
                          <span className="text-sm font-medium w-8">85%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Time Horizon</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>6 Months</option>
                          <option>1 Year</option>
                          <option>2 Years</option>
                          <option>5 Years</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Confidence Interval</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>±5%</option>
                          <option>±10%</option>
                          <option>±15%</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Performance Forecasts</span>
                      <span className="text-xs text-gray-500">AI-Generated</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { metric: 'Technical Skills', current: '75%', predicted: '88%', trend: '↑13%', confidence: 'High' },
                        { metric: 'Problem Solving', current: '70%', predicted: '85%', trend: '↑15%', confidence: 'High' },
                        { metric: 'Leadership', current: '60%', predicted: '78%', trend: '↑18%', confidence: 'Medium' },
                        { metric: 'Communication', current: '80%', predicted: '82%', trend: '↑2%', confidence: 'High' }
                      ].map((forecast, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{forecast.metric}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              forecast.confidence === 'High' ? 'bg-green-100 text-green-700' :
                              forecast.confidence === 'Medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {forecast.confidence}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Current</span>
                            <span className="text-gray-900 font-medium">{forecast.current}</span>
                            <span className="text-gray-900 font-medium">{forecast.trend}</span>
                            <span className="text-gray-900 font-medium">{forecast.predicted}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAIRNESS & BIAS CONTROL */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Fairness & Bias Control</h3>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  Fairness Settings
                </button>
              </div>

              {/* Blind Evaluation Mode */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Blind Evaluation Mode</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Anonymization</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Name Anonymization</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Resume Blinding</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="clear">Background Blinding</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Evaluation Scope</span>
                      <span className="text-xs text-gray-500">What's Hidden</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Personal Information</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Experience Details</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Education History</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skill-Only Scoring Mode */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Skill-Only Scoring Mode</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Objective Evaluation</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Skill-Based Scoring</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Experience Neutralization</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Bias-Free Evaluation</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Scoring Parameters</span>
                      <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Advanced</button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Skill Weighting</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Equal Weight</option>
                          <option>Role-Based</option>
                          <option>Custom</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Experience Factor</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="0" className="flex-1" />
                          <span className="text-sm font-medium w-8">0%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Education Factor</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="0" className="flex-1" />
                          <span className="text-sm font-medium w-8">0%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fairness Audit Logs */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Fairness Audit Logs</h4>
                <div className="space-y-4">
                  {[
                    { 
                      timestamp: '2024-01-15 14:30:22',
                      type: 'Bias Detection',
                      severity: 'Medium',
                      description: 'Gender bias detected in question selection',
                      action: 'Adjusted question distribution',
                      status: 'Resolved'
                    },
                    { 
                      timestamp: '2024-01-15 13:45:18',
                      type: 'Fairness Check',
                      severity: 'Low',
                      description: 'Experience-based scoring bias identified',
                      action: 'Neutralized experience factor',
                      status: 'Resolved'
                    },
                    { 
                      timestamp: '2024-01-15 12:20:15',
                      type: 'Bias Alert',
                      severity: 'High',
                      description: 'Cultural bias in communication assessment',
                      action: 'Added cultural context questions',
                      status: 'In Progress'
                    },
                    { 
                      timestamp: '2024-01-15 11:10:33',
                      type: 'Fairness Audit',
                      severity: 'Low',
                      description: 'Regular fairness audit completed',
                      action: 'All metrics within acceptable range',
                      status: 'Completed'
                    }
                  ].map((log, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">{log.timestamp}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.severity === 'High' ? 'bg-red-100 text-red-700' :
                            log.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {log.type}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          log.status === 'In Progress' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      
                      <div className="text-sm">
                        <p className="text-gray-700 mb-1">{log.description}</p>
                        <p className="text-gray-600">Action: {log.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diversity Balancing Preferences */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Diversity Balancing Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Diversity Goals</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Gender Balance</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>No Preference</option>
                          <option>Balanced</option>
                          <option>Targeted</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Ethnic Diversity</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>No Preference</option>
                          <option>Representative</option>
                          <option>Targeted</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Age Diversity</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>No Preference</option>
                          <option>Balanced</option>
                          <option>Multi-Generational</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Balancing Strategy</span>
                      <span className="text-xs text-gray-500">AI-Assisted</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Method</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Statistical</option>
                          <option>Algorithmic</option>
                          <option>Hybrid</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Threshold</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="80" className="flex-1" />
                          <span className="text-sm font-medium w-8">80%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Monitoring</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accessibility Accommodations */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Accessibility Accommodations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">General Accommodations</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Extra Time</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Flexible Scheduling</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Pause & Resume</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Specific Accommodations</span>
                      <span className="text-xs text-gray-500">Available</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Visual Impairments</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Standard</option>
                          <option>High Contrast</option>
                          <option>Large Text</option>
                          <option>Screen Reader</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Hearing Impairments</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Motor Impairments</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cognitive Load</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PERFORMANCE THRESHOLD SETTINGS */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Performance Threshold Settings</h3>
                <button className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                  Threshold Rules
                </button>
              </div>

              {/* Auto-Shortlist / Auto-Reject Logic */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Auto-Shortlist / Auto-Reject Logic</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Auto-Decision</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Auto-Shortlist</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Auto-Reject</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Manual Review</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Threshold Values</span>
                      <span className="text-xs text-gray-500">Score-based</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Shortlist Threshold</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="80" className="flex-1" />
                          <span className="text-sm font-medium w-8">80%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Reject Threshold</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="40" className="flex-1" />
                          <span className="text-sm font-medium w-8">40%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Review Range</span>
                        <span className="text-sm font-medium text-gray-900">40% - 80%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section Minimum Scores */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Section Minimum Scores</h4>
                <div className="space-y-4">
                  {[
                    { section: 'Technical Skills', minimum: 70, weight: '40%', required: true },
                    { section: 'Problem Solving', minimum: 65, weight: '25%', required: true },
                    { section: 'Communication', minimum: 60, weight: '20%', required: false },
                    { section: 'Leadership', minimum: 55, weight: '15%', required: false },
                    { section: 'Cultural Fit', minimum: 50, weight: '10%', required: false }
                  ].map((section, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">{section.section}</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{section.weight}</span>
                          {section.required && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Required</span>
                          )}
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={section.required} />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Minimum Score</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue={section.minimum} className="flex-1" />
                          <span className="text-sm font-medium w-8">{section.minimum}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrity Thresholds */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Integrity Thresholds</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Proctoring Integrity</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Max Violations</span>
                        <input type="number" min="0" max="10" defaultValue="3" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Warning Threshold</span>
                        <input type="number" min="0" max="10" defaultValue="2" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Auto-Disqualify</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Time Integrity</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Min Time Per Question</span>
                        <input type="number" min="0" max="300" defaultValue="30" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Suspicious Speed</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="20" className="flex-1" />
                          <span className="text-sm font-medium w-8">20%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Time Variance Alert</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="50" className="flex-1" />
                          <span className="text-sm font-medium w-8">50%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Training-Required Flags */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Training-Required Flags</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Skill Gaps</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Critical Skills Missing</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Below Proficiency</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[22px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Knowledge Gaps</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Training Recommendations</span>
                      <span className="text-xs text-gray-500">AI-Generated</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">JavaScript Fundamentals</span>
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">Required</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Current: 45% | Target: 80%</p>
                          <p>Estimated Training: 4-6 weeks</p>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">System Design</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Recommended</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Current: 60% | Target: 75%</p>
                          <p>Estimated Training: 2-3 weeks</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* High-Potential Override Logic */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">High-Potential Override Logic</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Override Conditions</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Learning Potential</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="85" className="flex-1" />
                          <span className="text-sm font-medium w-8">85%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Problem Solving</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="80" className="flex-1" />
                          <span className="text-sm font-medium w-8">80%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Adaptability</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="75" className="flex-1" />
                          <span className="text-sm font-medium w-8">75%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Override Actions</span>
                      <span className="text-xs text-gray-500">Automatic</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Bypass Auto-Reject</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Auto-Shortlist</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Priority Review</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* REPORTING & WORKFLOW CONTROL */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Reporting & Workflow Control</h3>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Workflow Settings
                </button>
              </div>

              {/* Custom Report Layouts */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Custom Report Layouts</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Report Templates</span>
                      <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Create New</button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'Executive Summary', sections: '3', usage: 'High', lastUsed: '2 days ago' },
                        { name: 'Technical Deep Dive', sections: '8', usage: 'Medium', lastUsed: '1 week ago' },
                        { name: 'Skills Matrix', sections: '5', usage: 'High', lastUsed: '3 days ago' },
                        { name: 'Comparison Report', sections: '6', usage: 'Low', lastUsed: '2 weeks ago' }
                      ].map((template, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{template.name}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              template.usage === 'High' ? 'bg-green-100 text-green-700' :
                              template.usage === 'Medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {template.usage}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            <p className="mb-1">Sections: {template.sections}</p>
                            <p>Last used: {template.lastUsed}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Layout Configuration</span>
                      <span className="text-xs text-gray-500">Drag & Drop</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Header Section</span>
                          <button className="text-blue-600 text-sm">Edit</button>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Candidate Info • Score • Status</p>
                          <p>Position: Top • Width: Full</p>
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Skills Section</span>
                          <button className="text-green-600 text-sm">Edit</button>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Technical Skills • Soft Skills • Scores</p>
                          <p>Position: Middle • Width: 2-Column</p>
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Analytics Section</span>
                          <button className="text-purple-600 text-sm">Edit</button>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Charts • Trends • Comparisons</p>
                          <p>Position: Bottom • Width: Full</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ATS API Integration */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">ATS API Integration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Connected Systems</span>
                      <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Add Integration</button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { system: 'Workday', status: 'Connected', lastSync: '5 min ago', active: true },
                        { system: 'Greenhouse', status: 'Connected', lastSync: '1 hour ago', active: true },
                        { system: 'Lever', status: 'Error', lastSync: '3 days ago', active: false },
                        { system: 'SmartRecruiters', status: 'Connected', lastSync: '30 min ago', active: true }
                      ].map((integration, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">{integration.system}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              integration.status === 'Connected' ? 'bg-green-100 text-green-700' :
                              integration.status === 'Error' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {integration.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            <p className="mb-1">Last sync: {integration.lastSync}</p>
                            <p>Active: {integration.active ? 'Yes' : 'No'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Sync Configuration</span>
                      <span className="text-xs text-gray-500">Automated</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Auto-Sync</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Sync Frequency</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Real-time</option>
                          <option>Every 5 min</option>
                          <option>Every 15 min</option>
                          <option>Every hour</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Data Mapping</span>
                        <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Configure</button>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Error Handling</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Auto-Retry</option>
                          <option>Manual Review</option>
                          <option>Skip & Log</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-Reviewer Scoring */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Multi-Reviewer Scoring</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Review Process</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Required Reviewers</span>
                        <input type="number" min="1" max="10" defaultValue="3" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Blind Review</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Weighted Scoring</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Reviewer Assignment</span>
                      <span className="text-xs text-gray-500">Auto-Assigned</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Assignment Method</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Round Robin</option>
                          <option>Random</option>
                          <option>Skills-Based</option>
                          <option>Workload Balanced</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Max Per Reviewer</span>
                        <input type="number" min="1" max="50" defaultValue="10" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Review Deadline</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>24 hours</option>
                          <option>48 hours</option>
                          <option>72 hours</option>
                          <option>1 week</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decision Voting System */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Decision Voting System</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Voting Rules</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Decision Method</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Majority Vote</option>
                          <option>Unanimous</option>
                          <option>Weighted Vote</option>
                          <option>Consensus</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Min Votes Required</span>
                        <input type="number" min="1" max="10" defaultValue="2" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Tie Breaker</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Senior Reviewer</option>
                          <option>Highest Score</option>
                          <option>Admin Decision</option>
                          <option>Random</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Voting Options</span>
                      <span className="text-xs text-gray-500">Configurable</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Approve</span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Default</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Move to next stage</p>
                          <p>Auto-notify candidate</p>
                        </div>
                      </div>
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Hold</span>
                          <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">Conditional</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Request more information</p>
                          <p>Schedule follow-up</p>
                        </div>
                      </div>
                      <div className="p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Reject</span>
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Final</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">End process</p>
                          <p>Send rejection notice</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role-Based Permissions */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Role-Based Permissions</h4>
                <div className="space-y-4">
                  {[
                    { 
                      role: 'Admin', 
                      permissions: ['Full Access', 'User Management', 'System Settings', 'All Reports', 'Delete Data'],
                      color: 'purple',
                      users: 2
                    },
                    { 
                      role: 'Recruiter', 
                      permissions: ['Create Assessments', 'View Results', 'Generate Reports', 'Manage Candidates'],
                      color: 'blue',
                      users: 8
                    },
                    { 
                      role: 'Reviewer', 
                      permissions: ['Review Candidates', 'Score Assessments', 'Add Comments', 'View Assigned'],
                      color: 'green',
                      users: 15
                    },
                    { 
                      role: 'Viewer', 
                      permissions: ['View Reports', 'Read-Only Access', 'Export Data'],
                      color: 'gray',
                      users: 5
                    }
                  ].map((role, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">{role.role}</span>
                          <span className={`px-2 py-1 bg-${role.color}-100 text-${role.color}-700 rounded text-xs`}>
                            {role.users} users
                          </span>
                        </div>
                        <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Edit Permissions</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((permission, pidx) => (
                          <span key={pidx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {permission}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assessment ROI Tracking */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Assessment ROI Tracking</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">ROI Metrics</span>
                      <span className="text-xs text-gray-500">Last 30 days</span>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Time Saved</span>
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">+45%</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Screening time: 2.5h → 1.4h per candidate</p>
                          <p>Monthly savings: 44 hours</p>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Quality Improvement</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">+32%</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Better candidate matching</p>
                          <p>Reduced turnover risk</p>
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Cost Efficiency</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">$2,450</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          <p className="mb-1">Monthly cost savings</p>
                          <p>Annual ROI: 285%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Tracking Configuration</span>
                      <span className="text-xs text-gray-500">Analytics</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cost Tracking</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Time Metrics</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Quality Metrics</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Reporting Period</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Daily</option>
                          <option>Weekly</option>
                          <option>Monthly</option>
                          <option>Quarterly</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* SKILL & QUESTION CUSTOMIZATION */
          <div className="space-y-6">
            {/* Skill Management */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Skill Management</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Add Skill
                </button>
              </div>
              
              {/* Skill Categories */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm font-medium text-gray-700">Categories:</span>
                  <div className="flex gap-2">
                    {['All', 'Frontend', 'Backend', 'Database', 'DevOps', 'Mobile'].map((category) => (
                      <button
                        key={category}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Skills List */}
              <div className="space-y-4">
                {skills.map((skill, idx) => (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{skill.category}</span>
                        {skill.isMandatory && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Mandatory</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-1">Weightage</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${skill.weightage}%` }}
                            ></div>
                          </div>
                          <span className="font-medium">{skill.weightage}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Questions</p>
                        <p className="font-medium">{skill.questions}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Avg Difficulty</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-4 w-4 rounded-full ${
                                level <= skill.avgDifficulty ? 'bg-amber-400' : 'bg-gray-200'
                              }`}
                            ></div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-1">Actions</p>
                        <div className="flex gap-2">
                          <button className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">View Questions</button>
                          <button className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Add Questions</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Bank */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Question Bank</h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={filterSkill}
                    onChange={(e) => setFilterSkill(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Skills</option>
                    {skills.map((skill) => (
                      <option key={skill.name} value={skill.name}>{skill.name}</option>
                    ))}
                  </select>
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Create Question
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{question.text}</h4>
                          {question.isCustom && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Custom</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">{question.skill}</span>
                          <span className={`px-2 py-1 rounded ${
                            question.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                            question.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {question.difficulty}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{question.type}</span>
                          <span>{question.points} points</span>
                          <span>{question.timeLimit} min</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Question Analytics */}
                    <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Attempts</p>
                        <p className="font-semibold text-gray-900">{question.analytics.attempts}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Success Rate</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="h-1.5 rounded-full bg-green-500"
                              style={{ width: `${question.analytics.successRate}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-gray-900">{question.analytics.successRate}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Avg Time</p>
                        <p className="font-semibold text-gray-900">{question.analytics.avgTime} min</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Questions Section */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Custom Questions</h3>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                  Create Custom Question
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border-2 border-dashed border-purple-300 rounded-lg">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Multiple Choice</h4>
                    <p className="text-gray-600 text-sm mb-4">Create questions with multiple answer options</p>
                    <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors">
                      Create MCQ
                    </button>
                  </div>
                </div>
                
                <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg">
                  <div className="text-center">
                    <Code className="h-12 w-12 text-blue-400 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Coding Challenge</h4>
                    <p className="text-gray-600 text-sm mb-4">Create programming problems with code evaluation</p>
                    <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors">
                      Create Coding
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* DIFFICULTY & ADAPTIVE CONTROL */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Difficulty & Adaptive Control</h3>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                  Advanced Settings
                </button>
              </div>

              {/* Overall Difficulty Setting */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Overall Difficulty Setting</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Current Level</span>
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Medium</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Easy</span>
                        <input type="radio" name="difficulty" className="text-blue-600" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Medium</span>
                        <input type="radio" name="difficulty" className="text-blue-600" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Hard</span>
                        <input type="radio" name="difficulty" className="text-blue-600" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Expert</span>
                        <input type="radio" name="difficulty" className="text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Difficulty Distribution</span>
                      <span className="text-xs text-gray-500">Auto-balanced</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Easy Questions</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="25" className="flex-1" />
                          <span className="text-sm font-medium w-12">25%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Medium Questions</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="50" className="flex-1" />
                          <span className="text-sm font-medium w-12">50%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Hard Questions</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="20" className="flex-1" />
                          <span className="text-sm font-medium w-12">20%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Expert Questions</span>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="5" className="flex-1" />
                          <span className="text-sm font-medium w-12">5%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Adaptive Mode</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Automatically adjust difficulty based on candidate performance</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Escalation Threshold</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>80% correct</option>
                          <option>85% correct</option>
                          <option>90% correct</option>
                          <option>95% correct</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Reduction Threshold</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>40% correct</option>
                          <option>50% correct</option>
                          <option>60% correct</option>
                          <option>70% correct</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-Skill Difficulty Setting */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Per-Skill Difficulty Configuration</h4>
                <div className="space-y-4">
                  {skills.map((skill, idx) => (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h5 className="font-medium text-gray-900">{skill.name}</h5>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">{skill.category}</span>
                        </div>
                        <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Configure</button>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 mb-1">Base Difficulty</p>
                          <select className="w-full px-2 py-1 border border-gray-300 rounded">
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                            <option>Expert</option>
                          </select>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Variance</p>
                          <select className="w-full px-2 py-1 border border-gray-300 rounded">
                            <option>Low</option>
                            <option>Medium</option>
                            <option>High</option>
                          </select>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Adaptive</p>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">Weight</p>
                          <input type="number" className="w-full px-2 py-1 border border-gray-300 rounded" min="1" max="10" defaultValue="1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anti-Guessing Logic */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Anti-Guessing Logic</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Question Randomization</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Shuffle Type</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Full Random</option>
                          <option>Within Difficulty</option>
                          <option>Within Skill</option>
                          <option>Smart Adaptive</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Answer Options</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Random Order</option>
                          <option>Fixed Order</option>
                          <option>Smart Order</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Pattern Detection</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Response Time Analysis</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Enabled</option>
                          <option>Disabled</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Click Pattern</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Enabled</option>
                          <option>Disabled</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Answer Consistency</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Enabled</option>
                          <option>Disabled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Pressure Customization */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Time Pressure Customization</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Time Limits</span>
                      <span className="text-xs text-gray-500">Per Question</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Easy Questions</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="1" max="30" defaultValue="5" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Medium Questions</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="1" max="30" defaultValue="10" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Hard Questions</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="1" max="30" defaultValue="15" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Expert Questions</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="1" max="30" defaultValue="20" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Time Pressure Mode</span>
                      <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                        <option>Normal</option>
                        <option>Strict</option>
                        <option>Relaxed</option>
                        <option>Adaptive</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Buffer Time</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="10" defaultValue="2" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Warning Threshold</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="1" max="30" defaultValue="5" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes left</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cognitive Load Balance */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Cognitive Load Balance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Load Distribution</span>
                      <span className="text-xs text-gray-500">Per Section</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Section 1</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full bg-blue-500" style={{ width: '25%' }}></div>
                          </div>
                          <span className="text-sm font-medium w-12">25%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Section 2</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full bg-blue-500" style={{ width: '30%' }}></div>
                          </div>
                          <span className="text-sm font-medium w-12">30%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Section 3</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full bg-blue-500" style={{ width: '35%' }}></div>
                          </div>
                          <span className="text-sm font-medium w-12">35%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Section 4</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full bg-blue-500" style={{ width: '10%' }}></div>
                          </div>
                          <span className="text-sm font-medium w-12">10%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Cognitive Metrics</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Complexity Tracking</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Enabled</option>
                          <option>Disabled</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Fatigue Detection</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Enabled</option>
                          <option>Disabled</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Break Recommendations</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Smart</option>
                          <option>Fixed</option>
                          <option>Disabled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TIME & STRUCTURE CONTROL */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Time & Structure Control</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Advanced Settings
                </button>
              </div>

              {/* Total Duration & Section Limits */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Total Duration & Section Limits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Total Assessment Duration</span>
                      <span className="text-xs text-gray-500">All Sections</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Time</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="10" max="240" defaultValue="90" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Warning at</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="5" max="200" defaultValue="15" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes left</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Auto-submit at</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="5" defaultValue="0" className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes left</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Section Time Limits</span>
                      <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Add Section</button>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Section 1: Fundamentals</span>
                          <div className="flex items-center gap-2">
                            <input type="number" min="5" max="60" defaultValue="20" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                            <span className="text-gray-500">min</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Questions</span>
                          <span className="text-gray-900">10 questions</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Section 2: Advanced</span>
                          <div className="flex items-center gap-2">
                            <input type="number" min="5" max="60" defaultValue="30" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                            <span className="text-gray-500">min</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Questions</span>
                          <span className="text-gray-900">15 questions</span>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">Section 3: Expert</span>
                          <div className="flex items-center gap-2">
                            <input type="number" min="5" max="60" defaultValue="40" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                            <span className="text-gray-500">min</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Questions</span>
                          <span className="text-gray-900">8 questions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strict vs Flexible Timing */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Strict vs Flexible Timing</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Timing Mode</span>
                      <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                        <option>Strict</option>
                        <option>Flexible</option>
                        <option>Hybrid</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Question Timer</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Section Timer</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total Timer</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm text-amber-700">
                        <strong>Strict Mode:</strong> Time limits are enforced, no extensions. <br />
                        <strong>Flexible Mode:</strong> Candidates can request time extensions. <br />
                        <strong>Hybrid Mode:</strong> Strict on core sections, flexible on others.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Extension Policy</span>
                      <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                        <option>No Extensions</option>
                        <option>Limited Extensions</option>
                        <option>Unlimited Extensions</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Max Extensions</span>
                        <input type="number" min="0" max="10" defaultValue="2" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Extension Time</span>
                        <input type="number" min="1" max="10" defaultValue="5" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Auto-Approve</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Shuffle & Order Configuration */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Question Shuffle & Order Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Question Shuffling</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Shuffle Scope</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>All Questions</option>
                          <option>Within Section</option>
                          <option>Within Difficulty</option>
                          <option>Within Skill</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Shuffle Frequency</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Once</option>
                          <option>Per Section</option>
                          <option>Per Question</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Seed Randomization</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Order Configuration</span>
                      <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                        <option>Random</option>
                        <option>Difficulty-Based</option>
                        <option>Skill-Based</option>
                        <option>Custom</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Order Direction</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Easiest to Hardest</option>
                          <option>Hardest to Easiest</option>
                          <option>Random</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Maintain Section Order</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Adaptive Ordering</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mandatory Completion Rules */}
              <div className="mb-8">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Mandatory Completion Rules</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Section Requirements</span>
                      <span className="text-xs text-gray-500">Per Section</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Section 1</span>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" defaultChecked />
                          <span className="text-gray-900">Must Complete</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Section 2</span>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" defaultChecked />
                          <span className="text-gray-900">Must Complete</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Section 3</span>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                          <span className="text-gray-900">Optional</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Section 4</span>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                          <span className="text-gray-900">Optional</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Minimum Score Requirements</span>
                      <span className="text-xs text-gray-500">Per Section</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Section 1</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="100" defaultValue="70" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">% to pass</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Section 2</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="100" defaultValue="75" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">% to pass</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Section 3</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="100" defaultValue="80" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">% to pass</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Section 4</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" max="100" defaultValue="85" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">% to pass</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Break Allowances */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-4">Break Allowances</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Break Configuration</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Break Type</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Scheduled</option>
                          <option>On-Demand</option>
                          <option>Disabled</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Break Duration</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="1" max="30" defaultValue="5" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                          <span className="text-gray-500">minutes</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Break Frequency</span>
                        <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                          <option>Every Section</option>
                          <option>Every 2 Sections</option>
                          <option>Every 3 Sections</option>
                          <option>Custom</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Max Breaks</span>
                        <input type="number" min="0" max="10" defaultValue="3" className="w-16 px-2 py-1 border border-gray-300 rounded text-sm" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Break Policy</span>
                      <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                        <option>Strict</option>
                        <option>Flexible</option>
                        <option>Disabled</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Pause Timer</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Hide Questions</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Screen Lock</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Assessment Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Assessment</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assessment Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter assessment name"
                    value={newAssessment.name}
                    onChange={(e) => setNewAssessment({ ...newAssessment, name: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newAssessment.role}
                      onChange={(e) => setNewAssessment({ ...newAssessment, role: e.target.value })}
                    >
                      <option value="">Select Role</option>
                      <option value="frontend">Frontend Developer</option>
                      <option value="backend">Backend Developer</option>
                      <option value="fullstack">Full Stack Developer</option>
                      <option value="devops">DevOps Engineer</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Number of Rounds</label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newAssessment.rounds}
                      onChange={(e) => setNewAssessment({ ...newAssessment, rounds: parseInt(e.target.value) })}
                    >
                      <option value="1">1 Round</option>
                      <option value="2">2 Rounds</option>
                      <option value="3">3 Rounds</option>
                      <option value="4">4 Rounds</option>
                      <option value="5">5 Rounds</option>
                    </select>
                  </div>
                </div>
                
                {/* Skills Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills & Weightage</label>
                  <div className="space-y-3">
                    {skills.slice(0, 4).map((skill) => (
                      <div key={skill.name} className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="flex-1 text-sm font-medium text-gray-900">{skill.name}</span>
                        <input
                          type="number"
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Weight %"
                          min="0"
                          max="100"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Company Focus */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company-Specific Focus</label>
                  <div className="flex flex-wrap gap-2">
                    {['E-commerce', 'SaaS', 'Enterprise', 'Startup', 'Healthcare', 'Finance'].map((focus) => (
                      <label key={focus} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{focus}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Minimum Qualifying Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Qualifying Score (%)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter minimum score"
                    min="0"
                    max="100"
                    value={newAssessment.minScore}
                    onChange={(e) => setNewAssessment({ ...newAssessment, minScore: parseInt(e.target.value) })}
                  />
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAssessment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Assessment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
