import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Resumes.css';

const RESUMES_STORAGE_KEY = 'tailorai_resumes_v1';

function DashboardResumes() {
  const [baseResume, setBaseResume] = useState('');
  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [editingError, setEditingError] = useState(null);
  const editingTextareaRef = useRef(null);
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

  // Inline editing handlers
  const startEditing = () => {
    if (!selectedResume) return;
    setIsEditing(true);
    setEditingError(null);
    setEditingContent(selectedResume.content || '');
    setTimeout(() => {
      editingTextareaRef.current?.focus();
      editingTextareaRef.current?.setSelectionRange(0, 0);
    }, 0);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingError(null);
    setEditingContent(selectedResume?.content || '');
  };

  const handleEditSave = () => {
    if (!selectedResume) return;
    const trimmed = editingContent.trim();
    if (!trimmed) {
      setEditingError('Provide resume content before saving.');
      return;
    }
    setResumes(prev =>
      prev.map(entry =>
        entry.jobId === selectedResume.jobId
          ? { ...entry, content: trimmed, optimizedAt: new Date().toISOString() }
          : entry
      )
    );
    setIsEditing(false);
    setEditingError(null);
    setEditingContent(trimmed);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        const snapshot = window.localStorage.getItem(RESUMES_STORAGE_KEY);
        const parsed = snapshot ? JSON.parse(snapshot) : {};
        const jobs = Array.isArray(parsed.jobs) ? parsed.jobs : [];
        const updatedJobs = jobs.map(entry =>
          entry.jobId === selectedResume.jobId
            ? { ...entry, content: trimmed, optimizedAt: new Date().toISOString() }
            : entry
        );
        window.localStorage.setItem(
          RESUMES_STORAGE_KEY,
          JSON.stringify({ ...parsed, jobs: updatedJobs })
        );
      } catch (err) {
        // ignore
      }
    }
  };

  const applyMarkdownSnippet = action => {
    const textarea = editingTextareaRef.current;
    if (!textarea) return;
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
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorStart, cursorEnd);
    }, 0);
  };

  return (
    <section className="dashboard-content resumes-layout">
      <article className="dashboard-card base-resume-card">
        <div className="card-header">
          <div className="card-header-main">
            <h2>Base Resume</h2>
            <span className="card-status">{baseResume ? 'Saved' : 'Add in Jobs view'}</span>
          </div>
          <button
            type="button"
            className="base-resume-button base-resume-button--ghost"
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
            {selectedResume && !isEditing ? (
              <button
                type="button"
                className="preview-edit-trigger"
                onClick={startEditing}
                title="Edit Resume Markdown"
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

          {!selectedResume ? (
            <p className="resume-empty">Select a tailored resume to preview.</p>
          ) : isEditing ? (
            <div className="job-preview-editor resume-preview-editor">
              <div className="markdown-toolbar" role="group" aria-label="Markdown formatting options">
                <button type="button" onClick={() => applyMarkdownSnippet('bold')}>Bold</button>
                <button type="button" onClick={() => applyMarkdownSnippet('italic')}>Italic</button>
                <button type="button" onClick={() => applyMarkdownSnippet('heading')}>Heading</button>
                <button type="button" onClick={() => applyMarkdownSnippet('bullet')}>Bullet List</button>
                <button type="button" onClick={() => applyMarkdownSnippet('numbered')}>Numbered List</button>
                <button type="button" onClick={() => applyMarkdownSnippet('quote')}>Quote</button>
              </div>
              <textarea
                ref={editingTextareaRef}
                className="job-preview-textarea resume-preview-textarea"
                value={editingContent}
                onChange={event => setEditingContent(event.target.value)}
                aria-label="Edit tailored resume Markdown"
                rows={14}
              />
              {editingError ? (
                <p className="job-preview-error resume-preview-error" role="alert">{editingError}</p>
              ) : null}
              <div className="job-preview-editor-actions resume-preview-editor-actions">
                <button type="button" className="editor-cancel" onClick={cancelEditing}>Cancel</button>
                <button type="button" className="editor-save" onClick={handleEditSave}>Save Changes</button>
              </div>
            </div>
          ) : (
            <div className="job-preview-content resume-preview-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedResume.content}</ReactMarkdown>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default DashboardResumes;
