import axios from 'axios';
import type {
    User,
    Project,
    ProjectUserRole,
    Ticket,
    Comment,
    TicketLabel,
    Checklist,
    Attachment,
    TicketActivity,
    TaskDependency,
    Notification,
    AuditLog,
    AuthResponse,
    DashboardStats,
    ApiResponse,
    CreateLabelData,
} from './types';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        if (status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }

        if (status === 403) {
            console.warn(`[API 403 Forbidden] ${error.config?.method?.toUpperCase() || 'REQUEST'} ${error.config?.url || 'unknown'}`);
            console.warn('Détails erreur:', error.response?.data);
        }

        return Promise.reject(error);
    }
);

class RegisterFormData {
}

export const authApi = {
    register: (userData: Omit<RegisterFormData, "confirmPassword">) =>
        api.post<AuthResponse>('/auth/register', userData),
    login: (credentials: { email: string; password: string }) =>
        api.post<AuthResponse>('/auth/login', credentials),
};

export const userApi = {
    getCurrentUser: () => api.get<User>('/users/me'),
    updateProfile: (data: Partial<User>) => api.put<User>('/users/me', data),
    getAllUsers: () => api.get<User[]>('/users'),
    searchUsers: (query: string) => api.get<User[]>(`/users/search?query=${query}`),
};

export const projectApi = {
    getAll: () => api.get<Project[]>('/projects'),
    getById: (id: string) => api.get<Project>(`/projects/${id}`),
    create: (projectData: Omit<Project, 'id' | 'ownerId' | 'adminIds' | 'teamIds' | 'createdAt' | 'updatedAt'>) =>
        api.post<Project>('/projects', projectData),
    update: (id: string, projectData: Partial<Project>) => api.put<Project>(`/projects/${id}`, projectData),
    delete: (id: string) => api.delete(`/projects/${id}`),
    search: (keyword: string) => api.get<Project[]>(`/projects/search?keyword=${keyword}`),
    getStats: () => api.get<DashboardStats>('/projects/stats'),
    getMembers: (projectId: string) => api.get<User[]>(`/projects/${projectId}/members`),
    addAdmin: (projectId: string, adminId: string) => api.post<Project>(`/projects/${projectId}/admins/${adminId}`),
    removeAdmin: (projectId: string, adminId: string) => api.delete<Project>(`/projects/${projectId}/admins/${adminId}`),
    addTeamMember: (projectId: string, memberId: string) => api.post<Project>(`/projects/${projectId}/team/${memberId}`),
    removeTeamMember: (projectId: string, memberId: string) =>
        api.delete<Project>(`/projects/${projectId}/team/${memberId}`),
    updateStatus: (id: string, status: string) => api.put<Project>(`/projects/${id}/status`, { status }),
    getProjectsByUser: () => api.get<ApiResponse<Project[]>>('/projects/user'),
};

export const projectRoleApi = {
    getUserRole: (projectId: string, userId: string) =>
        api.get<ProjectUserRole>(`/project-roles/projects/${projectId}/users/${userId}`),
    assignRole: (projectId: string, userId: string, role: string) =>
        api.post<ProjectUserRole>(`/project-roles/projects/${projectId}/users/${userId}`, { role }),
    updateRole: (projectId: string, userId: string, role: string) =>
        api.put<ProjectUserRole>(`/project-roles/projects/${projectId}/users/${userId}`, { role }),
    removeRole: (projectId: string, userId: string) =>
        api.delete(`/project-roles/projects/${projectId}/users/${userId}`),
    getProjectMembers: (projectId: string) => api.get<ProjectUserRole[]>(`/project-roles/projects/${projectId}/members`),
};

export const ticketApi = {
    getByProject: (projectId: string) => api.get<Ticket[]>(`/tickets/project/${projectId}`),
    getById: (id: string) => api.get<Ticket>(`/tickets/${id}`),
    create: (projectId: string, ticketData: any) => {
        const formattedData = { ...ticketData, projectId };

        if (formattedData.estimatedDate && formattedData.estimatedDate instanceof Date) {
            formattedData.estimatedDate = formattedData.estimatedDate.toISOString();
        }

        if (formattedData.dueDate && formattedData.dueDate instanceof Date) {
            formattedData.dueDate = formattedData.dueDate.toISOString();
        }

        return api.post<Ticket>('/tickets', formattedData);
    },
    update: (id: string, ticketData: Partial<Ticket>) => api.put<Ticket>(`/tickets/${id}`, ticketData),
    delete: (id: string) => api.delete(`/tickets/${id}`),
    getMyTickets: () => api.get<Ticket[]>('/tickets/my-tickets'),
    getAssignedTickets: () => api.get<Ticket[]>('/tickets/assigned'),
    assignTicket: (ticketId: string, assigneeIds: string[]) =>
        api.post<Ticket>(`/tickets/${ticketId}/assign`, { assigneeIds }),
    updateStatus: (ticketId: string, status: string) =>
        api.put<Ticket>(`/tickets/${ticketId}/status`, { status }),
    search: (keyword: string, projectId?: string) => {
        const params = new URLSearchParams();
        params.append('keyword', keyword);
        if (projectId) params.append('projectId', projectId);
        return api.get<Ticket[]>(`/tickets/search?${params.toString()}`);
    },
    filter: (filters: { status?: string; projectId?: string; assigneeId?: string }) => {
        const params = new URLSearchParams();
        if (filters.status) params.append('status', filters.status);
        if (filters.projectId) params.append('projectId', filters.projectId);
        if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);
        return api.get<Ticket[]>(`/tickets/filter?${params.toString()}`);
    },
    getOverdue: () => api.get<Ticket[]>('/tickets/overdue'),
    getStats: (projectId: string) => api.get<any>(`/tickets/project/${projectId}/stats`),
};

export const commentApi = {
    getByTicket: (ticketId: string) => api.get<Comment[]>(`/comments/ticket/${ticketId}`),
    create: (commentData: { content: string; ticketId: string; authorId?: string }) => {
        const dataToSend = { ...commentData };
        if (!dataToSend.authorId) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.id) {
                dataToSend.authorId = user.id;
            }
        }
        return api.post<Comment>('/comments', dataToSend);
    },
    update: (id: string, content: string) => api.put<Comment>(`/comments/${id}`, { content }),
    delete: (id: string) => api.delete(`/comments/${id}`),
    getWithAuthors: (ticketId: string) => api.get<any[]>(`/comments/ticket/${ticketId}/with-authors`),
};

export const labelApi = {
    create: (projectId: string, labelData: CreateLabelData) =>
        api.post<TicketLabel>(`/labels/projects/${projectId}`, labelData),
    getByProject: (projectId: string) => api.get<TicketLabel[]>(`/labels/projects/${projectId}`),
    getById: (labelId: string) => api.get<TicketLabel>(`/labels/${labelId}`),
    update: (labelId: string, labelData: { name?: string; color?: string; description?: string }) =>
        api.put<TicketLabel>(`/labels/${labelId}`, labelData),
    delete: (labelId: string) => api.delete(`/labels/${labelId}`),
    search: (projectId: string, query: string) =>
        api.get<TicketLabel[]>(`/labels/projects/${projectId}/search?query=${query}`),
};

export const checklistApi = {
    create: (ticketId: string, checklistData: { title: string; description?: string }) =>
        api.post<Checklist>(`/checklists/tickets/${ticketId}`, checklistData),
    getByTicket: (ticketId: string) => api.get<Checklist[]>(`/checklists/tickets/${ticketId}`),
    getById: (checklistId: string) => api.get<Checklist>(`/checklists/${checklistId}`),
    update: (checklistId: string, checklistData: { title?: string; description?: string }) =>
        api.put<Checklist>(`/checklists/${checklistId}`, checklistData),
    delete: (checklistId: string) => api.delete(`/checklists/${checklistId}`),
    addItem: (checklistId: string, itemData: { title: string; description?: string }) =>
        api.post(`/checklists/${checklistId}/items`, itemData),
    completeItem: (checklistId: string, itemId: string) =>
        api.put(`/checklists/${checklistId}/items/${itemId}/complete`),
    uncompleteItem: (checklistId: string, itemId: string) =>
        api.put(`/checklists/${checklistId}/items/${itemId}/uncomplete`),
    updateItem: (checklistId: string, itemId: string, itemData: { title?: string; description?: string }) =>
        api.put(`/checklists/${checklistId}/items/${itemId}`, itemData),
    deleteItem: (checklistId: string, itemId: string) =>
        api.delete(`/checklists/${checklistId}/items/${itemId}`),
    getProgress: (checklistId: string) => api.get<{ progress: number }>(`/checklists/${checklistId}/progress`),
    assignItem: (checklistId: string, itemId: string, userId: string) =>
        api.put(`/checklists/${checklistId}/items/${itemId}/assign/${userId}`),
};

export const attachmentApi = {
    upload: (file: File, ticketId: string, commentId?: string, description?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('ticketId', ticketId);
        if (commentId) formData.append('commentId', commentId);
        if (description) formData.append('description', description);
        return api.post<Attachment>('/attachments/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    getById: (attachmentId: string) => api.get<Attachment>(`/attachments/${attachmentId}`),
    getByTicket: (ticketId: string) => api.get<Attachment[]>(`/attachments/tickets/${ticketId}`),
    getByComment: (commentId: string) => api.get<Attachment[]>(`/attachments/comments/${commentId}`),
    update: (attachmentId: string, data: { description?: string; thumbnailUrl?: string }) =>
        api.put<Attachment>(`/attachments/${attachmentId}`, data),
    delete: (attachmentId: string) => api.delete(`/attachments/${attachmentId}`),
    restore: (attachmentId: string) => api.put<Attachment>(`/attachments/${attachmentId}/restore`),
    setDimensions: (attachmentId: string, width: number, height: number) =>
        api.put<Attachment>(`/attachments/${attachmentId}/dimensions`, { width, height }),

    download: (attachmentId: string) => api.get(`/attachments/${attachmentId}/download`, {
        responseType: 'blob',
    }),

    getDownloadUrl: (attachmentId: string) =>
        api.get<{
            fileUrl: any; downloadUrl: string
        }>(`/attachments/${attachmentId}/download-url`),

    getStats: (ticketId: string) =>
        api.get<{ count: number; totalSize: number; totalSizeMB: number }>(`/attachments/tickets/${ticketId}/stats`),

    search: (ticketId: string, query: string) =>
        api.get<Attachment[]>(`/attachments/tickets/${ticketId}/search?query=${query}`),

    updateMetadata: (attachmentId: string, metadata: Record<string, any>) =>
        api.put<Attachment>(`/attachments/${attachmentId}/metadata`, metadata),

    getByProject: (projectId: string) =>
        api.get<Attachment[]>(`/attachments/projects/${projectId}`),

    getByUser: (userId: string) =>
        api.get<Attachment[]>(`/attachments/users/${userId}`),

    getRecent: (limit?: number) => {
        const params = new URLSearchParams();
        if (limit) params.append('limit', limit.toString());
        return api.get<Attachment[]>(`/attachments/recent?${params.toString()}`);
    },

    preview: (attachmentId: string) =>
        api.get(`/attachments/${attachmentId}/preview`, { responseType: 'blob' }),

    process: (attachmentId: string, operation: string) =>
        api.post<Attachment>(`/attachments/${attachmentId}/process`, { operation }),

    getExifData: (attachmentId: string) =>
        api.get<Record<string, any>>(`/attachments/${attachmentId}/exif`),
};

export const ticketActivityApi = {
    getByTicket: (ticketId: string) => api.get<TicketActivity[]>(`/ticket-activities/tickets/${ticketId}`),
    getByProject: (projectId: string) => api.get<TicketActivity[]>(`/ticket-activities/projects/${projectId}`),
    getByUser: (userId: string) => api.get<TicketActivity[]>(`/ticket-activities/users/${userId}`),
    getByAction: (action: string) => api.get<TicketActivity[]>(`/ticket-activities/actions/${action}`),
    getByDateRange: (ticketId: string, startDate: string, endDate: string) =>
        api.get<TicketActivity[]>(`/ticket-activities/tickets/${ticketId}/range?start=${startDate}&end=${endDate}`),
};

export const dependencyApi = {
    create: (dependencyData: {
        dependentTicketId: string;
        dependsOnTicketId: string;
        projectId: string;
        relationshipType?: string;
    }) => api.post<TaskDependency>('/dependencies', dependencyData),

    getByTicket: (ticketId: string) =>
        api.get<{ data: TaskDependency[]; count: number }>(`/dependencies/tickets/${ticketId}`),

    getBlockedBy: (ticketId: string) =>
        api.get<{ data: TaskDependency[]; count: number }>(`/dependencies/tickets/${ticketId}/blocked-by`),

    getById: (dependencyId: string) => api.get<TaskDependency>(`/dependencies/${dependencyId}`),
    getTicketDependencies: (ticketId: string) =>
        api.get<{ data: TaskDependency[]; count: number }>(`/dependencies/tickets/${ticketId}/depends-on`),
    getBlockedTickets: (ticketId: string) =>
        api.get<{ data: TaskDependency[]; count: number }>(`/dependencies/tickets/${ticketId}/blocked-by`),
    getProjectDependencies: (projectId: string) =>
        api.get<{ data: TaskDependency[]; count: number }>(`/dependencies/projects/${projectId}`),
    update: (dependencyId: string, data: { relationshipType?: string; description?: string }) =>
        api.put<TaskDependency>(`/dependencies/${dependencyId}`, data),
    delete: (dependencyId: string) => api.delete(`/dependencies/${dependencyId}`),
    canBeCompleted: (ticketId: string) =>
        api.get<{ ticketId: string; canComplete: boolean; blockingReason?: string }>(
            `/dependencies/tickets/${ticketId}/can-complete`
        ),
    checkCircular: (ticketId1: string, ticketId2: string) =>
        api.post<{ hasCircularDependency: boolean }>('/dependencies/check-circular', { ticketId1, ticketId2 }),
    getStats: (ticketId: string) =>
        api.get<{ ticketId: string; dependenciesCount: number; dependentsCount: number }>(
            `/dependencies/tickets/${ticketId}/stats`
        ),
};


export const notificationApi = {
    getAll: (page?: number, limit?: number) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.append('page', page.toString());
        if (limit !== undefined) params.append('limit', limit.toString());
        return api.get<{ data: Notification[]; total: number; unreadCount: number }>(
            `/notifications?${params.toString()}`
        );
    },
    getUnread: () => api.get<{
        slice(arg0: number, limit: number): import("react").SetStateAction<Notification[]>;
        data: Notification[];
        count: number
    }>('/notifications/unread'),
    getActive: () => api.get<{ data: Notification[]; count: number }>('/notifications/active'),
    getById: (notificationId: string) => api.get<Notification>(`/notifications/${notificationId}`),
    markAsRead: (notificationId: string) => api.put<Notification>(`/notifications/${notificationId}/read`),
    markAllAsRead: () => api.put('/notifications/read-all'),
    dismiss: (notificationId: string) => api.put<Notification>(`/notifications/${notificationId}/dismiss`),
    delete: (notificationId: string) => api.delete(`/notifications/${notificationId}`),
    getUnreadCount: () => api.get<{ unreadCount: number }>('/notifications/unread-count'),
    getByProject: (projectId: string, page?: number, limit?: number) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.append('page', page.toString());
        if (limit !== undefined) params.append('limit', limit.toString());
        return api.get<{ data: Notification[]; total: number }>(
            `/notifications/projects/${projectId}?${params.toString()}`
        );
    },
    getByEntity: (entityId: string, entityType: string) =>
        api.get<{ data: Notification[]; count: number }>(`/notifications/entities/${entityId}?entityType=${entityType}`),
};

export const auditApi = {
    getByProject: (projectId: string, page?: number, limit?: number) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.append('page', page.toString());
        if (limit !== undefined) params.append('limit', limit.toString());
        return api.get<{ data: AuditLog[]; total: number }>(`/audit-logs/projects/${projectId}?${params.toString()}`);
    },
    getByEntity: (entityId: string) => api.get<AuditLog[]>(`/audit-logs/entities/${entityId}`),
    getByUser: (userId: string, page?: number, limit?: number) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.append('page', page.toString());
        if (limit !== undefined) params.append('limit', limit.toString());
        return api.get<{ data: AuditLog[]; total: number }>(`/audit-logs/users/${userId}?${params.toString()}`);
    },
    getByAction: (action: string) => api.get<AuditLog[]>(`/audit-logs/actions/${action}`),
    getByDateRange: (projectId: string, startDate: string, endDate: string) =>
        api.get<AuditLog[]>(
            `/audit-logs/projects/${projectId}/date-range?startDate=${startDate}&endDate=${endDate}`
        ),
    export: (projectId: string, startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        return api.get<{ data: AuditLog[]; count: number }>(
            `/audit-logs/projects/${projectId}/export?${params.toString()}`
        );
    },
    delete: (auditLogId: string, reason: string) =>
        api.delete(`/audit-logs/${auditLogId}?reason=${encodeURIComponent(reason)}`),
    getStats: (projectId: string) =>
        api.get<{ projectId: string; totalAuditLogs: number }>(`/audit-logs/projects/${projectId}/stats`),
};

export const publicApi = {
    healthCheck: () => api.get<any>('/public/health'),
    getVersion: () => api.get<any>('/public/version'),
};

export const projectsApi = projectApi;
export const ticketsApi = ticketApi;
export const commentsApi = commentApi;

export default api;