import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  Briefcase,
  Camera,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ParsedResumeSnapshot {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills?: Array<{ name?: string }>;
  projects?: Array<{ name?: string }>;
  experiences?: Array<{ company?: string }>;
  aiConfidence?: number;
}

interface ProfileFormState {
  name: string;
  email: string;
  phone: string;
  location: string;
  avatar: string;
}

const createInitialFormState = (
  user: ReturnType<typeof useAuth>['user'],
  resumeSnapshot: ParsedResumeSnapshot | null
): ProfileFormState => ({
  name: user?.name || resumeSnapshot?.name || '',
  email: user?.email || resumeSnapshot?.email || '',
  phone: user?.contactInfo?.phone || resumeSnapshot?.phone || '',
  location: user?.contactInfo?.location || resumeSnapshot?.location || '',
  avatar: user?.avatar || '',
});

const fileToProfileImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSide = 360;
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Could not prepare image preview.'));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.86));
      };

      image.onerror = () => reject(new Error('Could not read the selected image.'));
      image.src = typeof reader.result === 'string' ? reader.result : '';
    };

    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });

export function Profile() {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const resumeSnapshot = useMemo(() => {
    const raw = localStorage.getItem('parsedResumeData');
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as ParsedResumeSnapshot;
    } catch {
      return null;
    }
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<ProfileFormState>(() => createInitialFormState(user, resumeSnapshot));

  useEffect(() => {
    setForm(createInitialFormState(user, resumeSnapshot));
  }, [user, resumeSnapshot]);

  const resumeSkills = Array.isArray(resumeSnapshot?.skills) ? resumeSnapshot.skills : [];
  const resumeProjects = Array.isArray(resumeSnapshot?.projects) ? resumeSnapshot.projects : [];
  const resumeExperiences = Array.isArray(resumeSnapshot?.experiences) ? resumeSnapshot.experiences : [];
  const profileSummary = resumeSnapshot?.summary?.trim()
    ? resumeSnapshot.summary
    : 'Add your contact details and upload a resume to keep your profile complete for assessments and job applications.';
  const confidenceText = resumeSnapshot
    ? `${Math.round((resumeSnapshot.aiConfidence || 0) * 100)}% confidence`
    : 'No resume scanned yet';

  const handleFieldChange = (field: keyof Omit<ProfileFormState, 'avatar'>, value: string) => {
    setFeedback(null);
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleEditToggle = () => {
    setFeedback(null);
    setIsEditing(true);
    requestAnimationFrame(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    });
  };

  const handleCancel = () => {
    setForm(createInitialFormState(user, resumeSnapshot));
    setFeedback(null);
    setIsEditing(false);
  };

  const profileInputClass = isEditing
    ? 'app-input w-full rounded-2xl border-indigo-400/50 px-4 py-3 text-sm font-medium shadow-sm ring-2 ring-indigo-500/15 transition'
    : 'app-input w-full rounded-2xl px-4 py-3 text-sm font-medium transition';

  const handlePhotoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', text: 'Please choose an image file for your profile photo.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'Please upload an image smaller than 5 MB.' });
      return;
    }

    try {
      const avatar = await fileToProfileImage(file);
      setForm((current) => ({ ...current, avatar }));
      setIsEditing(true);
      setFeedback({ type: 'success', text: 'Profile photo is ready. Save changes to keep it.' });
    } catch (error) {
      setFeedback({ type: 'error', text: (error as Error).message || 'Could not upload that image.' });
    }
  };

  const handleRemovePhoto = () => {
    setForm((current) => ({ ...current, avatar: '' }));
    setIsEditing(true);
    setFeedback(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    if (!form.name.trim()) {
      setFeedback({ type: 'error', text: 'Please enter your name before saving.' });
      return;
    }

    if (!form.email.trim()) {
      setFeedback({ type: 'error', text: 'Please enter your email address before saving.' });
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser = await updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: form.location.trim(),
        avatar: form.avatar,
      });

      setForm(createInitialFormState(updatedUser, resumeSnapshot));
      setIsEditing(false);
      setFeedback({ type: 'success', text: 'Profile updated successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', text: (error as Error).message || 'Could not save your profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="exam-flow-shell p-6">
      <div className="exam-flow-container max-w-6xl">
        <form onSubmit={handleSave} className="space-y-6">
          <section className="exam-flow-card-strong p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="relative">
                  <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-xl">
                    {form.avatar ? (
                      <img src={form.avatar} alt={form.name || 'Candidate'} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-12 w-12" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg transition hover:scale-[1.03]"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                <div className="flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h1 className="exam-flow-title text-3xl font-bold">{form.name || 'Candidate'}</h1>
                    <span className="exam-flow-hero-badge">
                      <BadgeCheck className="h-4 w-4" />
                      {user?.role || 'candidate'}
                    </span>
                  </div>
                  <p className="exam-flow-muted max-w-2xl text-base">
                    Manage your personal details, profile photo, and resume insights in one place.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5"
                    >
                      <Upload className="h-4 w-4" />
                      {form.avatar ? 'Change photo' : 'Upload photo'}
                    </button>

                    {form.avatar ? (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/15 dark:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove photo
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="w-full space-y-4 xl:max-w-sm">
                <div className="exam-flow-card p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    <h2 className="exam-flow-title text-lg font-semibold">Account Status</h2>
                  </div>
                  <div className="space-y-3">
                    <div className="exam-flow-stat-card p-4">
                      <p className="exam-flow-muted text-sm">Onboarding</p>
                      <p className="exam-flow-title mt-1 font-semibold">
                        {user?.onboardingComplete ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                    <div className="exam-flow-stat-card p-4">
                      <p className="exam-flow-muted text-sm">TalentLeague Snapshot</p>
                      <p className="exam-flow-title mt-1 font-semibold">{confidenceText}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {isEditing ? (
                    <>
                      <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                        <Edit3 className="h-4 w-4" />
                        Editing enabled
                      </div>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Saving...' : 'Save changes'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEditToggle}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {feedback ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                feedback.type === 'success'
                  ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                  : 'border-rose-400/30 bg-rose-500/10 text-rose-700 dark:text-rose-200'
              }`}
            >
              {feedback.text}
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="exam-flow-card p-6">
              <div className="mb-5 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600" />
                <h2 className="exam-flow-title text-xl font-semibold">Personal Information</h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="exam-flow-stat-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-indigo-600" />
                    <p className="exam-flow-muted text-sm">Full name</p>
                  </div>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={form.name}
                    onChange={(event) => handleFieldChange('name', event.target.value)}
                    readOnly={!isEditing}
                    aria-readonly={!isEditing}
                    className={profileInputClass}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="exam-flow-stat-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-indigo-600" />
                    <p className="exam-flow-muted text-sm">Email</p>
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => handleFieldChange('email', event.target.value)}
                    readOnly={!isEditing}
                    aria-readonly={!isEditing}
                    className={profileInputClass}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="exam-flow-stat-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-indigo-600" />
                    <p className="exam-flow-muted text-sm">Phone</p>
                  </div>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => handleFieldChange('phone', event.target.value)}
                    readOnly={!isEditing}
                    aria-readonly={!isEditing}
                    className={profileInputClass}
                    placeholder="Add your phone number"
                  />
                </div>

                <div className="exam-flow-stat-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-600" />
                    <p className="exam-flow-muted text-sm">Location</p>
                  </div>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(event) => handleFieldChange('location', event.target.value)}
                    readOnly={!isEditing}
                    aria-readonly={!isEditing}
                    className={profileInputClass}
                    placeholder="Add your city or location"
                  />
                </div>

                <div className="exam-flow-stat-card p-4 sm:col-span-2">
                  <div className="mb-2 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-indigo-600" />
                    <p className="exam-flow-muted text-sm">Role</p>
                  </div>
                  <p className="exam-flow-title rounded-2xl bg-slate-100/80 px-4 py-3 text-sm font-semibold capitalize dark:bg-white/5">
                    {user?.role || 'candidate'}
                  </p>
                </div>
              </div>

              <div className="exam-flow-soft-card mt-5 p-5">
                <p className="exam-flow-muted mb-2 text-sm">Profile Summary</p>
                <p className="exam-flow-title leading-7">{profileSummary}</p>
              </div>

              <p className="exam-flow-muted mt-4 text-xs">
                Changing the email here will also change the email used for your next password login and job assessment links.
              </p>
            </section>

            <section className="space-y-6">
              <div className="exam-flow-card p-6">
                <h2 className="exam-flow-title mb-4 text-xl font-semibold">Resume Insights</h2>
                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                  <div className="exam-flow-stat-card p-4">
                    <p className="exam-flow-muted text-sm">Skills</p>
                    <p className="exam-flow-title mt-1 text-2xl font-bold">{resumeSkills.length}</p>
                  </div>
                  <div className="exam-flow-stat-card p-4">
                    <p className="exam-flow-muted text-sm">Projects</p>
                    <p className="exam-flow-title mt-1 text-2xl font-bold">{resumeProjects.length}</p>
                  </div>
                  <div className="exam-flow-stat-card p-4">
                    <p className="exam-flow-muted text-sm">Experiences</p>
                    <p className="exam-flow-title mt-1 text-2xl font-bold">{resumeExperiences.length}</p>
                  </div>
                </div>
              </div>

              <div className="exam-flow-card p-6">
                <h2 className="exam-flow-title mb-4 text-xl font-semibold">Top Skills</h2>
                {resumeSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {resumeSkills.slice(0, 12).map((skill, index) => (
                      <span key={`${skill.name || 'skill'}-${index}`} className="exam-flow-chip text-sm">
                        {skill.name || 'Skill'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="exam-flow-muted text-sm">
                    No skills found yet. Upload or scan your resume to populate this section.
                  </p>
                )}
              </div>
            </section>
          </div>
        </form>
      </div>
    </div>
  );
}
