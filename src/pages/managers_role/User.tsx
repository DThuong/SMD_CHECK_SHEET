/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { FaUser, FaPhone, FaSearch, FaEdit, FaTrash, FaSave, FaTimes, FaKey, FaUserPlus } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { 
  fetchUsers, 
  fetchUserById, 
  updateUser, 
  deleteUser, 
  changePasswordByAdmin, 
  registerUser,
  clearError, 
  clearSelectedUser,
  type AccountUser,
  type RegisterUserRequest
} from '../../redux/slices/authSlice';
import ReactPaginate from 'react-paginate';
import LoadingSpinner from '../../components/general/LoadingSpinner';
import { FaSpinner } from 'react-icons/fa6';

const User = () => {
  const dispatch = useAppDispatch();
  const { users, usersLoading, usersError, selectedUser } = useAppSelector(state => state.auth);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<AccountUser | null>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [passwordUser, setPasswordUser] = useState<AccountUser | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');

  // THÊM STATE CHO ADD USER MODAL
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [addUserData, setAddUserData] = useState<RegisterUserRequest>({
    username: '',
    password: '',
    role: 'PQC',
    fullName: '',
    phoneNumber: ''
  });
  const [addUserError, setAddUserError] = useState<string>('');
  const [confirmAddPassword, setConfirmAddPassword] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(0);
  const usersPerPage = 5;

  const [formData, setFormData] = useState<Omit<AccountUser, 'id' | 'username'>>({
    fullName: '',
    phoneNumber: '',
    role: 'PQC',
    isActive: true
  });

  // Fetch users khi component mount
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Clear error khi component unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Hiển thị selectedUser khi filter theo ID
  useEffect(() => {
    if (selectedUser && filterUserId) {
      setCurrentPage(0);
    }
  }, [selectedUser, filterUserId]);

  const resetForm = (): void => {
    setFormData({
      fullName: '',
      phoneNumber: '',
      role: 'PQC',
      isActive: true
    });
    setEditingUser(null);
  };

  // RESET ADD USER FORM
  const resetAddUserForm = (): void => {
    setAddUserData({
      username: '',
      password: '',
      role: 'PQC',
      fullName: '',
      phoneNumber: ''
    });
    setConfirmAddPassword('');
    setAddUserError('');
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    
    if (name === 'isActive') {
      setFormData(prev => ({
        ...prev,
        [name]: value === 'true'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // HANDLE ADD USER INPUT CHANGE
  const handleAddUserInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setAddUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenModal = (user: AccountUser): void => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isActive: user.isActive
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    resetForm();
  };

  // OPEN ADD USER MODAL
  const handleOpenAddUserModal = (): void => {
    resetAddUserForm();
    setShowAddUserModal(true);
  };

  // CLOSE ADD USER MODAL
  const handleCloseAddUserModal = (): void => {
    setShowAddUserModal(false);
    resetAddUserForm();
  };

  // SUBMIT ADD USER
  const handleAddUser = async (): Promise<void> => {
    // Validate
    if (!addUserData.username.trim()) {
      setAddUserError('Vui lòng nhập username');
      return;
    }
    if (!addUserData.password) {
      setAddUserError('Vui lòng nhập mật khẩu');
      return;
    }
    if (addUserData.password !== confirmAddPassword) {
      setAddUserError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (!addUserData.fullName.trim()) {
      setAddUserError('Vui lòng nhập họ và tên');
      return;
    }
    if (!addUserData.phoneNumber.trim()) {
      setAddUserError('Vui lòng nhập số điện thoại');
      return;
    }

    const result = await dispatch(registerUser(addUserData));
    
    if (registerUser.fulfilled.match(result)) {
      showSuccessMessage('Thêm người dùng thành công!');
      handleCloseAddUserModal();
      await dispatch(fetchUsers()); // Refresh danh sách
    } else {
      setAddUserError(result.payload as string || 'Thêm người dùng thất bại');
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (editingUser) {
      const updateData = {
        id: editingUser.id,
        role: formData.role,
        isActive: formData.isActive,
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber
      };
      
      const result = await dispatch(updateUser(updateData));
      if (updateUser.fulfilled.match(result)) {
        showSuccessMessage('Cập nhật người dùng thành công!');
        handleCloseModal();
        
        if (filterUserId && selectedUser) {
          await dispatch(fetchUserById(parseInt(filterUserId)));
        } else {
          await dispatch(fetchUsers());
        }
      } else {
        showSuccessMessage('Lỗi: ' + (result.payload as string || 'Cập nhật thất bại'));
      }
    }
  };

  const handleDelete = async (userId: number): Promise<void> => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      const result = await dispatch(deleteUser(userId));
      if (deleteUser.fulfilled.match(result)) {
        showSuccessMessage('Xóa người dùng thành công!');
        
        if (filterUserId && selectedUser?.id === userId) {
          setFilterUserId('');
          dispatch(clearSelectedUser());
        }
        
        await dispatch(fetchUsers());
        
        const remainingUsers = users.length - 1;
        const maxPage = Math.ceil(remainingUsers / usersPerPage) - 1;
        if (currentPage > maxPage && maxPage >= 0) {
          setCurrentPage(maxPage);
        }
      } else {
        showSuccessMessage('Lỗi: ' + (result.payload as string || 'Xóa thất bại'));
      }
    }
  };

  const showSuccessMessage = (message: string): void => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleFilterById = async (): Promise<void> => {
    if (filterUserId.trim()) {
      const userId = parseInt(filterUserId);
      if (!isNaN(userId)) {
        await dispatch(fetchUserById(userId));
        setShowFilterModal(false);
      }
    }
  };

  const handleClearFilter = (): void => {
    setFilterUserId('');
    dispatch(clearSelectedUser());
    dispatch(fetchUsers());
    setShowFilterModal(false);
  };

  const handleOpenPasswordModal = (user: AccountUser): void => {
    setPasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handleClosePasswordModal = (): void => {
    setShowPasswordModal(false);
    setPasswordUser(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleChangePassword = async (): Promise<void> => {
    if (!newPassword) {
      setPasswordError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordUser) {
      const result = await dispatch(changePasswordByAdmin({
        accountId: passwordUser.id,
        newPassword: newPassword
      }));

      if (changePasswordByAdmin.fulfilled.match(result)) {
        showSuccessMessage('Đổi mật khẩu thành công!');
        handleClosePasswordModal();
      } else {
        setPasswordError(result.payload as string || 'Đổi mật khẩu thất bại');
      }
    }
  };

  // Filter users
  const displayUsers = selectedUser && filterUserId ? [selectedUser] : users;

  // Apply search filter
  const filteredUsers = displayUsers.filter(user =>
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const pageCount = Math.ceil(filteredUsers.length / usersPerPage);
  const offset = currentPage * usersPerPage;
  const currentUsers = filteredUsers.slice(offset, offset + usersPerPage);

  const handlePageClick = (event: { selected: number }) => {
    setCurrentPage(event.selected);
  };

  const getRoleBadgeColor = (role?: string): string => {
    if (!role) return 'bg-gray-100 text-gray-700 border-gray-300';
    
    switch (role) {
      case 'Admin': return 'bg-gray-100 text-red-600 border-purple-300';
      case 'Manager': return 'bg-gray-100 text-black border-blue-300';
      case 'KoreaManager': return 'bg-gray-100 text-black border-blue-300';
      case 'Supervisior': return 'bg-gray-100 text-black border-blue-300';
      case 'ENG': return 'bg-gray-100 text-black border-blue-300';
      case 'PQC': return 'bg-gray-100 text-black border-blue-300';
      case 'PQCLeader': return 'bg-yellow-100 text-yellow-700 border-yellow-400';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusBadgeColor = (isActive?: boolean): string => {
    if (isActive === undefined) return 'bg-gray-100 text-gray-700 border-gray-300';
    
    return isActive 
      ? 'bg-green-100 text-green-700 border-green-300'
      : 'bg-red-100 text-red-700 border-red-300';
  };

  return (
    <div className="bg-linear-to-br from-slate-50 to-slate-100 md:p-4 pb-4 mb-4">
      <div className="max-w-7xl mx-auto">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {usersError && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {usersError}
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Quản lý người dùng</h1>
              <p className="text-slate-600 mt-1">
                Tổng số: {filteredUsers.length} người dùng
                {filterUserId && selectedUser && <span className="text-blue-600"> (Đang lọc theo ID: {filterUserId})</span>}
              </p>
            </div>
            <div className="flex gap-2">
              {/* THÊM BUTTON ADD USER */}
              <button
                onClick={handleOpenAddUserModal}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
              >
                <FaUserPlus />
                Thêm người dùng
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, username, số điện thoại, quyền..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="user-search-admin w-full pl-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {usersLoading ? (
            <LoadingSpinner size='sm' />
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">ID</th>
                      <th className="px-4 py-3 lg:text-left md:text-left text-center text-sm font-semibold text-slate-700">Người dùng</th>
                      <th className="px-4 py-3 lg:text-left md:text-left text-center text-sm font-semibold text-slate-700">Liên hệ</th>
                      <th className="px-4 py-3 lg:text-left md:text-left text-center text-sm font-semibold text-slate-700">Quyền</th>
                      <th className="px-4 py-3 lg:text-left md:text-left text-center text-sm font-semibold text-slate-700">Trạng thái</th>
                      <th className="px-4 py-3 lg:text-left md:text-left text-center text-sm font-semibold text-slate-700">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-center text-sm font-medium text-slate-700">
                            {user.id}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex lg:flex-row flex-col items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <FaUser className="text-gray-600" />
                              </div>
                              <div className='flex flex-row items-center gap-1'>
                                <div className="font-semibold text-slate-800 lg:text-sm text-xs text-center">
                                  {user.fullName}
                                </div>
                                <div className='text-sm border rounded-lg px-2 cursor-pointer bg-amber-200'>id: {user.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 text-sm text-slate-800">
                              <FaPhone className="text-slate-400" />
                              {user.phoneNumber}
                            </div>
                          </td>
                          <td className="lg:px-4 lg:py-3 px-2 py-2 text-center lg:text-left">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="lg:px-4 lg:py-3 px-2 py-2 text-center lg:text-left">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(user.isActive)}`}>
                              {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center lg:justify-start gap-2">
                              <button
                                onClick={() => handleOpenPasswordModal(user)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Đổi mật khẩu"
                              >
                                <FaKey />
                              </button>
                              <button
                                onClick={() => handleOpenModal(user)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Chỉnh sửa"
                              >
                                <FaEdit color='gray' />
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-2 text-gray-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa"
                                disabled={user.role === 'Admin'}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          Không tìm thấy người dùng nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden">
                {currentUsers.length > 0 ? (
                  <div className="divide-y divide-slate-200">
                    {currentUsers.map((user) => (
                      <div key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
                        {/* Header: Avatar + ID */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <FaUser className="text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-slate-800 text-sm truncate">
                              {user.fullName}
                            </div>
                            <div className="text-xs text-slate-500">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div className="my-2 mb-3">

                          {/* Role & Status */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                              {user.role}
                            </span>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeColor(user.isActive)}`}>
                              {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
                          <button
                            onClick={() => handleOpenPasswordModal(user)}
                            className="flex-1 flex items-center justify-center gap-2 p-2 text-green-600 border bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm"
                            title="Đổi mật khẩu"
                          >
                            <FaKey />
                            <span>Đổi MK</span>
                          </button>
                          <button
                            onClick={() => handleOpenModal(user)}
                            className="flex-1 flex items-center justify-center gap-2 p-2 text-gray-600 border bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                            <span>Sửa</span>
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="flex-1 flex items-center justify-center gap-2 p-2 text-red-600 bg-red-50 border hover:bg-red-100 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Xóa"
                            disabled={user.role === 'Admin'}
                          >
                            <FaTrash />
                            <span>Xóa</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-slate-500">
                    Không tìm thấy người dùng nào
                  </div>
                )}
              </div>

              {/* Pagination */}
              {pageCount > 1 && (
                <div className="flex justify-center py-4 border-t border-slate-200">
                  <ReactPaginate
                    previousLabel={'‹'}
                    nextLabel={'›'}
                    breakLabel={'...'}
                    pageCount={pageCount}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={3}
                    onPageChange={handlePageClick}
                    forcePage={currentPage}
                    containerClassName={'flex items-center gap-2'}
                    pageClassName={''}
                    pageLinkClassName={'px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors'}
                    previousClassName={''}
                    previousLinkClassName={'px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors font-bold text-lg'}
                    nextClassName={''}
                    nextLinkClassName={'px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 transition-colors font-bold text-lg'}
                    breakClassName={''}
                    breakLinkClassName={'px-3 py-1'}
                    activeClassName={''}
                    activeLinkClassName={'!bg-gray-600 !text-white !border-gray-600'}
                    disabledClassName={'opacity-50 cursor-not-allowed'}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ✅ ADD USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Thêm người dùng mới</h2>
              <button
                onClick={handleCloseAddUserModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-4">
              {addUserError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {addUserError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={addUserData.username}
                    onChange={handleAddUserInputChange}
                    placeholder="Nhập username (dùng để đăng nhập)"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={addUserData.password}
                    onChange={handleAddUserInputChange}
                    placeholder="Tối thiểu 3 ký tự"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Xác nhận mật khẩu *
                  </label>
                  <input
                    type="password"
                    value={confirmAddPassword}
                    onChange={(e) => setConfirmAddPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={addUserData.fullName}
                    onChange={handleAddUserInputChange}
                    placeholder="Nhập họ và tên đầy đủ"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Phone */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={addUserData.phoneNumber}
                    onChange={handleAddUserInputChange}
                    placeholder="Nhập số điện thoại"
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Role */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Quyền *
                  </label>
                  <select
                    name="role"
                    value={addUserData.role}
                    onChange={handleAddUserInputChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="PQC">PQC</option>
                    <option value="PQCLeader">PQC Leader</option>
                    <option value="ENG">ENG</option>
                    <option value="Supervisior">Supervisior</option>
                    <option value="Manager">Manager</option>
                    <option value="KoreaManager">KoreaManager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleAddUser}
                  disabled={usersLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {usersLoading
                    ? <><FaSpinner className="animate-spin" /> Đang thêm...</>
                    : <><FaUserPlus /> Thêm người dùng</>
                  }
                </button>
                <button
                  type="button"
                  onClick={handleCloseAddUserModal}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FaTimes />
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Các modal khác giữ nguyên: Filter Modal, Password Modal, Edit Modal */}
      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Lọc người dùng theo ID</h2>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nhập ID người dùng
              </label>
              <input
                type="number"
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                placeholder="Ví dụ: 1, 2, 3..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleFilterById}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Áp dụng
                </button>
                <button
                  onClick={handleClearFilter}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && passwordUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Đổi mật khẩu</h2>
              <button
                onClick={handleClosePasswordModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <FaUser className="text-blue-600" />
                  <span className="font-semibold text-blue-800">{passwordUser.fullName}</span>
                  <span className="text-blue-600">(@{passwordUser.username})</span>
                </div>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {passwordError}
                </div>
              )}

              <div className="my-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Mật khẩu mới *
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Xác nhận mật khẩu *
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex lg:flex-row md:flex-row flex-col gap-2 mt-4">
                <button
                  onClick={handleChangePassword}
                  disabled={usersLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {usersLoading
                    ? <><FaSpinner className="animate-spin" /> Đang xử lý...</>
                    : <><FaKey /> Đổi mật khẩu</>
                  }
                </button>
                <button
                  onClick={handleClosePasswordModal}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FaTimes />
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">
                Chỉnh sửa người dùng
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Username - Read only */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editingUser.username}
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  />
                </div>

                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Phone */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Số điện thoại *
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Quyền *
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    disabled={editingUser.role === 'Admin'}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="PQC">PQC</option>
                    <option value="PQCLeader">PQC Leader</option>
                    <option value="ENG">ENG</option>
                    <option value="Supervisior">Supervisior</option>
                    <option value="Manager">Manager</option>
                    <option value="KoreaManager">KoreaManager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Trạng thái *
                  </label>
                  <select
                    name="isActive"
                    value={formData.isActive.toString()}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Không hoạt động</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={usersLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {usersLoading
                    ? <><FaSpinner className="animate-spin" /> Đang cập nhật...</>
                    : <><FaSave /> Cập nhật</>
                  }
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FaTimes />
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default User;