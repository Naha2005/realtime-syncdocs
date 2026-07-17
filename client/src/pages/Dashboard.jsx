import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  FileText,
  Trash2,
  Edit3,
  Clock,
  User,
  Users,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';

const CATEGORIES = ['General', 'Work', 'Personal', 'Study', 'Archive'];

const Dashboard = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'owned', 'shared'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  
  // Create Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('Untitled Document');
  const [createCategory, setCreateCategory] = useState('General');
  const [creating, setCreating] = useState(false);

  // Rename Modal states
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [activeDocForRename, setActiveDocForRename] = useState(null);
  const [newTitle, setNewTitle] = useState('');

  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      const { data } = await documentAPI.getDocuments();
      setDocuments(data);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreateDocument = async () => {
    if (!createTitle.trim()) {
      toast.error('Document title is required');
      return;
    }

    setCreating(true);
    try {
      const { data } = await documentAPI.createDocument(createTitle, createCategory);
      toast.success('Document created!');
      navigate(`/documents/${data._id}`);
    } catch (error) {
      toast.error('Failed to create document');
    } finally {
      setCreating(false);
      setCreateModalOpen(false);
    }
  };

  const handleDeleteDocument = async (id, e) => {
    e.stopPropagation(); // Avoid triggering card navigation
    if (!window.confirm('Are you sure you want to delete this document? This action is permanent.')) {
      return;
    }

    try {
      await documentAPI.deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
      toast.success('Document deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete document');
    }
  };

  const openRenameModal = (doc, e) => {
    e.stopPropagation();
    setActiveDocForRename(doc);
    setNewTitle(doc.title);
    setRenameModalOpen(true);
  };

  const handleRenameDocument = async () => {
    if (!newTitle.trim()) {
      toast.error('Document title cannot be empty');
      return;
    }

    try {
      const { data } = await documentAPI.updateDocument(activeDocForRename._id, {
        title: newTitle,
      });
      setDocuments((prev) =>
        prev.map((doc) => (doc._id === data._id ? { ...doc, title: data.title } : doc))
      );
      toast.success('Document renamed');
      setRenameModalOpen(false);
      setActiveDocForRename(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to rename document');
    }
  };

  // Filter and search computation with safety checks for undefined properties
  const filteredDocuments = documents.filter((doc) => {
    if (!doc) return false;
    const titleText = doc.title || 'Untitled Document';
    const matchesSearch = titleText.toLowerCase().includes(searchQuery.toLowerCase());
    
    const docCategory = doc.category || 'General';
    const matchesCategory = selectedCategoryFilter === 'all' || docCategory === selectedCategoryFilter;
    
    const docOwnerId = doc.owner?._id || doc.owner || '';
    const isOwner = docOwnerId.toString() === user._id.toString();
    const matchesTab = filterTab === 'owned' ? isOwner : filterTab === 'shared' ? !isOwner : true;
    
    return matchesSearch && matchesCategory && matchesTab;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Upper Panel: Welcome + Create new document trigger */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white dark:bg-darkCard border border-gray-100 dark:border-darkBorder p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden transition-all duration-300">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Hello, {user.name}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Create, collaborate, and customize your documents in real-time.
          </p>
        </div>
        <button
          onClick={() => {
            setCreateTitle('Untitled Document');
            setCreateCategory('General');
            setCreateModalOpen(true);
          }}
          className="flex items-center justify-center space-x-2.5 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-sky-500 hover:from-primary-700 hover:to-sky-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary-500/25 transform hover:-translate-y-0.5 transition-all outline-none"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Document</span>
        </button>
      </div>

      {/* Filter Options Panel */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Tab filter buttons */}
          <div className="flex bg-gray-100 dark:bg-darkBorder/30 p-1.5 rounded-2xl border border-gray-200/50 dark:border-darkBorder/40 max-w-max">
            {['all', 'owned', 'shared'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
                  filterTab === tab
                    ? 'bg-white dark:bg-darkCard text-primary-500 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'all' ? 'All Docs' : tab === 'owned' ? 'Owned By Me' : 'Shared With'}
              </button>
            ))}
          </div>

          {/* Category Filter selector */}
          <div className="flex flex-wrap bg-gray-100 dark:bg-darkBorder/30 p-1.5 rounded-2xl border border-gray-200/50 dark:border-darkBorder/40 max-w-max gap-1">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategoryFilter === 'all'
                  ? 'bg-white dark:bg-darkCard text-primary-500 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-850 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategoryFilter === cat
                    ? 'bg-white dark:bg-darkCard text-primary-500 dark:text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-850 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full xl:max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-darkBorder bg-white dark:bg-darkCard text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Document Grid List */}
      {filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => {
            const isDocOwner = doc.owner._id === user._id;
            return (
              <div
                key={doc._id}
                onClick={() => navigate(`/documents/${doc._id}`)}
                className="group relative bg-white dark:bg-darkCard border border-gray-100 dark:border-darkBorder hover:border-primary-500/50 dark:hover:border-primary-500/50 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <div className="p-3 bg-gray-100 dark:bg-darkBorder/40 text-gray-500 dark:text-gray-400 rounded-2xl group-hover:bg-primary-500 group-hover:text-white transition-all shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    {/* Category pill indicator */}
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                      doc.category === 'Work' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      doc.category === 'Personal' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      doc.category === 'Study' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      doc.category === 'Archive' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-450' :
                      'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                    }`}>
                      {doc.category || 'General'}
                    </span>
                  </div>
                  
                  {/* Actions buttons */}
                  <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => openRenameModal(doc, e)}
                      className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-darkBorder/50 rounded-lg transition-all"
                      title="Rename"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {isDocOwner && (
                      <button
                        onClick={(e) => handleDeleteDocument(doc._id, e)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content info */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-primary-500 transition-colors line-clamp-1">
                    {doc.title}
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
                    {doc.content ? doc.content : 'Empty document content'}
                  </p>
                </div>

                {/* Footer metadata */}
                <div className="flex items-center justify-between border-t border-gray-100 dark:border-darkBorder/40 pt-4 text-xs text-gray-400 dark:text-gray-500">
                  <div className="flex items-center space-x-2">
                    {isDocOwner ? (
                      <div className="flex items-center space-x-1" title="You own this doc">
                        <User className="w-3.5 h-3.5 text-primary-500" />
                        <span className="font-semibold text-primary-500">Owner</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1" title={`Shared by ${doc.owner.name}`}>
                        <Users className="w-3.5 h-3.5 text-sky-500" />
                        <span className="truncate max-w-[80px]">{doc.owner.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {new Date(doc.updatedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-darkCard rounded-3xl border border-gray-100 dark:border-darkBorder text-center space-y-4">
          <div className="p-4 bg-gray-100 dark:bg-darkBorder/20 rounded-full text-gray-400">
            <FileText className="w-12 h-12" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-gray-800 dark:text-white">
              No documents found
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery || selectedCategoryFilter !== 'all' ? 'Try adjusting your search or category filters' : 'Start by creating your first document!'}
            </p>
          </div>
        </div>
      )}

      {/* Creation Document Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-darkCard rounded-3xl border border-gray-100 dark:border-darkBorder p-6 space-y-6 shadow-2xl relative animate-scaleUp">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Document
              </h3>
              <p className="text-sm text-gray-400">
                Name your file and select a category tag.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-darkBorder bg-gray-50 dark:bg-darkCard/50 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Category Tag
                </label>
                <select
                  value={createCategory}
                  onChange={(e) => setCreateCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-darkBorder bg-gray-50 dark:bg-darkCard/50 text-gray-850 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-semibold"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setCreateModalOpen(false)}
                disabled={creating}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder text-gray-500 hover:bg-gray-100 dark:hover:bg-darkBorder/40 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocument}
                disabled={creating}
                className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold flex items-center space-x-1.5 shadow-md shadow-primary-500/10"
              >
                {creating ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Create Document</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Document Modal */}
      {renameModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-darkCard rounded-3xl border border-gray-100 dark:border-darkBorder p-6 space-y-6 shadow-2xl relative animate-scaleUp">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Rename Document
              </h3>
              <p className="text-sm text-gray-400">
                Provide a new title for "{activeDocForRename?.title}".
              </p>
            </div>

            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-darkBorder bg-gray-50 dark:bg-darkCard/50 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setRenameModalOpen(false);
                  setActiveDocForRename(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-darkBorder text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-darkBorder/40 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameDocument}
                className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white transition-all font-semibold"
              >
                Save Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
