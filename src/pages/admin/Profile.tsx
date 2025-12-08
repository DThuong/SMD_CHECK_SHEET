import React, { useState} from 'react';
import type { ChangeEvent } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBriefcase, FaEdit, FaSave, FaTimes, FaCamera } from 'react-icons/fa';
import { useAuth } from '../authLoginSample/AuthContext';

interface ProfileData {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  role?: string;
  avatar: string | null;
}

const Profile = () => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const { user } = useAuth();
  
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: user?.fullName,
    email: user?.email,
    phone: user?.phone,
    address: user?.address,
    role: user?.role,
    avatar: null
  });

  const [editData, setEditData] = useState<ProfileData>({ ...profileData });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData(prev => ({
          ...prev,
          avatar: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = (): void => {
    setIsEditing(true);
  };

  const handleCancel = (): void => {
    setEditData({ ...profileData });
    setIsEditing(false);
  };

  const handleSave = (): void => {
    setProfileData({ ...editData });
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="min-h-dvh lg:p-4 md:p-4 pb-4 mb-4">
      <div className="mx-auto">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 bg-green-400 border border-green-400 text-white px-4 py-3 rounded-lg flex items-center animate-fade-in">
            <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Cập nhật thông tin thành công!</span>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg mb-4 overflow-hidden">
          <div className="bg-gray-700 h-16"></div>
          <div className="px-4 pb-4">
            <div className="flex flex-col md:flex-row items-center md:items-end mt-4 md:-mt-12">
              {/* Avatar */}
              <div className="relative mb-4 md:mb-0 mt-3">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-200">
                  {editData.avatar ? (
                    <img src={editData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white">
                      <FaUser className="text-gray-600 text-4xl" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                    <FaCamera className="text-lg" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>

              {/* Name and Actions */}
              <div className="md:ml-4 flex-1 text-center md:text-left flex flex-col justify-center">
                <h1 className="text-3xl font-bold text-slate-800 mb-1">{profileData.fullName}</h1>
                <p className="text-slate-600 mb-3">{profileData.role}</p>
              </div>

              {/* Edit/Save Buttons */}
              <div className="flex gap-3 items-center">
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
                  >
                    <FaEdit />
                    Chỉnh sửa
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
                    >
                      <FaSave />
                      Lưu
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors shadow-md"
                    >
                      <FaTimes />
                      Hủy
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Thông tin cá nhân</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <div className="flex items-center justify-start gap-1 text-sm font-semibold text-slate-700 mb-2">
                <FaUser className="inline text-gray-600" />
                <span>Họ và tên</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  name="fullName"
                  value={editData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-4 py-2 bg-slate-50 rounded-lg text-slate-800">{profileData.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-start gap-1 text-sm font-semibold text-slate-700 mb-2">
                <FaEnvelope className="inline text-gray-600" />
                <span>Email</span>
              </div>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={editData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-4 py-2 bg-slate-50 rounded-lg text-slate-800">{profileData.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <div className="flex items-center justify-start gap-1 text-sm font-semibold text-slate-700 mb-2">
                <FaPhone className="inline text-gray-600" />
                <span>Số điện thoại</span>
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={editData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-4 py-2 bg-slate-50 rounded-lg text-slate-800">{profileData.phone}</p>
              )}
            </div>

            {/* Position */}
            <div>
              <div className="flex items-center justify-start gap-1 text-sm font-semibold text-slate-700 mb-2">
                <FaBriefcase className="inline text-gray-600" />
                <span>Vị trí</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  name="position"
                  value={editData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-4 py-2 bg-slate-50 rounded-lg text-slate-800">{profileData.role}</p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-start gap-1 text-sm font-semibold text-slate-700 mb-2">
                <FaMapMarkerAlt className="inline text-gray-600" />
                Địa chỉ
              </div>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={editData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-4 py-2 bg-slate-50 rounded-lg text-slate-800">{profileData.address}</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;