import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axiosInstance';
import { useSocket } from '../../context/SocketContext';

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (newNotif) => {
      if (!newNotif || !newNotif._id) return;
      setNotifications((prev) => {
        if (prev.some((n) => n._id === newNotif._id)) return prev;
        return [newNotif, ...prev];
      });
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      const notifs = Array.isArray(res.data) ? res.data : [];
      const uniqueNotifs = notifs.filter(
        (n, index, self) => n && n._id && index === self.findIndex((item) => item && item._id === n._id)
      );
      setNotifications(uniqueNotifs);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n) => {
    try {
      if (!n.isRead) {
        await API.put(`/notifications/${n._id}/read`);
        setNotifications((prev) =>
          prev.map((item) => (item._id === n._id ? { ...item, isRead: true } : item))
        );
      }
      setIsOpen(false);
      const targetGroupId = n.group?._id || n.group;
      if (targetGroupId) {
        navigate(`/groups/${targetGroupId}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition focus:outline-none"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-pulse shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Notifications</h4>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No notifications yet</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 flex items-start space-x-3 transition cursor-pointer hover:bg-slate-800/80 ${
                    n.isRead ? 'bg-transparent' : 'bg-indigo-950/30'
                  }`}
                >
                  <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.isRead ? 'bg-slate-600' : 'bg-indigo-500'}`} />
                  <div className="text-xs text-slate-300">
                    <p className="leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
