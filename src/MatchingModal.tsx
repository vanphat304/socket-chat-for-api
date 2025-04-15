import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL_SOCKET, ChatSocketEvent } from './config';
interface MatchedUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  age: number;
  height: number;
  city: string;
  countryCode: string;
  universityName: string;
  commonHobbiesCount: number;
  commonHobbies: string[];
  matchScore: number;
  distance: number;
}

interface MatchFoundData {
  conversationId: number;
  matchedUser: MatchedUser;
  remainingMatches: number;
}

interface MatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchFound: (data: MatchFoundData) => void;
}

const MatchingModal: React.FC<MatchingModalProps> = ({ isOpen, onClose, onMatchFound }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<any | null>(null);
  const [isMatching, setIsMatching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !token || !user) return;

    const newSocket = io(API_URL_SOCKET, {
      extraHeaders: {
        Authorization: `Bearer ${token}`
      },
      query: {
        isMatching: true
      }
    } as any);

    newSocket.on(ChatSocketEvent.CONNECT, () => {
      console.log('Matching socket connected');
      newSocket.emit(ChatSocketEvent.FIND_MATCHES);
    });

    newSocket.on(ChatSocketEvent.DISCONNECT, () => {
      console.log('Matching socket disconnected');
    });

    newSocket.on(ChatSocketEvent.ERROR, (error) => {
      console.error('Matching socket error:', error);
      setError(error.message || 'An error occurred while finding matches');
      // Close the modal after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    });

    newSocket.on(ChatSocketEvent.MATCH_FOUND, (data: MatchFoundData) => {
      console.log('Match found:', data);
      setIsMatching(false);
      onMatchFound(data);
      onClose();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isOpen, token, user, onClose, onMatchFound]);

  const startMatching = () => {
    if (!socket) return;
    setIsMatching(true);
    setError(null);
    socket.emit(ChatSocketEvent.FIND_MATCHES);
  };

  const stopMatching = () => {
    if (!socket) return;
    setIsMatching(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Find a Match</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error ? (
            <div className="error-message">
              {error}
            </div>
          ) : isMatching ? (
            <div className="matching-status">
              <p>Finding a match...</p>
              <button onClick={stopMatching}>Stop Matching</button>
            </div>
          ) : (
            <button onClick={startMatching}>Start Matching</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchingModal; 