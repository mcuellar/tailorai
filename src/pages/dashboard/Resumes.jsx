import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Resumes.css';

const RESUMES_STORAGE_KEY = 'tailorai_resumes_v1';

function DashboardResumes() {
  const [baseResume, setBaseResume] = useState('');
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const highlightJobId = location.state?.highlightJobId ?? null;

  const dateFormatter = useMemo(
    () =>
      typeof Intl !== 'undefined'
        ? new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : null,
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const loadResumes = () => {
      try {
        const stored = window.localStorage.getItem(RESUMES_STORAGE_KEY);
        if (!stored) {
          setBaseResume('');
          setResumes([]);
          setSelectedResumeId(null);
          return;
        }

        const parsed = JSON.parse(stored);
        const entries = Array.isArray(parsed?.jobs) ? parsed.jobs : [];

        setBaseResume(parsed?.baseResume || '');
        setResumes(entries);

        if (entries.length > 0) {
          const nextSelected =
            highlightJobId && entries.some(entry => entry.jobId === highlightJobId)
              ? highlightJobId
              : entries[0].jobId;
          setSelectedResumeId(nextSelected);
        } else {
          setSelectedResumeId(null);
        }
      } catch (storageError) {
        console.warn('[TailorAI] Unable to load resumes from localStorage.', storageError);
      }
    };

    loadResumes();

    const handleStorage = event => {
      if (event.key === RESUMES_STORAGE_KEY) {
        loadResumes();
      }
    };

    window.addEventListener('storage', handleStorage);

    if (highlightJobId) {
      navigate('/dashboard/resumes', { replace: true, state: null });
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [highlightJobId, navigate]);

  const selectedResume = resumes.find(entry => entry.jobId === selectedResumeId) || null;

  return (
    <section className="dashboard-content resumes-layout">
      <article className="dashboard-card resume-base-card">
        <div className="card-header">
          <div className="card-header-main">
            <h2>Base Resume</h2>
            <span className="card-status">{baseResume ? 'Saved' : 'Add in Jobs view'}</span>
          </div>
          <button
            type="button"
            className="resume-edit-base"
            onClick={() => navigate('/dashboard')}
          >
            Edit in Jobs
          </button>
        </div>
        {baseResume ? (
          <div className="resume-base-preview">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{baseResume}</ReactMarkdown>
          </div>
        ) : (
          <p className="resume-empty">
            Save your base resume in the Jobs screen to start generating tailored resumes.
          </p>
        )}
      </article>

      <div className="jobs-grid resumes-grid">
        <article className="dashboard-card resume-list-card">
          <div className="card-header">
            <div className="card-header-main">
              <h2>My Resumes</h2>
              <span className="card-status">{resumes.length} saved</span>
            </div>
          </div>

          {resumes.length === 0 ? (
            <p className="resume-empty">No tailored resumes yet. Optimize a job from the Jobs screen to create one.</p>
          ) : (
            <ul className="job-list" role="list">
              {resumes.map(entry => (
                <li
                  key={entry.jobId}
                  className={`job-list-item${entry.jobId === selectedResumeId ? ' is-active' : ''}`}
                >
                  <button
                    type="button"
                    className="job-list-trigger"
                    onClick={() => setSelectedResumeId(entry.jobId)}
                    aria-pressed={entry.jobId === selectedResumeId}
                  >
                    <span className="job-list-title">{entry.title || 'Untitled Resume'}</span>
                    {dateFormatter && entry.optimizedAt ? (
                      <span className="job-list-timestamp">
                        Tailored {dateFormatter.format(new Date(entry.optimizedAt))}
                      </span>
                    ) : null}
                  </button>
                  <div className="job-list-actions">
                    <button
                      type="button"
                      className="job-action-button job-action-button--ghost"
                      onClick={() => navigate('/dashboard', { state: { jobId: entry.jobId, previewMode: 'resume' } })}
                    >
                      View in Jobs
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="dashboard-card resume-preview-card">
          <div className="card-header">
            <div className="card-header-main">
              <h2>Preview</h2>
              <span className="card-status">Tailored Resume</span>
            </div>
          </div>

          {!selectedResume ? (
            <p className="resume-empty">Select a tailored resume to preview.</p>
          ) : (
            <div className="resume-preview-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedResume.content}</ReactMarkdown>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default DashboardResumes;
