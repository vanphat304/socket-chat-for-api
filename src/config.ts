export const API_URL_SOCKET = 'http://localhost:4000';
export const API_URL =  'http://localhost:4000/v1';


export enum ChatSocketEvent {
    SEND_MESSAGE = 'sendMessage',
    FIND_MATCHES = 'findMatches',
    CONFIRM_MATCH = 'confirmMatch',
  
    NEW_MESSAGE = 'newMessage',
    NEW_MESSAGE_NOTIFICATION = 'newMessageNotification',
    MATCH_FOUND = 'matchFound',
    ERROR = 'error',

    DISCONNECT = 'disconnect',
    CONNECT = 'connect',
  }