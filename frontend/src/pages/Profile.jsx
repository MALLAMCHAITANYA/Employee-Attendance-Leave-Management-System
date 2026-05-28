import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';



const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState({
    name: '',
    dob: '',
    age: '',
    email: '',
    annualLeaveDays: '',
    avatar: ''
  });
  const [saving, setSaving] = useState(false);

  // Custom Avatar and Camera Upload States
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = React.useRef(null);
  const [showOptions, setShowOptions] = useState(false);
  const menuRef = React.useRef(null);

  // Cropper States
  const [tempImage, setTempImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Click outside dropdown handler
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 300, height: 300, facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      // Wait a tick for videoRef element to mount and be available in the DOM
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 50);
    } catch (err) {
      console.error(err);
      setCameraError('Could not access camera. Please verify device permissions.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setTempImage(dataUrl);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      stopCamera();
    }
  };

  const handleFileUpload = e => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Mouse and Touch Drag Handlers for Crop Tool
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const saveCroppedImage = () => {
    const img = new Image();
    img.src = tempImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      const DOM_SIZE = 160;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 300, 300);

      // Translate to center of canvas, plus scaled offsets
      ctx.translate(150 + offset.x * (300 / DOM_SIZE), 150 + offset.y * (300 / DOM_SIZE));
      ctx.scale(zoom, zoom);

      // Draw cover
      const imgRatio = img.width / img.height;
      let drawW, drawH;
      if (imgRatio >= 1) {
        drawH = 300;
        drawW = 300 * imgRatio;
      } else {
        drawW = 300;
        drawH = 300 / imgRatio;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

      const dataUrl = canvas.toDataURL('image/png');
      setForm(f => ({ ...f, avatar: dataUrl }));
      setTempImage(null);
    };
  };

  useEffect(() => {
    api
      .get('/users/me')
      .then(res => {
        const u = res.data;
        setForm({
          name: u.name || '',
          email: u.email || '',
          age: u.age || '',
          dob: u.dob ? u.dob.substring(0, 10) : '',
          annualLeaveDays: u.annualLeaveDays ?? '',
          avatar: u.avatar || '',
          department: u.department || 'General',
          branch: u.branch || 'HQ'
        });
      })
      .catch(console.error);
  }, []);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/users/me', form);
      updateUser(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Profile</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Update your personal details and contact information.
      </p>

      <form className="mt-4 hr-card p-4 space-y-3 text-xs" onSubmit={handleSave}>
        {/* Profile Image Section */}
        <div className="flex flex-col items-center justify-center py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative" ref={menuRef}>
            {/* Main Avatar Button */}
            <button
              type="button"
              onClick={() => {
                if (cameraActive) {
                  stopCamera();
                } else {
                  setShowOptions(!showOptions);
                }
              }}
              className="group relative h-24 w-24 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-all hover:scale-105"
            >
              {form.avatar ? (
                <img src={form.avatar} alt="avatar" className="h-full w-full object-cover group-hover:opacity-90 transition-opacity" />
              ) : (
                <span className="text-3xl font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                  {form.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
              {/* Hover Edit Overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </button>

            {/* Plus / Edit Badge */}
            <button
              type="button"
              onClick={() => {
                if (cameraActive) {
                  stopCamera();
                } else {
                  setShowOptions(!showOptions);
                }
              }}
              className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900 transition-all hover:scale-110"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Dropdown Options */}
            {showOptions && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1.5 z-50 text-slate-700 dark:text-slate-200 text-xs">
                <label className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer font-medium">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleFileUpload(e);
                      setShowOptions(false);
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    startCamera();
                    setShowOptions(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium text-left"
                >
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take Photo
                </button>
                {form.avatar && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm(f => ({ ...f, avatar: '' }));
                      setShowOptions(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium text-left border-t border-slate-100 dark:border-slate-700 mt-1"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove Photo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Camera Capture Interface */}
          {cameraActive && (
            <div className="mt-4 flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-900/90 shadow-xl relative w-full max-w-[200px]">
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 text-red-400 text-center p-4 rounded-2xl text-[10px]">
                  {cameraError}
                </div>
              )}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black mb-3 border border-slate-700 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 text-[8px] text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Live Camera
                </div>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-[11px] font-semibold transition-all hover:shadow-lg"
                >
                  Capture
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[11px] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-slate-600 dark:text-slate-300">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-slate-600 dark:text-slate-300">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-300">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-300">Age</label>
            <input
              type="number"
              name="age"
              value={form.age}
              onChange={handleChange}
              className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 dark:text-slate-300">Department</label>
            {user?.role === 'admin' ? (
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="General">General</option>
                <option value="Engineering">Engineering</option>
                <option value="HR">HR</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
              </select>
            ) : (
              <input
                type="text"
                disabled
                value={form.department || 'General'}
                className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed focus:outline-none"
              />
            )}
          </div>
          <div>
            <label className="block text-slate-600 dark:text-slate-300">Branch</label>
            {user?.role === 'admin' ? (
              <select
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="HQ">HQ</option>
                <option value="Branch A">Branch A</option>
                <option value="Branch B">Branch B</option>
              </select>
            ) : (
              <input
                type="text"
                disabled
                value={form.branch || 'HQ'}
                className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed focus:outline-none"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-slate-600 dark:text-slate-300">Annual Leave Quota (days/year)</label>
          {user?.role === 'manager' || user?.role === 'admin' ? (
            <input
              type="number"
              name="annualLeaveDays"
              value={form.annualLeaveDays}
              onChange={handleChange}
              placeholder="Default: 15"
              className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          ) : (
            <input
              type="text"
              disabled
              value={form.annualLeaveDays ? `${form.annualLeaveDays} days` : '15 days (Default)'}
              className="mt-1 w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed focus:outline-none"
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-slate-600">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-xs font-medium text-white disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </form>

      {/* Crop Modal */}
      {tempImage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col items-center">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">Crop Profile Photo</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-4 text-center">Drag inside the circle to position, use slider to zoom</p>

            {/* Circle Crop Container */}
            <div className="h-40 w-40 rounded-full border-4 border-slate-200 dark:border-slate-700 shadow-inner bg-slate-100 dark:bg-slate-700 overflow-hidden relative select-none cursor-grab active:cursor-grabbing">
              <img
                src={tempImage}
                alt="Crop preview"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  maxHeight: 'none',
                  maxWidth: 'none',
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                draggable="false"
              />
            </div>

            {/* Zoom Slider */}
            <div className="w-full mt-5 px-2">
              <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
                <span>Zoom</span>
                <span>{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full mt-6">
              <button
                type="button"
                onClick={() => setTempImage(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCroppedImage}
                className="flex-1 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold transition-colors shadow-lg hover:shadow-primary-500/20"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

