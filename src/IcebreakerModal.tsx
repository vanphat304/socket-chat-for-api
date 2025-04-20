import React, { useEffect, useState } from 'react';
import { IcebreakerQuestion } from './chat';
import { API_URL, ChatSocketEvent } from './config';
import './IcebreakerModal.css';

interface IcebreakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  socket: any;
  conversationId: number;
  userId: number;
}

const IcebreakerModal: React.FC<IcebreakerModalProps> = ({
  isOpen,
  onClose,
  socket,
  conversationId,
  userId
}) => {
  const [questions, setQuestions] = useState<IcebreakerQuestion[]>([]);
  const [partnerViewingIndex, setPartnerViewingIndex] = useState<number | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch(`${API_URL}/common/list-questions`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setQuestions(data.data.items);
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    };

    if (isOpen) {
      fetchQuestions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!socket || !isOpen) return;

    const handlePartnerSelection = (data: { userId: number; questionIndex: number }) => {
      if (data.userId === userId) return;
      setPartnerViewingIndex(data.questionIndex);
      console.log('Partner viewing index:', data.questionIndex);
    };

    socket.on(ChatSocketEvent.PARTNER_SELECTING_QUESTION, handlePartnerSelection);

    return () => {
      socket.off(ChatSocketEvent.PARTNER_SELECTING_QUESTION, handlePartnerSelection);
    };
  }, [socket, isOpen, userId]);

  const handleQuestionSelect = (index: number) => {
    setSelectedQuestion(index);
    socket.emit(ChatSocketEvent.SELECT_ICEBREAKER_QUESTION, {
      conversationId,
      questionIndex: index
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="icebreaker-modal">
        <div className="icebreaker-header">
          <h2>Pour briser la glace</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="questions-container">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={`question-item ${selectedQuestion === index ? 'selected' : ''} ${
                partnerViewingIndex === index ? 'partner-viewing' : ''
              }`}
              onClick={() => handleQuestionSelect(index)}
            >
              {question.name}
              {question.isNeedSubscription && <span className="premium-badge">Premium</span>}
              {partnerViewingIndex === index && (
                <div className="partner-indicator">Partner is viewing</div>
              )}
            </div>
          ))}
        </div>
        <div className="choose-text">Choisissez-en un !</div>
      </div>
    </div>
  );
};

export default IcebreakerModal; 