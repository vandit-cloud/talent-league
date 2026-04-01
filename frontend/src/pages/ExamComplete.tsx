import { useNavigate } from "react-router-dom";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Home,
  Download,
  FileText
} from "lucide-react";

export default function ExamComplete() {
  const navigate = useNavigate();

  const handleReturnHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Exam Completed Successfully
          </h1>
          <p className="text-xl text-slate-600">
            Thank you for completing the assessment. Your responses have been submitted.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6 flex items-center gap-3">
            <FileText className="w-6 h-6 text-indigo-600" />
            Exam Summary
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-slate-600" />
                <span className="font-medium text-slate-700">Duration</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">28:45</p>
              <p className="text-sm text-slate-500">Total time taken</p>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-slate-700">Status</span>
              </div>
              <p className="text-2xl font-bold text-green-600">Completed</p>
              <p className="text-sm text-slate-500">All questions answered</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">Proctoring Report</h3>
                <p className="text-amber-700 text-sm">
                  Your exam session was monitored and recorded. A detailed proctoring report has been generated 
                  and will be reviewed along with your assessment results.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="font-semibold text-slate-800 mb-4">Next Steps</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">1</span>
                </div>
                <p className="text-slate-700">Your answers will be automatically graded</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">2</span>
                </div>
                <p className="text-slate-700">Results will be available within 24-48 hours</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-sm">3</span>
                </div>
                <p className="text-slate-700">You will receive an email with your results</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleReturnHome}
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            <Home className="w-5 h-5" />
            Return to Home
          </button>
          
          <button
            className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download Report
          </button>
        </div>

        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            Exam ID: <span className="font-mono font-medium">EXAM-{Date.now().toString().slice(-6)}</span>
          </p>
          <p className="text-slate-400 text-xs mt-2">
            If you have any questions about your results, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
