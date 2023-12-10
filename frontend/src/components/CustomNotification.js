import React, { useEffect } from 'react';

const CustomNotification = ({ notification, setNotification }) => {
  const { message, color, show } = notification;

  useEffect(() => {
    let timer;
    if (show) {
      timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 3000); // Close the notification after 3 seconds
    }

    return () => clearTimeout(timer);
  }, [show, notification, setNotification]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '0px',
        right: '0px',
        zIndex: 9999,
        width: '200px',
      }}
    >
      <div
        style={{
          backgroundColor: color === 'danger' ? '#ff5252' : '#7ed321',
          color: '#fff',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          display: show ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
          transition: 'opacity 0.5s ease-in-out',
        }}
      >
        <p style={{ fontSize: '16px', margin: '0' }}>{message}</p>
      </div>
    </div>
  );
};

export default CustomNotification;
