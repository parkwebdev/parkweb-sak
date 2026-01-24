/**
 * Admin Pages Barrel Export
 * 
 * Central export for all Super Admin Dashboard pages.
 * Uses lazy loading to reduce initial bundle size - admin pages
 * are only loaded when a super admin accesses them.
 * 
 * @module pages/admin
 */

import { lazy } from 'react';

export const AdminLayout = lazy(() => import('./AdminLayout').then(m => ({ default: m.AdminLayout })));
export const AdminDashboard = lazy(() => import('./AdminDashboard').then(m => ({ default: m.AdminDashboard })));
export const AdminAccounts = lazy(() => import('./AdminAccounts').then(m => ({ default: m.AdminAccounts })));
export const AdminPrompts = lazy(() => import('./AdminPrompts').then(m => ({ default: m.AdminPrompts })));
export const AdminPlans = lazy(() => import('./AdminPlans').then(m => ({ default: m.AdminPlans })));
export const AdminTeam = lazy(() => import('./AdminTeam').then(m => ({ default: m.AdminTeam })));
export const AdminKnowledge = lazy(() => import('./AdminKnowledge').then(m => ({ default: m.AdminKnowledge })));
export const AdminEmails = lazy(() => import('./AdminEmails').then(m => ({ default: m.AdminEmails })));
export const AdminRevenue = lazy(() => import('./AdminRevenue').then(m => ({ default: m.AdminRevenue })));
export const AdminAuditLog = lazy(() => import('./AdminAuditLog').then(m => ({ default: m.AdminAuditLog })));
export const ArticleEditorPage = lazy(() => import('./ArticleEditorPage').then(m => ({ default: m.ArticleEditorPage })));
