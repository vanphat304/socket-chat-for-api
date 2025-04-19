// export const API_URL_SOCKET = 'http://165.22.31.3:4000';
// export const API_URL =  'http://165.22.31.3:4000/v1';
export const API_URL_SOCKET = 'http://localhost:4000';
export const API_URL =  'http://localhost:4000/v1';



  export enum ChatSocketEvent {
    SEND_MESSAGE = 'sendMessage',
    FIND_MATCHES = 'findMatches',
    CONFIRM_MATCH = 'confirmMatch',
    OUT_IN_FIRST_CHAT = 'outInFirstChat',

    
    PARTNER_OUT_IN_FIRST_CHAT = 'partnerOutInFirstChat',
    NEW_MESSAGE = 'newMessage',
    NEW_MESSAGE_NOTIFICATION = 'newMessageNotification',
    MATCH_FOUND = 'matchFound',
    ERROR = 'error',


    USER_JOINED_CONVERSATION = 'userJoinedConversation',
    MARK_MESSAGE_READ = 'markMessageRead',
    MESSAGE_READ = 'messageRead',

    DISCONNECT = 'disconnect',
    CONNECT = 'connect',
  }