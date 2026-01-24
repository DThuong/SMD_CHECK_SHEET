import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAppSelector } from '../../redux/hooks';

const TestSimpleSignalR = () => {
  const [status, setStatus] = useState('Disconnected');
  const [messages, setMessages] = useState<string[]>([]);
  const changeModelId = useAppSelector(state => state.changeModel.currentSheet?.id);

  useEffect(() => {
    // 1. Tạo connection đơn giản
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://172.16.162.103:5001/notificationHub', {
        accessTokenFactory: () => localStorage.getItem('token') || ''
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // 2. Bắt đầu kết nối
    const startConnection = async () => {
      try { 
        console.log('Connecting to SignalR...');
        setStatus('Connecting...');
        
        await connection.start();
        
        console.log('Connected!');
        console.log('Connection ID:', connection.connectionId);
        setStatus(`Connected (${connection.connectionId})`);

        // 3. Lắng nghe event
        connection.on('ReceiveNotification', (data) => {
          console.log('Received:', data);
          const msg = typeof data === 'string' 
            ? data 
            : JSON.stringify(data);
          setMessages(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev]);
        });

      } catch (error) {
        console.error('❌ Connection failed:', error);
        setStatus('Failed: ' + (error as Error).message);
      }
    };

    startConnection();

    // Cleanup
    return () => {
      connection.stop();
    };
  }, []);

  const testCreateNote = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://172.16.162.103:5001/api/Note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          changeModelId: changeModelId,
          noteContent: `Test note at ${new Date().toLocaleTimeString()}`
        })
      });
      
      const data = await response.json();
      console.log('📝 Note created:', data);
      alert('Note created! Check messages below.');
    } catch (error) {
      console.error('❌ Failed:', error);
      alert('Failed to create note');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '400px',
      background: 'white',
      border: '2px solid #ddd',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 9999,
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>
        🧪 Simple SignalR Test
      </h2>

      <div style={{
        padding: '12px',
        background: status.includes('Connected') ? '#d4edda' : '#f8d7da',
        color: status.includes('Connected') ? '#155724' : '#721c24',
        borderRadius: '4px',
        marginBottom: '12px',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        Status: {status}
      </div>

      <button
        onClick={testCreateNote}
        style={{
          width: '100%',
          padding: '12px',
          background: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginBottom: '12px'
        }}
      >
        Create Test Note
      </button>

      <div style={{
        background: '#f8f9fa',
        padding: '12px',
        borderRadius: '4px',
        maxHeight: '300px',
        overflow: 'auto'
      }}>
        <strong style={{ fontSize: '14px' }}>
          Messages ({messages.length}):
        </strong>
        {messages.length === 0 ? (
          <div style={{ 
            color: '#6c757d', 
            marginTop: '8px',
            fontSize: '13px' 
          }}>
            No messages yet... Click button above to test.
          </div>
        ) : (
          <div style={{ marginTop: '8px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                background: 'white',
                padding: '8px',
                marginBottom: '8px',
                borderRadius: '4px',
                fontSize: '12px',
                wordBreak: 'break-all',
                border: '1px solid #dee2e6'
              }}>
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSimpleSignalR;