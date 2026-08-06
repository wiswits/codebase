import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { publicApplicationService } from '../services/applicationService';

const STEPS = ['Student Details', 'Parent / Guardian Details', 'Academic Details', 'Address Details', 'Documents', 'Review & Submit'];
const CLASSES = ['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5'];
const SOURCES = ['Walk-in', 'Website', 'Referral', 'Facebook Ads', 'Agent', 'Other'];

const PublicApplicationForm = () => {
  const { draftToken: routeToken } = useParams();
  const navigate = useNavigate();
  const [draftToken, setDraftToken] = useState(routeToken || null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(null);
  const [form, setForm] = useState({
    student: { name: '', dob: '', gender: 'Male', classAppliedFor: 'Nursery', board: 'CBSE' },
    parent: { fatherName: '', motherName: '', guardianName: '', phone: '', email: '', occupation: '', annualIncome: '', address: '', sameAsFather: false },
    academic: { previousSchool: '', previousClass: '', lastPercentage: '' },
    source: 'Website',
    sourceDetail: '',
  });

  // Resume or start a draft on mount
  useEffect(() => {
    const init = async () => {
      try {
        if (routeToken) {
          const res = await publicApplicationService.getDraft(routeToken);
          const app = res.data.application;
          setForm((f) => ({
            ...f,
            student: { ...f.student, ...app.student },
            parent: { ...f.parent, ...app.parent },
            academic: { ...f.academic, ...app.academic },
            source: app.source || f.source,
            sourceDetail: app.sourceDetail || '',
          }));
          setStep(app.currentStep || 1);
        } else {
          const res = await publicApplicationService.start(form.student.classAppliedFor);
          setDraftToken(res.data.draftToken);
          navigate(`/apply/${res.data.draftToken}`, { replace: true });
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoSave = async (nextStep) => {
    if (!draftToken) return;
    try {
      await publicApplicationService.saveStep(draftToken, { ...form, currentStep: nextStep });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const goNext = async () => {
    const next = Math.min(step + 1, STEPS.length);
    await autoSave(next);
    setStep(next);
  };
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    try {
      await autoSave(step);
      const res = await publicApplicationService.submit(draftToken);
      setSubmitted(res.data.application);
      toast.success('Application submitted!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-800">Application Submitted!</h1>
          <p className="text-sm text-gray-500 mt-2">Your application number is:</p>
          <p className="text-xl font-bold text-blue-600 mt-1">{submitted.applicationNo}</p>
          <p className="text-xs text-gray-400 mt-3">
            We've sent a confirmation to {submitted.parent?.email || submitted.parent?.phone}. Keep this link bookmarked to track your application status and upload documents.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#0f1c3f] px-4 py-4 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm">EduSuite Admissions</p>
          <p className="text-slate-400 text-xs">Public Application Form (No Login Required)</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-4 lg:p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm font-semibold text-gray-800">{STEPS[step - 1]}</p>
            <span className="text-xs text-gray-400">Step {step} of {STEPS.length}</span>
          </div>

          <div className="flex gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-blue-600' : 'bg-gray-150 bg-gray-200'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <FormField label="Student's Full Name" required value={form.student.name} onChange={(v) => setForm({ ...form, student: { ...form.student, name: v } })} />
              <FormField label="Date of Birth" type="date" value={form.student.dob} onChange={(v) => setForm({ ...form, student: { ...form.student, dob: v } })} />
              <div>
                <label className="block text-gray-600 mb-1">Gender</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5" value={form.student.gender} onChange={(e) => setForm({ ...form, student: { ...form.student, gender: e.target.value } })}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Class Applying For</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5" value={form.student.classAppliedFor} onChange={(e) => setForm({ ...form, student: { ...form.student, classAppliedFor: e.target.value } })}>
                  {CLASSES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">How did you hear about us?</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  {SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <FormField label="Father's Name" value={form.parent.fatherName} onChange={(v) => setForm({ ...form, parent: { ...form.parent, fatherName: v } })} />
              <FormField label="Mother's Name" value={form.parent.motherName} onChange={(v) => setForm({ ...form, parent: { ...form.parent, motherName: v } })} />
              <FormField label="Guardian Name (optional)" value={form.parent.guardianName} onChange={(v) => setForm({ ...form, parent: { ...form.parent, guardianName: v } })} />
              <FormField label="Mobile Number" required value={form.parent.phone} onChange={(v) => setForm({ ...form, parent: { ...form.parent, phone: v } })} />
              <FormField label="Email Address" type="email" value={form.parent.email} onChange={(v) => setForm({ ...form, parent: { ...form.parent, email: v } })} />
              <FormField label="Occupation" value={form.parent.occupation} onChange={(v) => setForm({ ...form, parent: { ...form.parent, occupation: v } })} />
              <div>
                <label className="block text-gray-600 mb-1">Annual Income</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2.5" value={form.parent.annualIncome} onChange={(e) => setForm({ ...form, parent: { ...form.parent, annualIncome: e.target.value } })}>
                  <option value="">Select</option>
                  <option value="<2.5L">Below ₹2.5 Lakh</option>
                  <option value="2.5-5L">₹2.5 - 5 Lakh</option>
                  <option value="5-10L">₹5 - 10 Lakh</option>
                  <option value=">10L">Above ₹10 Lakh</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-gray-600 mb-1">Address</label>
                <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2.5" rows={2} value={form.parent.address} onChange={(e) => setForm({ ...form, parent: { ...form.parent, address: e.target.value } })} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <FormField label="Previous School" value={form.academic.previousSchool} onChange={(v) => setForm({ ...form, academic: { ...form.academic, previousSchool: v } })} />
              <FormField label="Previous Class" value={form.academic.previousClass} onChange={(v) => setForm({ ...form, academic: { ...form.academic, previousClass: v } })} />
              <FormField label="Last Exam Percentage" type="number" value={form.academic.lastPercentage} onChange={(v) => setForm({ ...form, academic: { ...form.academic, lastPercentage: v } })} />
            </div>
          )}

          {step === 4 && (
            <div className="text-sm text-gray-500">
              <p>Address details were captured with parent information in Step 2. Click Next to continue to document upload.</p>
            </div>
          )}

          {step === 5 && (
            <div className="text-sm text-gray-500">
              <p>Document upload becomes available immediately after you submit this application and receive your application number, or you may return to this same link later to upload documents.</p>
            </div>
          )}

          {step === 6 && (
            <div className="text-sm space-y-3">
              <p className="text-gray-600">Please review your details before submitting. Once submitted, you'll receive a unique application number.</p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                <p><span className="text-gray-400">Student:</span> {form.student.name} ({form.student.classAppliedFor})</p>
                <p><span className="text-gray-400">Parent Phone:</span> {form.parent.phone}</p>
                <p><span className="text-gray-400">Parent Email:</span> {form.parent.email || '-'}</p>
                <p><span className="text-gray-400">Source:</span> {form.source}</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <button onClick={goBack} disabled={step === 1} className="flex items-center gap-1 text-sm text-gray-500 disabled:opacity-30 hover:text-gray-700">
              <ChevronLeft size={16} /> Previous
            </button>
            {step < STEPS.length ? (
              <button onClick={goNext} className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg">
                Save as Draft &amp; Next <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
                Submit Application
              </button>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">Auto-saved on every step &middot; Resume anytime using this page's link</p>
      </div>
    </div>
  );
};

const FormField = ({ label, value, onChange, type = 'text', required }) => (
  <div>
    <label className="block text-gray-600 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5" />
  </div>
);

export default PublicApplicationForm;
