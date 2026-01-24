/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { 
  getNotesBySheet, 
  createNote, 
  updateNote, 
  deleteNote, 
  clearNotes,
  type Note 
} from '../../redux/slices/notiSignalr/noteSlice';
import { MdClose, MdAdd, MdEdit, MdDelete, MdSave } from 'react-icons/md';
import { useNotification } from '../../redux/hooks';
import Notification from '../general/Notification';
import { signalRService } from '../../redux/services/signalrService';

interface NoteModalProps {
  sheetId: number;
  isOpen: boolean;
  onClose: () => void;
}

const NoteModal = ({ sheetId, isOpen, onClose }: NoteModalProps) => {
  // States
  const [activeTab, setActiveTab] = useState<'ENG' | 'Supervisior' | 'Manager'>('ENG');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redux
  const dispatch = useAppDispatch();
  const { notes, loading } = useAppSelector(state => state.note);
  const { user } = useAppSelector(state => state.auth);
  const { notification, showNotification, hideNotification } = useNotification();

  // Refs để tránh stale closure
  const sheetIdRef = useRef(sheetId);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    sheetIdRef.current = sheetId;
    isOpenRef.current = isOpen;
  }, [sheetId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      dispatch(getNotesBySheet(sheetId));
      
      // Set activeTab theo role của user
      if (user?.role && ['ENG', 'Supervisior', 'Manager'].includes(user.role)) {
        setActiveTab(user.role as 'ENG' | 'Supervisior' | 'Manager');
      }
    }

    // Cleanup khi đóng modal
    return () => {
      if (!isOpen) {
        setNoteContent('');
        setEditingNoteId(null);
        dispatch(clearNotes());
      }
    };
  }, [isOpen, sheetId, dispatch, user?.role]);

  const handleSignalRNotification = useCallback((data: any) => {
    try {
      const notification = typeof data === 'string' ? JSON.parse(data) : data;
      const notificationSheetId = notification.changeModel?.id || notification.changeModelId;

      if (notificationSheetId === sheetIdRef.current && isOpenRef.current) {
        dispatch(getNotesBySheet(sheetIdRef.current));
      }
    } catch (error) {
      console.error('❌ [NoteModal] Error parsing notification:', error);
    }
  }, [dispatch]);

  useEffect(() => {
    if (!isOpen) return;
    signalRService.start();
    signalRService.onNotification(handleSignalRNotification);

    return () => {
      signalRService.offNotification(handleSignalRNotification);
    };
  }, [isOpen, sheetId, handleSignalRNotification]);

  // Check permissions
  const canManageNotes = useCallback(() => {
    const role = user?.role;
    return role === 'ENG' || role === 'Supervisior' || role === 'Manager';
  }, [user?.role]);

  const canEditNote = useCallback((note: Note) => {
    return note.createdBy === user?.username && note.createdByRole === user?.role;
  }, [user?.username, user?.role]);

  // Filter notes by active tab
  const filteredNotes = notes.filter(note => note.createdByRole === activeTab);

  // CREATE or UPDATE with better error handling
  const handleSubmit = async () => {
    const trimmedContent = noteContent.trim();
    
    if (!trimmedContent) {
      showNotification('warning', 'Cảnh báo', 'Vui lòng nhập nội dung ghi chú');
      return;
    }

    if (trimmedContent.length > 1000) {
      showNotification('warning', 'Cảnh báo', 'Nội dung ghi chú không được vượt quá 1000 ký tự');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingNoteId) {
        await dispatch(updateNote({ 
          id: editingNoteId, 
          noteContent: trimmedContent 
        })).unwrap();
        showNotification('success', 'Thành công', 'Đã cập nhật ghi chú');
      } else {
        await dispatch(createNote({ 
          changeModelId: sheetId, 
          noteContent: trimmedContent 
        })).unwrap();
        showNotification('success', 'Thành công', 'Đã tạo ghi chú mới');
      }
      
      // Reset form
      setNoteContent('');
      setEditingNoteId(null);
      
      // Reload notes for current sheet only
      dispatch(getNotesBySheet(sheetId));
    } catch (error: any) {
      console.error('❌ [NoteModal] Submit error:', error);
      const errorMessage = error?.message || error || 'Không thể lưu ghi chú';
      showNotification('error', 'Lỗi', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // EDIT (populate form)
  const handleEdit = useCallback((note: Note) => {
    setEditingNoteId(note.id);
    setNoteContent(note.noteContent);
    setActiveTab(note.createdByRole as any);
  }, []);

  // DELETE with confirmation
  const handleDelete = async (noteId: number) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa ghi chú này?');
    if (!confirmed) return;

    try {
      await dispatch(deleteNote(noteId)).unwrap();
      showNotification('success', 'Thành công', 'Đã xóa ghi chú');
      
      // Clear editing state if deleting current editing note
      if (editingNoteId === noteId) {
        setNoteContent('');
        setEditingNoteId(null);
      }
    } catch (error: any) {
      console.error('❌ [NoteModal] Delete error:', error);
      const errorMessage = error?.message || error || 'Không thể xóa ghi chú';
      showNotification('error', 'Lỗi', errorMessage);
    }
  };

  // Cancel editing
  const handleCancel = useCallback(() => {
    setNoteContent('');
    setEditingNoteId(null);
  }, []);

  // Handle close with cleanup
  const handleClose = useCallback(() => {
    if (editingNoteId && noteContent.trim()) {
      const confirmed = window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng?');
      if (!confirmed) return;
    }
    
    setNoteContent('');
    setEditingNoteId(null);
    onClose();
  }, [editingNoteId, noteContent, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && noteContent.trim()) {
        handleSubmit();
      }
      // ESC to close or cancel editing
      if (e.key === 'Escape') {
        if (editingNoteId) {
          handleCancel();
        } else {
          handleClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, noteContent, editingNoteId, handleCancel, handleClose]);

  if (!isOpen) return null;

  return (
    <>
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Ghi Chú Quản Lý
              </h2>
              <p className="text-sm text-gray-600 mt-1">Sheet #{sheetId}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              title="Đóng (ESC)"
            >
              <MdClose size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-4 bg-gray-50">
            {(['ENG', 'Supervisior', 'Manager'] as const).map((tab) => {
              const tabNotes = notes.filter(n => n.createdByRole === tab);
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-semibold transition-all border-b-2 relative ${
                    activeTab === tab
                      ? 'text-blue-600 border-blue-600 bg-gray-50'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                  {tabNotes.length > 0 && (
                    <span className={`mx-2 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tabNotes.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Loading State */}
            {loading && filteredNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500">Đang tải ghi chú...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 text-center">
                  Chưa có ghi chú nào từ <strong>{activeTab}</strong>
                </p>
                {canManageNotes() && user?.role === activeTab && (
                  <p className="text-sm text-gray-400 mt-2">
                    Hãy thêm ghi chú đầu tiên của bạn bên dưới
                  </p>
                )}
              </div>
            )}

            {/* Notes List */}
            {filteredNotes.length > 0 && (
              <div className="space-y-3 mb-6">
                {filteredNotes.map((note) => {
                  const isEditing = editingNoteId === note.id;
                  
                  return (
                    <div
                      key={note.id}
                      className={`bg-gray-50 rounded-lg p-4 border transition-all mb-2 ${
                        isEditing 
                          ? 'border-blue-400 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:shadow-md hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="font-semibold text-gray-800">
                            Từ: {note.createdBy || note.account?.fullName || note.account?.username || 'Unknown'}
                          </span>
                          <span className="text-sm text-gray-500 mx-2">
                            ({note.createdByRole || note.account?.role || 'Unknown'})
                          </span>
                          {isEditing && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                              Đang chỉnh sửa
                            </span>
                          )}
                        </div>
                        
                        {canEditNote(note) && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(note)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Chỉnh sửa"
                              disabled={isSubmitting}
                            >
                              <MdEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(note.id)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Xóa"
                              disabled={isSubmitting}
                            >
                              <MdDelete size={18} />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        <strong className='text-sm'>Nội dung:</strong> {note.noteContent}
                      </p>

                      <div className="text-xs text-gray-500 mt-3 flex items-center gap-2">
                        <span>
                          {new Date(note.createdAt).toLocaleString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {note.updatedAt && note.updatedAt !== note.createdAt && (
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                            Đã chỉnh sửa
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create/Edit Form */}
            {canManageNotes() && user?.role === activeTab && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">
                    {editingNoteId ? 'Chỉnh sửa ghi chú' : 'Thêm ghi chú mới'}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {noteContent.length}/1000
                  </span>
                </div>
                
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Nhập nội dung ghi chú... (Ctrl/Cmd + Enter để lưu)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                  rows={4}
                  disabled={isSubmitting}
                  maxLength={1000}
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !noteContent.trim()}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        {editingNoteId ? <MdSave size={20} /> : <MdAdd size={20} />}
                        <span>{editingNoteId ? 'Cập nhật' : 'Thêm ghi chú'}</span>
                      </>
                    )}
                  </button>
                  
                  {editingNoteId && (
                    <button
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
                    >
                      Hủy
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* Permission Message */}
            {!canManageNotes() && (
              <div className="text-center py-8 text-gray-500">
                <p>Bạn không có quyền thêm ghi chú</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NoteModal;