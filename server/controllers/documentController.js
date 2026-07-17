import Document from '../models/Document.js';
import User from '../models/User.js';
import Version from '../models/Version.js';
import { memoryDb, isDbConnected, generateId, saveDb } from '../config/inMemoryDB.js';

// Helper: Check if user is owner of the document
const isOwner = (document, userId) => {
  if (!document || !document.owner || !userId) return false;
  const ownerId = document.owner._id 
    ? document.owner._id.toString() 
    : document.owner.toString();
  return ownerId === userId.toString();
};

// Helper: Get user's role on the document
const getRole = (document, userId) => {
  if (!document || !userId) return null;
  if (isOwner(document, userId)) return 'owner';
  const collaborator = document.collaborators.find((c) => {
    if (!c || !c.userId) return false;
    const colUserId = c.userId._id 
      ? c.userId._id.toString() 
      : c.userId.toString();
    return colUserId === userId.toString();
  });
  return collaborator ? collaborator.role : null;
};

// Helper: Populates a mock document with user objects from memoryDb
const populateMockDoc = (doc) => {
  const ownerUser = memoryDb.users.find((u) => u._id === doc.owner) || {
    _id: doc.owner,
    name: 'Unknown Owner',
    email: '',
    avatar: '',
  };
  
  const populatedCollaborators = doc.collaborators.map((c) => {
    const colUser = memoryDb.users.find((u) => u._id === (c.userId._id || c.userId)) || {
      _id: c.userId,
      name: 'Unknown Collaborator',
      email: '',
      avatar: '',
    };
    return {
      userId: {
        _id: colUser._id,
        name: colUser.name,
        email: colUser.email,
        avatar: colUser.avatar,
      },
      role: c.role,
    };
  });

  return {
    ...doc,
    owner: {
      _id: ownerUser._id,
      name: ownerUser.name,
      email: ownerUser.email,
      avatar: ownerUser.avatar,
    },
    collaborators: populatedCollaborators,
  };
};

// @desc    Get all documents for the current user (owned or shared)
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res) => {
  try {
    // Database Connected Mode
    if (isDbConnected()) {
      const documents = await Document.find({
        $or: [
          { owner: req.user._id },
          { 'collaborators.userId': req.user._id },
        ],
      })
        .populate('owner', 'name email avatar')
        .populate('collaborators.userId', 'name email avatar')
        .sort({ updatedAt: -1 });

      return res.json(documents);
    }

    // In-Memory Fallback Mode
    const userDocs = memoryDb.documents.filter((doc) => {
      if (!doc || !doc.owner) return false;
      const ownerId = doc.owner._id ? doc.owner._id.toString() : doc.owner.toString();
      const isDocOwner = ownerId === req.user._id.toString();
      
      const isCollaborator = doc.collaborators && doc.collaborators.some((c) => {
        if (!c || !c.userId) return false;
        const colId = c.userId._id ? c.userId._id.toString() : c.userId.toString();
        return colId === req.user._id.toString();
      });
      
      return isDocOwner || isCollaborator;
    });

    const populated = userDocs.map(populateMockDoc).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new document
// @route   POST /api/documents
// @access  Private
export const createDocument = async (req, res) => {
  const { title, category } = req.body;

  try {
    // Database Connected Mode
    if (isDbConnected()) {
      const document = await Document.create({
        title: title || 'Untitled Document',
        content: '',
        owner: req.user._id,
        collaborators: [],
        category: category || 'General',
      });

      await Version.create({
        documentId: document._id,
        content: '',
        editedBy: req.user._id,
      });

      const populatedDoc = await Document.findById(document._id)
        .populate('owner', 'name email avatar');

      return res.status(201).json(populatedDoc);
    }

    // In-Memory Fallback Mode
    const mockDoc = {
      _id: generateId(),
      title: title || 'Untitled Document',
      content: '',
      owner: req.user._id,
      collaborators: [],
      category: category || 'General',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryDb.documents.push(mockDoc);

    // Initial version
    memoryDb.versions.push({
      _id: generateId(),
      documentId: mockDoc._id,
      content: '',
      editedBy: req.user._id,
      createdAt: new Date(),
    });

    saveDb();

    const populated = populateMockDoc(mockDoc);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single document details by ID
// @route   GET /api/documents/:id
// @access  Private
export const getDocumentById = async (req, res) => {
  try {
    // Database Connected Mode
    if (isDbConnected()) {
      const document = await Document.findById(req.params.id)
        .populate('owner', 'name email avatar')
        .populate('collaborators.userId', 'name email avatar');

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const role = getRole(document, req.user._id);
      if (!role) {
        return res.status(403).json({ message: 'Access denied: Not authorized' });
      }

      return res.json({ document, role });
    }

    // In-Memory Fallback Mode
    const doc = memoryDb.documents.find((d) => d._id === req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found (In-Memory Database)' });
    }

    const role = getRole(doc, req.user._id);
    if (!role) {
      return res.status(403).json({ message: 'Access denied: Not authorized (In-Memory Database)' });
    }

    const populated = populateMockDoc(doc);
    res.json({ document: populated, role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update document content or title (Auto-saves changes & logs version if needed)
// @route   PUT /api/documents/:id
// @access  Private
export const updateDocument = async (req, res) => {
  const { title, content, category } = req.body;

  try {
    // Database Connected Mode
    if (isDbConnected()) {
      const document = await Document.findById(req.params.id);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const role = getRole(document, req.user._id);
      if (role !== 'owner' && role !== 'editor') {
        return res.status(403).json({ message: 'Access denied: Read-only permissions' });
      }

      if (title !== undefined) document.title = title;
      if (content !== undefined) document.content = content;
      if (category !== undefined) document.category = category;

      await document.save();

      const lastVersion = await Version.findOne({ documentId: document._id }).sort({ createdAt: -1 });
      if (!lastVersion || lastVersion.content !== content) {
        const timeDiff = lastVersion ? Date.now() - new Date(lastVersion.createdAt).getTime() : Infinity;
        if (timeDiff > 120000 || !lastVersion) {
          await Version.create({
            documentId: document._id,
            content: content || '',
            editedBy: req.user._id,
          });
        }
      }

      const populatedDoc = await Document.findById(document._id)
        .populate('owner', 'name email avatar')
        .populate('collaborators.userId', 'name email avatar');

      return res.json(populatedDoc);
    }

    // In-Memory Fallback Mode
    const docIndex = memoryDb.documents.findIndex((d) => d._id === req.params.id);
    if (docIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const doc = memoryDb.documents[docIndex];
    const role = getRole(doc, req.user._id);
    if (role !== 'owner' && role !== 'editor') {
      return res.status(403).json({ message: 'Access denied: Read-only permissions' });
    }

    if (title !== undefined) doc.title = title;
    if (content !== undefined) doc.content = content;
    if (category !== undefined) doc.category = category;
    doc.updatedAt = new Date();

    // Checkpoint logging
    const docVersions = memoryDb.versions
      .filter((v) => v.documentId === doc._id)
      .sort((a, b) => b.createdAt - a.createdAt);
      
    const lastVersion = docVersions[0];
    if (!lastVersion || lastVersion.content !== content) {
      const timeDiff = lastVersion ? Date.now() - new Date(lastVersion.createdAt).getTime() : Infinity;
      if (timeDiff > 120000 || !lastVersion) {
        memoryDb.versions.push({
          _id: generateId(),
          documentId: doc._id,
          content: content || '',
          editedBy: req.user._id,
          createdAt: new Date(),
        });
      }
    }

    saveDb();

    const populated = populateMockDoc(doc);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a document (Owner only)
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res) => {
  try {
    // Database Connected Mode
    if (isDbConnected()) {
      const document = await Document.findById(req.params.id);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      if (!isOwner(document, req.user._id)) {
        return res.status(403).json({ message: 'Access denied: Only owners can delete documents' });
      }

      await Document.deleteOne({ _id: document._id });
      await Version.deleteMany({ documentId: document._id });

      return res.json({ message: 'Document and its history deleted successfully' });
    }

    // In-Memory Fallback Mode
    const docIndex = memoryDb.documents.findIndex((d) => d._id === req.params.id);
    if (docIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const doc = memoryDb.documents[docIndex];
    if (!isOwner(doc, req.user._id)) {
      return res.status(403).json({ message: 'Access denied: Only owners can delete documents' });
    }

    memoryDb.documents.splice(docIndex, 1);
    memoryDb.versions = memoryDb.versions.filter((v) => v.documentId !== req.params.id);
    saveDb();

    res.json({ message: 'Document and its history deleted from memory' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Invite, edit, or remove collaborator
// @route   POST /api/documents/share
// @access  Private
export const shareDocument = async (req, res) => {
  const { documentId, email, role, remove } = req.body;

  try {
    // Database Connected Mode
    if (isDbConnected()) {
      const document = await Document.findById(documentId);

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      if (!isOwner(document, req.user._id)) {
        return res.status(403).json({ message: 'Access denied: Only document owners can share' });
      }

      const targetUser = await User.findOne({ email });
      if (!targetUser) {
        return res.status(404).json({ message: 'User with this email not found' });
      }

      if (isOwner(document, targetUser._id)) {
        return res.status(400).json({ message: 'Cannot share with the owner' });
      }

      const collaboratorIndex = document.collaborators.findIndex(
        (c) => c.userId.toString() === targetUser._id.toString()
      );

      if (remove) {
        if (collaboratorIndex > -1) {
          document.collaborators.splice(collaboratorIndex, 1);
        } else {
          return res.status(400).json({ message: 'User is not a collaborator' });
        }
      } else {
        if (!['editor', 'viewer'].includes(role)) {
          return res.status(400).json({ message: 'Invalid collaborator role' });
        }

        if (collaboratorIndex > -1) {
          document.collaborators[collaboratorIndex].role = role;
        } else {
          document.collaborators.push({ userId: targetUser._id, role });
        }
      }

      await document.save();

      const updatedDoc = await Document.findById(documentId)
        .populate('owner', 'name email avatar')
        .populate('collaborators.userId', 'name email avatar');

      return res.json(updatedDoc);
    }

    // In-Memory Fallback Mode
    const docIndex = memoryDb.documents.findIndex((d) => d._id === documentId);
    if (docIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const doc = memoryDb.documents[docIndex];
    if (!isOwner(doc, req.user._id)) {
      return res.status(403).json({ message: 'Access denied: Only document owners can share' });
    }

    const targetUser = memoryDb.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!targetUser) {
      return res.status(404).json({ message: 'User with this email not found (In-Memory Database)' });
    }

    if (isOwner(doc, targetUser._id)) {
      return res.status(400).json({ message: 'Cannot share with the owner' });
    }

    const collaboratorIndex = doc.collaborators.findIndex(
      (c) => (c.userId._id || c.userId).toString() === targetUser._id.toString()
    );

    if (remove) {
      if (collaboratorIndex > -1) {
        doc.collaborators.splice(collaboratorIndex, 1);
      } else {
        return res.status(400).json({ message: 'User is not a collaborator' });
      }
    } else {
      if (!['editor', 'viewer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid collaborator role' });
      }

      if (collaboratorIndex > -1) {
        doc.collaborators[collaboratorIndex].role = role;
      } else {
        doc.collaborators.push({ userId: targetUser._id, role });
      }
    }

    doc.updatedAt = new Date();
    saveDb();
    const populated = populateMockDoc(doc);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get document version history list
// @route   GET /api/documents/:id/history
// @access  Private
export const getVersionHistory = async (req, res) => {
  try {
    // Database Connected Mode
    if (isDbConnected()) {
      const document = await Document.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const role = getRole(document, req.user._id);
      if (!role) {
        return res.status(403).json({ message: 'Access denied: Not authorized' });
      }

      const history = await Version.find({ documentId: req.params.id })
        .populate('editedBy', 'name email avatar')
        .sort({ createdAt: -1 });

      return res.json(history);
    }

    // In-Memory Fallback Mode
    const doc = memoryDb.documents.find((d) => d._id === req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const role = getRole(doc, req.user._id);
    if (!role) {
      return res.status(403).json({ message: 'Access denied: Not authorized' });
    }

    const history = memoryDb.versions
      .filter((v) => v.documentId === req.params.id)
      .map((v) => {
        const editor = memoryDb.users.find((u) => u._id === v.editedBy) || {
          _id: v.editedBy,
          name: 'Unknown Collaborator',
          email: '',
          avatar: '',
        };
        return {
          ...v,
          editedBy: {
            _id: editor._id,
            name: editor.name,
            email: editor.email,
            avatar: editor.avatar,
          },
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rollback document content to a specific version checkpoint
// @route   POST /api/documents/:id/rollback
// @access  Private
export const rollbackVersion = async (req, res) => {
  const { versionId } = req.body;

  try {
    // Database Connected Mode
    if (isDbConnected()) {
      const document = await Document.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const role = getRole(document, req.user._id);
      if (role !== 'owner' && role !== 'editor') {
        return res.status(403).json({ message: 'Access denied: Read-only permissions' });
      }

      const version = await Version.findById(versionId);
      if (!version || version.documentId.toString() !== document._id.toString()) {
        return res.status(404).json({ message: 'Version checkpoint not found' });
      }

      document.content = version.content;
      await document.save();

      const newVersion = await Version.create({
        documentId: document._id,
        content: version.content,
        editedBy: req.user._id,
      });

      const populatedNewVersion = await Version.findById(newVersion._id)
        .populate('editedBy', 'name email avatar');

      return res.json({
        document,
        newVersion: populatedNewVersion,
        message: 'Document rolled back successfully',
      });
    }

    // In-Memory Fallback Mode
    const docIndex = memoryDb.documents.findIndex((d) => d._id === req.params.id);
    if (docIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const doc = memoryDb.documents[docIndex];
    const role = getRole(doc, req.user._id);
    if (role !== 'owner' && role !== 'editor') {
      return res.status(403).json({ message: 'Access denied: Read-only permissions' });
    }

    const version = memoryDb.versions.find((v) => v._id === versionId);
    if (!version || version.documentId !== doc._id) {
      return res.status(404).json({ message: 'Version checkpoint not found' });
    }

    doc.content = version.content;
    doc.updatedAt = new Date();

    const rollbackVersionObj = {
      _id: generateId(),
      documentId: doc._id,
      content: version.content,
      editedBy: req.user._id,
      createdAt: new Date(),
    };
    memoryDb.versions.push(rollbackVersionObj);
    saveDb();

    const editorUser = memoryDb.users.find((u) => u._id === req.user._id) || {
      _id: req.user._id,
      name: 'System User',
    };

    res.json({
      document: populateMockDoc(doc),
      newVersion: {
        ...rollbackVersionObj,
        editedBy: {
          _id: editorUser._id,
          name: editorUser.name,
          email: editorUser.email,
          avatar: editorUser.avatar,
        },
      },
      message: 'Document rolled back successfully (In-Memory Database)',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
