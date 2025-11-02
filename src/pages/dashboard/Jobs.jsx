import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatJobDescription } from '../../services/openai';

const STORAGE_KEY = 'tailorai_jobs_v1';

function DashboardJobs() {
  const [jobInput, setJobInput] = useState('');
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [pendingDeleteJob, setPendingDeleteJob] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setJobs(parsed);
          setSelectedJobId(parsed[0].id);
        }
      }
    } catch (storageError) {
      console.warn('[TailorAI] Unable to hydrate saved jobs from localStorage.', storageError);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
    } catch (storageError) {
      console.warn('[TailorAI] Unable to persist jobs to localStorage.', storageError);
    }
  }, [jobs]);

  useEffect(() => {
    if (!selectedJobId && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
      return;
    }

    if (selectedJobId && !jobs.some(job => job.id === selectedJobId)) {
      setSelectedJobId(jobs[0]?.id ?? null);
    }
  }, [jobs, selectedJobId]);

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

  const selectedJob = jobs.find(job => job.id === selectedJobId) || null;

  const handleSave = async event => {
    event.preventDefault();

    const trimmed = jobInput.trim();
    if (!trimmed) {
      setError('Paste a job description before saving.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const formatted = await formatJobDescription(trimmed);
      const job = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        original: trimmed,
        formatted,
        createdAt: new Date().toISOString(),
      };

      setJobs(prev => [job, ...prev]);
      setSelectedJobId(job.id);
      setJobInput('');
    } catch (formatError) {
      console.error('[TailorAI] Unable to save job description.', formatError);
      setError(formatError.message || 'Unable to save job. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectJob = jobId => {
    setSelectedJobId(jobId);
  };

  const handleDeleteRequest = job => {
    setPendingDeleteJob(job);
  };

  const handleDeleteCancel = () => {
    setPendingDeleteJob(null);
  };

  const handleDeleteConfirm = () => {
    if (!pendingDeleteJob) {
      return;
    }

    const jobId = pendingDeleteJob.id;

    setJobs(prev => {
      const updated = prev.filter(item => item.id !== jobId);
      if (selectedJobId === jobId) {
        setSelectedJobId(updated[0]?.id ?? null);
      }
      return updated;
    });

    setPendingDeleteJob(null);
  };

  const getJobTitle = job => {
    const source = (job.formatted || job.original || '').toString();
    const lines = source
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      return 'Untitled Job';
    }

    const firstContentLine = lines.find(line => !line.startsWith('![')) ?? lines[0];
    return firstContentLine.replace(/^#+\s*/, '') || 'Untitled Job';
  };

  const getJobSnippet = job => {
    const source = (job.formatted || job.original || '').toString();
    const plain = source.replace(/[#*_`>-]/g, '').replace(/\s+/g, ' ').trim();
    if (plain.length <= 120) {
      return plain;
    }
    return `${plain.slice(0, 117)}…`;
  };

  return (
    <section className="dashboard-content jobs-layout">
      <article className="dashboard-card job-entry-card">
        <div className="card-header">
          <h2>Add a Job</h2>
          <span className="card-status">AI Markdown Formatting</span>
        </div>
        <p>Paste a new job description below and TailorAI will polish it as Markdown once you save.</p>

        <form className="job-entry-form" onSubmit={handleSave}>
          <label htmlFor="job-description" className="job-entry-label">
            Job Description
          </label>
          <textarea
            id="job-description"
            name="job-description"
            className="job-entry-textarea"
            placeholder="Paste the full job description here..."
            value={jobInput}
            onChange={event => setJobInput(event.target.value)}
            disabled={isSaving}
            required
          />

          {error ? <p className="job-entry-error" role="alert">{error}</p> : null}

          <div className="job-entry-actions">
            <span className="job-entry-hint">Supports plain text or Markdown snippets.</span>
            <button type="submit" className="job-entry-save" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </article>

      <div className="jobs-grid">
        <article className="dashboard-card job-list-card">
          <div className="card-header">
            <h2>Your Jobs</h2>
            <span className="card-status">{jobs.length} saved</span>
          </div>

          {jobs.length === 0 ? (
            <p className="job-list-empty">No jobs yet. Save your first job description to get started.</p>
          ) : (
            <ul className="job-list" role="list">
              {jobs.map(job => (
                <li
                  key={job.id}
                  className={`job-list-item${job.id === selectedJobId ? ' is-active' : ''}`}
                >
                  <button
                    type="button"
                    className="job-list-trigger"
                    onClick={() => handleSelectJob(job.id)}
                    aria-pressed={job.id === selectedJobId}
                  >
                    <span className="job-list-title">{getJobTitle(job)}</span>
                    <span className="job-list-snippet">{getJobSnippet(job)}</span>
                    {dateFormatter ? (
                      <span className="job-list-timestamp">
                        Saved {dateFormatter.format(new Date(job.createdAt))}
                      </span>
                    ) : null}
                  </button>
                  <div className="job-list-actions">
                    <button
                      type="button"
                      className="job-action-button"
                      onClick={() => handleSelectJob(job.id)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="job-action-button job-action-button--ghost"
                      title="Optimize coming soon"
                      disabled
                    >
                      Optimize
                    </button>
                    <button
                      type="button"
                      className="job-action-button job-action-button--danger"
                      onClick={() => handleDeleteRequest(job)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="dashboard-card job-preview-card">
          <div className="card-header">
            <h2>Preview</h2>
            <span className="card-status">Markdown</span>
          </div>

          {!selectedJob ? (
            <p className="job-preview-empty">
              Select a job to see the AI-formatted Markdown preview.
            </p>
          ) : (
            <div className="job-preview-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedJob.formatted}</ReactMarkdown>
            </div>
          )}
        </article>
      </div>

      {pendingDeleteJob ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-job-title" aria-describedby="delete-job-description">
          <div className="modal">
            <h3 id="delete-job-title" className="modal-title">Delete job?</h3>
            <p id="delete-job-description" className="modal-description">
              "{getJobTitle(pendingDeleteJob)}" will be permanently removed. This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="modal-button modal-button--secondary" onClick={handleDeleteCancel}>
                Keep job
              </button>
              <button type="button" className="modal-button modal-button--danger" onClick={handleDeleteConfirm}>
                Delete job
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default DashboardJobs;
