/**
 * API functions for Employee Management System
 */

import { apiFetch } from './api';

// ==================== Attendance ====================

export async function checkIn(token: string, data: { location?: any; method?: string }) {
  return apiFetch<any>('/api/employee-management/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify(data),
    authToken: token
  });
}

export async function checkOut(token: string, data: { location?: any; method?: string }) {
  return apiFetch<any>('/api/employee-management/attendance/check-out', {
    method: 'POST',
    body: JSON.stringify(data),
    authToken: token
  });
}

export async function getAttendanceRecords(token: string, params: {
  employeeId?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams(params as any).toString();
  return apiFetch<any>(`/api/employee-management/attendance?${query}`, { authToken: token });
}

export async function getAttendanceStats(token: string, params: {
  employeeId?: number;
  month?: number;
  year?: number;
}) {
  const query = new URLSearchParams(params as any).toString();
  return apiFetch<any>(`/api/employee-management/attendance/stats?${query}`, { authToken: token });
}

export async function updateAttendanceRecord(token: string, id: number, data: any) {
  return apiFetch<any>(`/api/employee-management/attendance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    authToken: token
  });
}

// ==================== Schedules ====================

export async function getAllSchedules(token: string) {
  return apiFetch<any>('/api/employee-management/schedules', { authToken: token });
}

export async function getSchedule(token: string, employeeId: number) {
  return apiFetch<any>(`/api/employee-management/schedules/${employeeId}`, { authToken: token });
}

export async function upsertSchedule(token: string, employeeId: number, data: any) {
  return apiFetch<any>(`/api/employee-management/schedules/${employeeId}`, {
    method: 'POST',
    body: JSON.stringify(data),
    authToken: token
  });
}

// ==================== Salaries ====================

export async function getSalaries(token: string, params: {
  employeeId?: number;
  month?: number;
  year?: number;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams(params as any).toString();
  return apiFetch<any>(`/api/employee-management/salaries?${query}`, { authToken: token });
}

export async function createSalary(token: string, data: any) {
  return apiFetch<any>('/api/employee-management/salaries', {
    method: 'POST',
    body: JSON.stringify(data),
    authToken: token
  });
}

export async function paySalary(token: string, id: number, data: { paymentMethod: string; paymentReference?: string }) {
  return apiFetch<any>(`/api/employee-management/salaries/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(data),
    authToken: token
  });
}

// ==================== Points ====================

export async function getPointsSettings(token: string) {
  return apiFetch<any>('/api/employee-management/points/settings', { authToken: token });
}

export async function updatePointsSettings(token: string, data: any) {
  return apiFetch<any>('/api/employee-management/points/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
    authToken: token
  });
}

export async function getPointsLeaderboard(token: string) {
  return apiFetch<any>('/api/employee-management/points/leaderboard', { authToken: token });
}

export async function getEmployeePoints(token: string, employeeId: number, params?: { page?: number; limit?: number }) {
  const query = params ? new URLSearchParams(params as any).toString() : '';
  return apiFetch<any>(`/api/employee-management/points/${employeeId}?${query}`, { authToken: token });
}

export async function addPoints(token: string, data: { employeeId: number; points: number; type: string; reason: string }) {
  return apiFetch<any>('/api/employee-management/points', {
    method: 'POST',
    body: JSON.stringify(data),
    authToken: token
  });
}

// ==================== Leaves ====================

export async function getLeaveRequests(token: string, params: {
  employeeId?: number;
  status?: string;
  leaveType?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams(params as any).toString();
  return apiFetch<any>(`/api/employee-management/leaves?${query}`, { authToken: token });
}

export async function requestLeave(token: string, data: any) {
  return apiFetch<any>('/api/employee-management/leaves', {
    method: 'POST',
    body: JSON.stringify(data),
    authToken: token
  });
}

export async function processLeaveRequest(token: string, id: number, data: { action: 'approve' | 'reject'; rejectionReason?: string }) {
  return apiFetch<any>(`/api/employee-management/leaves/${id}/process`, {
    method: 'PUT',
    body: JSON.stringify(data),
    authToken: token
  });
}

export async function getLeaveBalance(token: string, employeeId: number, year?: number) {
  const query = year ? `?year=${year}` : '';
  return apiFetch<any>(`/api/employee-management/leaves/balance/${employeeId}${query}`, { authToken: token });
}

// ==================== Bonuses ====================

export async function getBonuses(token: string, params: {
  employeeId?: number;
  type?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams(params as any).toString();
  return apiFetch<any>(`/api/employee-management/bonuses?${query}`, { authToken: token });
}

export async function addBonus(token: string, data: any) {
  return apiFetch<any>('/api/employee-management/bonuses', {
    method: 'POST',
    body: JSON.stringify(data),
    authToken: token
  });
}

export async function deleteBonus(token: string, id: number) {
  return apiFetch<any>(`/api/employee-management/bonuses/${id}`, {
    method: 'DELETE',
    authToken: token
  });
}

// ==================== Dashboard & Reports ====================

export async function getEmployeeDashboard(token: string) {
  return apiFetch<any>('/api/employee-management/dashboard', { authToken: token });
}

export async function getEmployeePerformanceReport(token: string, employeeId: number, params?: { month?: number; year?: number }) {
  const query = params ? new URLSearchParams(params as any).toString() : '';
  return apiFetch<any>(`/api/employee-management/reports/performance/${employeeId}?${query}`, { authToken: token });
}
