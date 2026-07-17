import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { documentAPI } from '../services/api';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Share2,
  History,
  Eye,
  Edit2,
  Users,
  Bold,
  Italic,
  Code,
  Heading,
  Link as LinkIcon,
  List,
  ChevronRight,
  UserPlus,
  Trash2,
  Shield,
  EyeOff,
  Download,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const CATEGORIES = ['General', 'Work', 'Personal', 'Study', 'Archive'];

const Editor = () => {
  const { id: documentId } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  // Document details
  const [document, setDocument] = useState(null);
  const [role, setRole] = useState('viewer'); // owner, editor, viewer
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(true);

  // Split-screen editor layout state
  const [viewMode, setViewMode] = useState('split'); // 'split', 'write', 'preview'
  const [isTyping, setIsTyping] = useState(false);
  const [typers, setTypers] = useState([]); // List of other users currently typing

  // Collaboration state
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('editor');
  const [sharingLoading, setSharingLoading] = useState(false);

  // Version Control History state
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);

  // Saving states
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'

  // Ref for textarea & typing timeout
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // 1. Fetch document metadata
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await documentAPI.getDocumentById(documentId);
        setDocument(data.document);
        setRole(data.role);
        setTitle(data.document.title);
        setContent(data.document.content || '');
        setCategory(data.document.category || 'General');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load document');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [documentId, navigate]);

  // 2. Connect to Socket.IO and establish event bindings
  useEffect(() => {
    if (!socket || !document) return;

    // Join room
    socket.emit('join-document', { documentId, user });

    // Listeners
    socket.on('user-list', (users) => {
      setOnlineUsers(users);
    });

    socket.on('user-online', (users) => {
      setOnlineUsers(users);
    });

    socket.on('user-offline', (users) => {
      setOnlineUsers(users);
      const activeUserIds = users.map((u) => u.userId);
      setTypers((prev) => prev.filter((t) => activeUserIds.includes(t._id)));
    });

    socket.on('receive-changes', ({ content: newContent, selectionStart, selectionEnd }) => {
      const textarea = textareaRef.current;
      let start = 0;
      let end = 0;
      if (textarea) {
        start = textarea.selectionStart;
        end = textarea.selectionEnd;
      }

      setContent(newContent);

      setTimeout(() => {
        if (textarea) {
          textarea.setSelectionRange(start, end);
        }
      }, 0);
    });

    socket.on('typing', (typer) => {
      if (typer._id !== user._id) {
        setTypers((prev) => {
          if (prev.find((t) => t._id === typer._id)) return prev;
          return [...prev, typer];
        });
      }
    });

    socket.on('stop-typing', (typer) => {
      setTypers((prev) => prev.filter((t) => t._id !== typer._id));
    });

    return () => {
      socket.emit('leave-document', { documentId, userId: user._id });
      socket.off('user-list');
      socket.off('user-online');
      socket.off('user-offline');
      socket.off('receive-changes');
      socket.off('typing');
      socket.off('stop-typing');
    };
  }, [socket, document, documentId, user]);

  // 3. Local content updates and socket broadcasts
  const handleContentChange = (e) => {
    if (role === 'viewer') return;

    const newContent = e.target.value;
    setContent(newContent);
    setSaveStatus('unsaved');

    socket.emit('send-changes', {
      documentId,
      content: newContent,
      selectionStart: e.target.selectionStart,
      selectionEnd: e.target.selectionEnd,
      user,
    });

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { documentId, user });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop-typing', { documentId, user });
    }, 1500);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(() => {
      socket.emit('save-document', { documentId, content: newContent });
      
      documentAPI.updateDocument(documentId, { content: newContent })
        .then(() => setSaveStatus('saved'))
        .catch(() => setSaveStatus('unsaved'));
    }, 1500);
  };

  const handleTitleChange = async (e) => {
    if (role === 'viewer') return;
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    try {
      await documentAPI.updateDocument(documentId, { title: newTitle });
      setDocument((prev) => ({ ...prev, title: newTitle }));
    } catch (err) {
      toast.error('Failed to update title');
    }
  };

  const handleCategoryChange = async (e) => {
    if (role === 'viewer') return;
    const newCategory = e.target.value;
    setCategory(newCategory);
    
    try {
      await documentAPI.updateDocument(documentId, { category: newCategory });
      setDocument((prev) => ({ ...prev, category: newCategory }));
      toast.success(`Category updated to ${newCategory}`);
    } catch (err) {
      toast.error('Failed to update category');
    }
  };

  // 4. Formatting helper injection
  const insertMarkdown = (syntax) => {
    const textarea = textareaRef.current;
    if (!textarea || role === 'viewer') return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    let replacement = '';

    switch (syntax) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        break;
      case 'code':
        replacement = `\`${selectedText || 'code'}\``;
        break;
      case 'heading':
        replacement = `\n# ${selectedText || 'Heading'}`;
        break;
      case 'link':
        replacement = `[${selectedText || 'Link text'}](url)`;
        break;
      case 'list':
        replacement = `\n- ${selectedText || 'list item'}`;
        break;
      default:
        break;
    }

    const updatedText = text.substring(0, start) + replacement + text.substring(end);
    setContent(updatedText);

    socket.emit('send-changes', {
      documentId,
      content: updatedText,
      selectionStart: start,
      selectionEnd: start + replacement.length,
      user,
    });

    socket.emit('save-document', { documentId, content: updatedText });

    textarea.focus();
    setTimeout(() => {
      textarea.setSelectionRange(start, start + replacement.length);
    }, 0);
  };

  // 5. Sharing management
  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!shareEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    setSharingLoading(true);
    try {
      const { data } = await documentAPI.shareDocument({
        documentId,
        email: shareEmail,
        role: shareRole,
        remove: false,
      });
      setDocument(data);
      toast.success('Collaborator updated successfully!');
      setShareEmail('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to share document');
    } finally {
      setSharingLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorEmail) => {
    if (!window.confirm('Remove this collaborator?')) return;

    try {
      const { data } = await documentAPI.shareDocument({
        documentId,
        email: collaboratorEmail,
        remove: true,
      });
      setDocument(data);
      toast.success('Collaborator removed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove collaborator');
    }
  };

  // 6. Version control logging and rollbacks
  const fetchVersionHistory = async () => {
    setVersionsLoading(true);
    try {
      const { data } = await documentAPI.getVersionHistory(documentId);
      setVersions(data);
    } catch (error) {
      toast.error('Failed to load version history');
    } finally {
      setVersionsLoading(false);
    }
  };

  const toggleHistoryDrawer = () => {
    if (!showHistoryDrawer) {
      fetchVersionHistory();
    }
    setShowHistoryDrawer((prev) => !prev);
    setSelectedVersion(null);
  };

  const handleRollback = async (versionId) => {
    if (!window.confirm('Are you sure you want to rollback to this checkpoint? Current unsaved edits will be overridden.')) {
      return;
    }

    try {
      const { data } = await documentAPI.rollbackVersion(documentId, versionId);
      setContent(data.document.content);
      setDocument((prev) => ({ ...prev, content: data.document.content }));
      
      socket.emit('send-changes', {
        documentId,
        content: data.document.content,
        selectionStart: 0,
        selectionEnd: 0,
        user,
      });
      
      toast.success('Rollback completed!');
      setShowHistoryDrawer(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Rollback failed');
    }
  };

  // 7. File export downloader helper
  const downloadFile = (format) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.replace(/\s+/g, '_') || 'document'}.${format}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`Exported as ${format.toUpperCase()} successfully!`);
  };

  // Compute text statistics
  const getStats = () => {
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const readingTime = Math.ceil(words / 200);
    return { chars, words, readingTime };
  };
  const { chars, words, readingTime } = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* Editor Header Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-darkCard border border-gray-200/60 dark:border-darkBorder p-4 rounded-3xl shadow-sm">
        {/* Title input + Back to dashboard */}
        <div className="flex items-center space-x-3 flex-1">
          <Link
            to="/"
            className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-darkBorder/40 rounded-xl transition-all"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col flex-1">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              disabled={role === 'viewer'}
              className="text-lg font-bold bg-transparent border-b border-transparent hover:border-gray-200 dark:hover:border-darkBorder focus:border-primary-500 focus:border-b-2 text-gray-800 dark:text-white outline-none px-1 transition-all"
            />
            {/* Auto-saved notification tag */}
            <div className="flex items-center space-x-1.5 pl-1 mt-0.5 text-xs text-gray-400">
              <span
                className={`w-2 h-2 rounded-full ${
                  saveStatus === 'saved'
                    ? 'bg-green-500'
                    : saveStatus === 'saving'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-red-500'
                }`}
              />
              <span>
                {saveStatus === 'saved'
                  ? 'All changes saved'
                  : saveStatus === 'saving'
                  ? 'Saving changes...'
                  : 'Unsaved edits'}
              </span>
              <span className="h-3 w-px bg-gray-200 dark:bg-darkBorder mx-1" />
              <div className="flex items-center capitalize">
                <Shield className="w-3 h-3 mr-1 text-primary-500" />
                <span>{role} Permission</span>
              </div>
            </div>
          </div>
        </div>

        {/* Presence Indicator, Sharing and History drawers */}
        <div className="flex items-center justify-end space-x-3">
          {/* Active online users in this document */}
          <div className="flex items-center space-x-1.5 bg-gray-50 dark:bg-darkBorder/20 px-3 py-1.5 rounded-2xl border border-gray-100 dark:border-darkBorder/50">
            <Users className="w-4 h-4 text-primary-500" />
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 4).map((onlineUser, idx) => (
                <img
                  key={idx}
                  src={onlineUser.avatar}
                  alt={onlineUser.name}
                  title={`${onlineUser.name} (${onlineUser.email})`}
                  className="w-7 h-7 rounded-full border-2 border-white dark:border-darkCard object-cover"
                />
              ))}
              {onlineUsers.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center border-2 border-white dark:border-darkCard">
                  +{onlineUsers.length - 4}
                </div>
              )}
            </div>
          </div>

          {/* Export File Dropdown */}
          <div className="relative group">
            <button
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-darkBorder/40 dark:hover:bg-darkBorder/60 text-gray-700 dark:text-gray-200 font-semibold rounded-2xl transition-all outline-none"
              title="Export File"
            >
              <Download className="w-5 h-5" />
              <span className="hidden md:inline">Export</span>
            </button>
            <div className="absolute right-0 top-11 hidden group-hover:block bg-white dark:bg-darkCard border border-gray-200 dark:border-darkBorder p-1.5 rounded-2xl shadow-xl w-36 z-50 text-sm font-semibold transition-all">
              <button
                onClick={() => downloadFile('md')}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-darkBorder/50 rounded-xl text-gray-700 dark:text-gray-200"
              >
                Markdown (.md)
              </button>
              <button
                onClick={() => downloadFile('txt')}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-darkBorder/50 rounded-xl text-gray-700 dark:text-gray-200"
              >
                Plain Text (.txt)
              </button>
            </div>
          </div>

          {/* Versions Trigger */}
          <button
            onClick={toggleHistoryDrawer}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-darkBorder/40 dark:hover:bg-darkBorder/60 text-gray-700 dark:text-gray-200 font-semibold rounded-2xl transition-all outline-none"
            title="Version History"
          >
            <History className="w-5 h-5" />
            <span className="hidden md:inline">History</span>
          </button>

          {/* Share Modal Trigger */}
          {role === 'owner' && (
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-gradient-to-r from-primary-600 to-sky-500 hover:from-primary-700 hover:to-sky-600 text-white font-semibold rounded-2xl shadow-md transition-all outline-none"
            >
              <Share2 className="w-5 h-5" />
              <span className="hidden md:inline">Share</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Main Section */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        {/* Left pane: Editor view panel */}
        <div className="flex-1 flex flex-col bg-white dark:bg-darkCard border border-gray-200/60 dark:border-darkBorder rounded-3xl overflow-hidden shadow-sm">
          {/* Write pane toolbar */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-darkBorder px-4 py-2 bg-gray-50/50 dark:bg-darkCard/50">
            {/* View layout toggle triggers */}
            <div className="flex bg-gray-200/60 dark:bg-darkBorder/40 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('write')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'write'
                    ? 'bg-white dark:bg-darkCard text-primary-500 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Write Markdown"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-darkCard text-primary-500 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Split View"
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'preview'
                    ? 'bg-white dark:bg-darkCard text-primary-500 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Live Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* Markdown action toolbar (hidden for viewer or preview) */}
            {role !== 'viewer' && viewMode !== 'preview' && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => insertMarkdown('bold')}
                  className="p-1.5 hover:bg-gray-200/50 dark:hover:bg-darkBorder/40 rounded-lg text-gray-500 dark:text-gray-400"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown('italic')}
                  className="p-1.5 hover:bg-gray-200/50 dark:hover:bg-darkBorder/40 rounded-lg text-gray-500 dark:text-gray-400"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown('heading')}
                  className="p-1.5 hover:bg-gray-200/50 dark:hover:bg-darkBorder/40 rounded-lg text-gray-500 dark:text-gray-400"
                  title="Heading"
                >
                  <Heading className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown('code')}
                  className="p-1.5 hover:bg-gray-200/50 dark:hover:bg-darkBorder/40 rounded-lg text-gray-500 dark:text-gray-400"
                  title="Code snippet"
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown('link')}
                  className="p-1.5 hover:bg-gray-200/50 dark:hover:bg-darkBorder/40 rounded-lg text-gray-500 dark:text-gray-400"
                  title="Link insert"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => insertMarkdown('list')}
                  className="p-1.5 hover:bg-gray-200/50 dark:hover:bg-darkBorder/40 rounded-lg text-gray-500 dark:text-gray-400"
                  title="Bulleted List"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Code writing panel */}
          <div className="flex-1 flex overflow-hidden">
            {/* TEXTAREA WRITER */}
            {(viewMode === 'write' || viewMode === 'split') && (
              <div className="flex-1 relative h-full">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  readOnly={role === 'viewer'}
                  placeholder={
                    role === 'viewer'
                      ? 'This document is read-only...'
                      : 'Start typing markdown content here...'
                  }
                  className="w-full h-full p-6 text-gray-800 dark:text-gray-200 font-mono text-sm bg-transparent outline-none resize-none overflow-y-auto leading-relaxed"
                />
                
                {/* Typing Indicator bottom overlay */}
                {typers.length > 0 && (
                  <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-darkCard/90 border border-gray-100 dark:border-darkBorder/50 px-3 py-1.5 rounded-full shadow-md text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center space-x-2 animate-pulse">
                    <span className="flex space-x-1 items-center typing-dots text-primary-500">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                    <span>
                      {typers.map((t) => t.name).join(', ')}{' '}
                      {typers.length === 1 ? 'is' : 'are'} typing...
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* SPLIT SCREEN SEPARATOR */}
            {viewMode === 'split' && (
              <div className="w-[1px] bg-gray-200 dark:bg-darkBorder" />
            )}

            {/* MARKDOWN LIVE PREVIEW */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className="flex-1 p-6 overflow-y-auto h-full bg-gray-50/30 dark:bg-darkBg/10">
                {content.trim() ? (
                  <div className="markdown-preview">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <EyeOff className="w-8 h-8 opacity-40 mb-2" />
                    <span className="text-sm italic">Nothing to preview yet</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metric Status Bar Footer */}
          <div className="flex justify-between items-center px-6 py-2.5 border-t border-gray-200 dark:border-darkBorder bg-gray-50/30 dark:bg-darkCard/20 text-xs text-gray-550 dark:text-gray-400 font-semibold select-none">
            <div className="flex items-center space-x-4">
              <span>Words: {words}</span>
              <span className="h-3 w-px bg-gray-200 dark:bg-darkBorder" />
              <span>Characters: {chars}</span>
              <span className="h-3 w-px bg-gray-200 dark:bg-darkBorder" />
              <span>Est. Reading Time: {readingTime} min</span>
            </div>
            <div>
              {/* Category tag select parameter */}
              {role !== 'viewer' && (
                <div className="flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-450" />
                  <span className="hidden sm:inline">Category:</span>
                  <select
                    value={category}
                    onChange={handleCategoryChange}
                    className="bg-transparent border border-gray-200 dark:border-darkBorder hover:border-gray-300 dark:hover:border-darkBorder/80 rounded-lg px-2 py-0.5 outline-none font-semibold cursor-pointer text-gray-700 dark:text-gray-300"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Document Collaborators Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-darkCard rounded-3xl border border-gray-100 dark:border-darkBorder p-6 space-y-6 shadow-2xl relative animate-scaleUp">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Collaborator settings
                </h3>
                <p className="text-sm text-gray-400 mt-0.5">
                  Invite other users to view or edit this file
                </p>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-all"
              >
                ✕
              </button>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleShareSubmit} className="flex gap-2">
              <input
                type="email"
                placeholder="collab@docs.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                disabled={sharingLoading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder bg-gray-50 dark:bg-darkCard/50 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-all"
              />
              <select
                value={shareRole}
                onChange={(e) => setShareRole(e.target.value)}
                disabled={sharingLoading}
                className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder bg-gray-50 dark:bg-darkCard text-gray-700 dark:text-gray-200 outline-none text-sm font-semibold"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={sharingLoading}
                className="px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-primary-500/10 text-sm outline-none"
              >
                {sharingLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Invite</span>
                  </>
                )}
              </button>
            </form>

            {/* Collaborators List */}
            <div className="space-y-3">
              <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Who has access
              </span>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {/* Owner */}
                <div className="flex justify-between items-center bg-gray-50 dark:bg-darkBorder/20 px-3 py-2 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <img
                      src={document?.owner.avatar}
                      alt={document?.owner.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {document?.owner.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {document?.owner.email}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-primary-50 dark:bg-primary-950/40 text-primary-500 px-2.5 py-1 rounded-lg">
                    Owner
                  </span>
                </div>

                {/* Collaborators list items */}
                {document?.collaborators && document.collaborators.length > 0 ? (
                  document.collaborators.map((c, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center border border-gray-100 dark:border-darkBorder/40 px-3 py-2 rounded-xl"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={c.userId.avatar}
                          alt={c.userId.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {c.userId.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {c.userId.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold capitalize bg-gray-100 dark:bg-darkBorder text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">
                          {c.role}
                        </span>
                        <button
                          onClick={() => handleRemoveCollaborator(c.userId.email)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-all animate-fadeIn"
                          title="Remove Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-center text-gray-400 italic py-4">
                    No active collaborators yet. Invite using email above.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Control History Drawer */}
      {showHistoryDrawer && (
        <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-darkCard border-l border-gray-200 dark:border-darkBorder z-50 flex flex-col shadow-2xl animate-slideLeft">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-darkBorder p-5">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Version History
              </h3>
            </div>
            <button
              onClick={() => {
                setShowHistoryDrawer(false);
                setSelectedVersion(null);
              }}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-darkBorder/40 rounded-xl"
            >
              ✕
            </button>
          </div>

          {/* List panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {versionsLoading ? (
              <div className="py-12 flex justify-center">
                <Spinner size="medium" />
              </div>
            ) : selectedVersion ? (
              <div className="space-y-4 animate-fadeIn">
                <button
                  onClick={() => setSelectedVersion(null)}
                  className="flex items-center text-xs font-semibold text-primary-500 hover:underline mb-2"
                >
                  ← Back to version list
                </button>
                <div className="border border-gray-200 dark:border-darkBorder rounded-2xl p-4 bg-gray-50/50 dark:bg-darkCard/50 space-y-3">
                  <div className="flex items-center space-x-3 text-xs text-gray-400">
                    <img
                      src={selectedVersion.editedBy.avatar}
                      className="w-6 h-6 rounded-full object-cover"
                      alt={selectedVersion.editedBy.name}
                    />
                    <span>Created by {selectedVersion.editedBy.name}</span>
                  </div>
                  <span className="block text-xs font-semibold text-gray-500">
                    {new Date(selectedVersion.createdAt).toLocaleString()}
                  </span>
                  <hr className="border-gray-200 dark:border-darkBorder" />
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Content Snapshot
                  </span>
                  <div className="max-h-[300px] overflow-y-auto text-xs font-mono bg-white dark:bg-darkCard border border-gray-100 dark:border-darkBorder p-3 rounded-xl whitespace-pre-wrap dark:text-gray-300">
                    {selectedVersion.content || '(Empty content checkpoint)'}
                  </div>
                </div>
                {role !== 'viewer' && (
                  <button
                    onClick={() => handleRollback(selectedVersion._id)}
                    className="w-full py-3 bg-gradient-to-r from-primary-600 to-sky-500 hover:from-primary-700 hover:to-sky-600 text-white font-semibold rounded-2xl shadow-lg transition-all"
                  >
                    Restore This Version
                  </button>
                )}
              </div>
            ) : versions.length > 0 ? (
              versions.map((v, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedVersion(v)}
                  className="flex justify-between items-center border border-gray-100 dark:border-darkBorder/40 hover:border-primary-500/50 p-4 rounded-2xl cursor-pointer bg-gray-50/50 hover:bg-white dark:bg-darkCard/40 dark:hover:bg-darkCard hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col text-left space-y-1">
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary-500 transition-colors">
                      Checkpoint {versions.length - index}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(v.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <div className="flex items-center space-x-1.5 pt-1 text-[10px] text-gray-400">
                      <img
                        src={v.editedBy?.avatar}
                        className="w-4 h-4 rounded-full object-cover"
                        alt=""
                      />
                      <span>{v.editedBy?.name}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </div>
              ))
            ) : (
              <p className="text-sm text-center text-gray-400 italic py-12">
                No checkpoints logged yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
