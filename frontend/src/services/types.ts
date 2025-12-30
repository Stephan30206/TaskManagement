export interface User {
    role: string;
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
    avatar?: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
    ownerId: string;
    adminIds: string[];
    teamIds: string[];
    createdAt: Date;
    updatedAt: Date;
    owner?: User;
    members?: User[];
}

export interface ProjectUserRole {
    id: string;
    projectId: string;
    userId: string;
    role: 'ADMIN' | 'MANAGER' | 'MEMBER' | 'OBSERVER';
    permissions: string[];
    joinedAt: Date;
    updatedAt: Date;
    invitedBy?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'IN_VALIDATION' | 'DONE';
    estimatedDate?: Date;
    dueDate?: Date;
    projectId: string;
    creatorId: string;
    assigneeIds: string[];
    labelIds: string[];
    checklistIds: string[];
    attachmentIds: string[];
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    storyPoints?: number;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    assignees?: User[];
    creator?: User;
    project?: Project;
    labels?: TicketLabel[];
    checklists?: Checklist[];
    attachments?: Attachment[];
    commentCount?: number;
    activities?: TicketActivity[];
    dependencies?: TaskDependency[];
}

export interface Comment {
    id: string;
    content: string;
    authorId: string;
    ticketId: string;
    createdAt: Date;
    updatedAt: Date;
    author?: User;
}

export interface TicketLabel {
    id: string;
    name: string;
    description?: string;
    color: string;
    projectId: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
}

export interface ChecklistItem {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    completedBy?: string;
    completedAt?: Date;
    assignedTo?: string;
    dueDate?: Date;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Checklist {
    id: string;
    title: string;
    description?: string;
    ticketId: string;
    items: ChecklistItem[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
}

export interface Attachment {
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileUrl: string;
    thumbnailUrl?: string;
    ticketId: string;
    commentId?: string;
    uploadedBy: string;
    uploadedAt: Date;
    description?: string;
    isImage: boolean;
    width?: number;
    height?: number;
    deleted: boolean;
    deletedAt?: Date;
    deletedBy?: string;
}

export interface TicketActivity {
    id: string;
    ticketId: string;
    projectId: string;
    action: string;
    actionBy: string;
    actionByName: string;
    actionByEmail: string;
    description: string;
    changes?: Record<string, any>;
    relatedEntityId?: string;
    relatedEntityType?: string;
    createdAt: Date;
}

export interface TaskDependency {
    id: string;
    dependentTicketId: string;
    dependsOnTicketId: string;
    projectId: string;
    relationshipType: string;
    description?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
}

export interface Notification {
    id: string;
    recipientId: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
    type: string;
    title: string;
    message: string;
    entityType: string;
    entityId: string;
    projectId: string;
    relatedData?: Record<string, any>;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    actionUrl?: string;
    sendEmail: boolean;
    emailSentAt?: Date;
    dismissed: boolean;
    dismissedAt?: Date;
}

export interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    projectId: string;
    userId: string;
    userName: string;
    userEmail: string;
    description: string;
    changes?: Record<string, any>;
    details?: Record<string, any>;
    createdAt: Date;
    ipAddress: string;
    deletedByAdmin: boolean;
    deleteReason?: string;
    deletedAt?: Date;
    deletedById?: string;
}

export interface AuthResponse {
    token: string;
    email: string;
    userId?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}

export interface DashboardStats {
    totalProjects: number;
    activeProjects: number;
    inactiveProjects: number;
    archivedProjects: number;
    ownedProjects: number;
    totalTickets: number;
    todoTickets: number;
    inProgressTickets: number;
    inValidationTickets: number;
    doneTickets: number;
}

export interface Column {
    id: string;
    title: string;
    tickets: Ticket[];
    color: string;
}

export interface Notification {
    id: string;
    recipientId: string;
    senderId: string;
    senderName: string;
    senderEmail: string;
    type: string;
    title: string;
    message: string;
    entityType: string;
    entityId: string;
    projectId: string;
    relatedData?: Record<string, any>;
    isRead: boolean;
    readAt?: Date;
    createdAt: Date;
    actionUrl?: string;
    sendEmail: boolean;
    emailSentAt?: Date;
    dismissed: boolean;
    dismissedAt?: Date;
}

export type TicketStatus = 'TODO' | 'IN_PROGRESS' | 'IN_VALIDATION' | 'DONE';
export type ProjectStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'OBSERVER';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export class CreateLabelData {
}

export class UpdateLabelData {
}