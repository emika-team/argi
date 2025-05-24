export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export enum MonitorType {
  HTTP = 'http',
  HTTPS = 'https',
  TCP = 'tcp',
  PING = 'ping',
}

export enum MonitorStatus {
  UP = 'up',
  DOWN = 'down',
  PENDING = 'pending',
  PAUSED = 'paused',
}

export interface Monitor {
  _id: string;
  name: string;
  url: string;
  type: MonitorType;
  status: MonitorStatus;
  interval: number;
  timeout: number;
  maxRetries: number;
  isActive: boolean;
  userId: string;
  description?: string;
  tags: string[];
  lastCheckedAt: Date;
  lastResponseTime?: number;
  lastStatusCode?: number;
  lastError?: string;
  uptimePercentage: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  enableEmailAlerts: boolean;
  enableLineAlerts: boolean;
  enableDiscordAlerts: boolean;
  alertEmails: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMonitorRequest {
  name: string;
  url: string;
  type?: MonitorType;
  interval?: number;
  timeout?: number;
  maxRetries?: number;
  description?: string;
  tags?: string[];
  enableEmailAlerts?: boolean;
  enableLineAlerts?: boolean;
  enableDiscordAlerts?: boolean;
  alertEmails?: string[];
}

export interface UpdateMonitorRequest extends Partial<CreateMonitorRequest> {}

export enum CheckResult {
  SUCCESS = 'success',
  FAILURE = 'failure',
  TIMEOUT = 'timeout',
}

export interface MonitorLog {
  _id: string;
  monitorId: string;
  result: CheckResult;
  responseTime?: number;
  statusCode?: number;
  error?: string;
  responseSize?: number;
  serverIp?: string;
  checkedAt: Date;
  httpVersion?: string;
  headers?: Record<string, string>;
  redirectCount?: number;
  dnsLookupTime?: number;
  connectTime?: number;
  sslHandshakeTime?: number;
}

export interface MonitorStats {
  monitor: Monitor;
  stats: {
    totalChecks: number;
    successfulChecks: number;
    failedChecks: number;
    uptimePercentage: number;
    averageResponseTime: number;
    last24HoursUptime: number;
  };
  recentLogs: MonitorLog[];
}

export interface DashboardData {
  totalMonitors: number;
  activeMonitors: number;
  upMonitors: number;
  downMonitors: number;
  averageUptime: number;
  recentMonitors: Monitor[];
  recentLogs: MonitorLog[];
}

export interface SslCheck {
  hostname: string;
  valid: boolean;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  issuer?: string;
  subject?: string;
  error?: string;
}

export interface DomainCheck {
  domain: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
  isExpired?: boolean;
  isExpiringSoon?: boolean;
  error?: string;
} 