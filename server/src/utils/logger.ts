import fs from 'fs';
import path from 'path';

// Simple Alert Hook (In a real system, this might send an email or Slack notification)
const triggerAlert = (type: string, details: any) => {
    console.error(`[ALERT] ${type}:`, JSON.stringify(details, null, 2));
    // TODO: Integrate with actual alerting service (e.g., PagerDuty, Email)
};

// Rate limiting for alerts to avoid flooding
const alertHistory: { [key: string]: number } = {};
const ALERT_THRESHOLD = 5; // e.g., 5 failed logins triggers an alert

export const logger = {
    info: (message: string, meta?: any) => {
        console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), message, ...meta }));
    },

    error: (message: string, error?: any) => {
        console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), message, error: error?.message || error }));
    },

    warn: (message: string, meta?: any) => {
        console.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), message, ...meta }));
    },

    // Specific Audit Logs
    logAuthFailure: (email: string, ip: string, reason: string) => {
        console.warn(JSON.stringify({
            level: 'warn',
            event: 'AUTH_FAILURE',
            timestamp: new Date().toISOString(),
            email,
            ip,
            reason
        }));

        // Alerting Logic
        const key = `${email}:${ip}`;
        alertHistory[key] = (alertHistory[key] || 0) + 1;

        if (alertHistory[key] >= ALERT_THRESHOLD) {
            triggerAlert('Suspicious Activity: Multiple Failed Logins', { email, ip, count: alertHistory[key] });
            // Reset after alert to avoid continuous noise, or keep escalating
            alertHistory[key] = 0;
        }
    },

    logAction: (userId: string | undefined, action: string, details: any) => {
        console.log(JSON.stringify({
            level: 'info',
            event: 'USER_ACTION',
            timestamp: new Date().toISOString(),
            userId: userId || 'anonymous',
            action,
            details
        }));
    },

    logAdminAction: (adminId: string, action: string, details: any) => {
        console.log(JSON.stringify({
            level: 'info',
            event: 'ADMIN_ACTION',
            timestamp: new Date().toISOString(),
            adminId,
            action,
            details
        }));
    }
};
