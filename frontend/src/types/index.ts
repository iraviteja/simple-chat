export interface User {
  _id: string;
  name: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface Reaction {
  emoji: string;
  users: User[];
}

export interface Message {
  _id: string;
  sender: User;
  receiver?: User;
  group?: Group;
  content: string;
  type: "text" | "image" | "pdf" | "video";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  read: boolean;
  delivered: boolean;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  reactions?: Reaction[];
  replyTo?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  createdBy: User;
  members: User[];
  groupImage?: string;
  createdAt: string;
}

export interface Conversation {
  user: User;
  lastMessage: Message;
}
