import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [editingError, setEditingError] = useState(null);
  const editingTextareaRef = useRef(null);

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
    if (isEditing) {
      setIsEditing(false);
      setEditingError(null);
    }
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
    setIsEditing(false);
    setEditingContent('');
    setEditingError(null);
  };
  
  const startEditing = () => {
    if (!selectedJob) {
      return;
    }
    setIsEditing(true);
    setEditingError(null);
    setEditingContent(selectedJob.formatted || selectedJob.original || '');
    requestAnimationFrame(() => {
      editingTextareaRef.current?.focus();
      editingTextareaRef.current?.setSelectionRange(0, 0);
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingError(null);
    setEditingContent(selectedJob?.formatted || '');
  };

  const handleEditSave = () => {
    if (!selectedJob) {
      return;
    }

    const trimmed = editingContent.trim();
    if (!trimmed) {
      setEditingError('Provide Markdown content before saving.');
      return;
    }

    setJobs(prev =>
      prev.map(job =>
        job.id === selectedJob.id
          ? {
              ...job,
              formatted: trimmed,
              updatedAt: new Date().toISOString(),
            }
          : job,
      ),
    );

    setIsEditing(false);
    setEditingError(null);
  };

  const applyMarkdownSnippet = action => {
    const textarea = editingTextareaRef.current;
    if (!textarea) {
      return;
    }

    const { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.slice(selectionStart, selectionEnd);
    let updatedValue = value;
    let cursorStart = selectionStart;
    let cursorEnd = selectionEnd;

    const wrapSelection = (before, after, placeholder = '') => {
      const insert = selectedText || placeholder;
      updatedValue = `${value.slice(0, selectionStart)}${before}${insert}${after}${value.slice(selectionEnd)}`;
      cursorStart = selectionStart + before.length;
      cursorEnd = cursorStart + insert.length;
    };

    switch (action) {
      case 'bold':
        wrapSelection('**', '**', 'bold text');
        break;
      case 'italic':
        wrapSelection('_', '_', 'italic text');
        break;
      case 'heading': {
        const lines = value.split('\n');
        const startLineIndex = value.slice(0, selectionStart).split('\n').length - 1;
        const line = lines[startLineIndex] ?? '';
        const trimmedLine = line.replace(/^#+\s*/, '');
        lines[startLineIndex] = `## ${trimmedLine || 'Heading'}`;
        updatedValue = lines.join('\n');
        cursorStart = value.indexOf(line);
        cursorEnd = cursorStart + lines[startLineIndex].length;
        break;
      }
      case 'bullet': {
        const before = value.slice(0, selectionStart);
        const selected = value.slice(selectionStart, selectionEnd) || 'List item';
        const after = value.slice(selectionEnd);
        const formatted = selected
          .split('\n')
          .map(line => (line.trim().startsWith('- ') ? line : `- ${line.trim()}`))
          .join('\n');
        updatedValue = `${before}${formatted}${after}`;
        cursorStart = selectionStart;
        cursorEnd = selectionStart + formatted.length;
        break;
      }
      case 'numbered': {
        const before = value.slice(0, selectionStart);
        const selected = value.slice(selectionStart, selectionEnd) || 'First item\nSecond item';
        const formatted = selected
          .split('\n')
          .map((line, index) => {
            const trimmed = line.trim().replace(/^\d+\.\s*/, '');
            return `${index + 1}. ${trimmed}`;
          })
          .join('\n');
        updatedValue = `${before}${formatted}${value.slice(selectionEnd)}`;
        cursorStart = selectionStart;
        cursorEnd = selectionStart + formatted.length;
        break;
      }
      case 'quote': {
        const before = value.slice(0, selectionStart);
        const selected = value.slice(selectionStart, selectionEnd) || 'Quoted text';
        const formatted = selected
          .split('\n')
          .map(line => (line.trim().startsWith('>') ? line : `> ${line.trim()}`))
          .join('\n');
        updatedValue = `${before}${formatted}${value.slice(selectionEnd)}`;
        cursorStart = selectionStart;
        cursorEnd = selectionStart + formatted.length;
        break;
      }
      default:
        return;
    }

    setEditingContent(updatedValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  useEffect(() => {
    if (!selectedJob) {
      setIsEditing(false);
      setEditingContent('');
      return;
    }

    if (!isEditing) {
      setEditingContent(selectedJob.formatted || selectedJob.original || '');
    }
  }, [selectedJob, isEditing]);

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
          <div className="card-header-main">
            <h2>Add a Job</h2>
            <span className="card-status">AI Markdown Formatting</span>
          </div>
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
            <div className="card-header-main">
              <h2>Your Jobs</h2>
              <span className="card-status">{jobs.length} saved</span>
            </div>
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
                    {/* Edit button removed from job list; editing is now only available in the Preview pane */}
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
            <div className="card-header-main">
              <h2>Preview</h2>
              <span className="card-status">Markdown</span>
            </div>
            {selectedJob && !isEditing ? (
              <button
                type="button"
                className="preview-edit-trigger"
                onClick={startEditing}
                title="Edit Markdown"
              >
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
                  <path
                    d="M5 18.5 3.5 20 4 17l9.5-9.5 2 2L5 18.5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m14.5 5.5 2-2 2 2-2 2-2-2Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : null}
          </div>

          {!selectedJob ? (
            <p className="job-preview-empty">
              Select a job to see the AI-formatted Markdown preview.
            </p>
          ) : isEditing ? (
            <div className="job-preview-editor">
              <div className="markdown-toolbar" role="group" aria-label="Markdown formatting options">
                <button type="button" onClick={() => applyMarkdownSnippet('bold')}>
                  Bold
                </button>
                <button type="button" onClick={() => applyMarkdownSnippet('italic')}>
                  Italic
                </button>
                <button type="button" onClick={() => applyMarkdownSnippet('heading')}>
                  Heading
                </button>
                <button type="button" onClick={() => applyMarkdownSnippet('bullet')}>
                  Bullet List
                </button>
                <button type="button" onClick={() => applyMarkdownSnippet('numbered')}>
                  Numbered List
                </button>
                <button type="button" onClick={() => applyMarkdownSnippet('quote')}>
                  Quote
                </button>
              </div>
              <textarea
                ref={editingTextareaRef}
                className="job-preview-textarea"
                value={editingContent}
                onChange={event => setEditingContent(event.target.value)}
                aria-label="Edit job Markdown"
              />
              {editingError ? (
                <p className="job-preview-error" role="alert">
                  {editingError}
                </p>
              ) : null}
              <div className="job-preview-editor-actions">
                <button type="button" className="editor-cancel" onClick={cancelEditing}>
                  Cancel
                </button>
                <button type="button" className="editor-save" onClick={handleEditSave}>
                  Save Changes
                </button>
              </div>
            </div>
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
