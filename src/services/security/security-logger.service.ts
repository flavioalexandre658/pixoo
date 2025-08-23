"use server";

import { db } from "@/db";
import { securityLogs, abuseReports, deviceFingerprints } from "@/db/schema";
import { eq, and, gte, count, desc } from "drizzle-orm";

export interface SecurityLogData {
  eventType: 'account_creation' | 'rate_limit_exceeded' | 'suspicious_activity' | 'fingerprint_reuse' | 'multiple_accounts_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress: string;
  userAgent: string;
  fingerprint?: string;
  userId?: string;
  email?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface AbuseReportData {
  reportType: 'multiple_accounts' | 'credit_farming' | 'suspicious_pattern' | 'rate_limit_abuse';
  ipAddress: string;
  fingerprint?: string;
  affectedUserIds?: string[];
  evidenceData: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  actionTaken?: string;
}

class SecurityLoggerService {
  /**
   * Registra um evento de segurança
   */
  async logSecurityEvent(data: SecurityLogData): Promise<void> {
    try {
      await db.insert(securityLogs).values({
        eventType: data.eventType,
        severity: data.severity,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        fingerprint: data.fingerprint,
        userId: data.userId,
        email: data.email,
        description: data.description,
        metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      });

      console.log(`🔒 Security Event Logged: ${data.eventType} - ${data.severity} - ${data.description}`);
    } catch (error) {
      console.error('Erro ao registrar evento de segurança:', error);
    }
  }

  /**
   * Cria um relatório de abuso
   */
  async createAbuseReport(data: AbuseReportData): Promise<void> {
    try {
      await db.insert(abuseReports).values({
        reportType: data.reportType,
        ipAddress: data.ipAddress,
        fingerprint: data.fingerprint,
        affectedUserIds: data.affectedUserIds ? JSON.stringify(data.affectedUserIds) : null,
        evidenceData: JSON.stringify(data.evidenceData),
        severity: data.severity,
        actionTaken: data.actionTaken,
      });

      console.log(`🚨 Abuse Report Created: ${data.reportType} - ${data.severity}`);
    } catch (error) {
      console.error('Erro ao criar relatório de abuso:', error);
    }
  }

  /**
   * Detecta padrões suspeitos de uso
   */
  async detectSuspiciousPatterns(ipAddress: string, fingerprint?: string): Promise<void> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Verificar múltiplas contas do mesmo IP
      const accountsFromIP = await db
        .select({ count: count() })
        .from(securityLogs)
        .where(
          and(
            eq(securityLogs.eventType, 'account_creation'),
            eq(securityLogs.ipAddress, ipAddress),
            gte(securityLogs.createdAt, oneDayAgo)
          )
        );

      if (accountsFromIP[0]?.count >= 3) {
        await this.logSecurityEvent({
          eventType: 'multiple_accounts_detected',
          severity: 'high',
          ipAddress,
          userAgent: 'system',
          description: `Detectadas ${accountsFromIP[0].count} criações de conta do mesmo IP em 24h`,
          metadata: {
            accountCount: accountsFromIP[0].count,
            timeframe: '24h',
            detectionTime: now.toISOString(),
          },
        });

        await this.createAbuseReport({
          reportType: 'multiple_accounts',
          ipAddress,
          evidenceData: {
            accountCount: accountsFromIP[0].count,
            timeframe: '24h',
            detectionMethod: 'ip_analysis',
          },
          severity: 'high',
          actionTaken: 'automatic_detection',
        });
      }

      // Verificar reutilização de fingerprint
      if (fingerprint) {
        const fingerprintUsage = await db
          .select({ count: count() })
          .from(deviceFingerprints)
          .where(eq(deviceFingerprints.fingerprint, fingerprint));

        if (fingerprintUsage[0]?.count > 1) {
          await this.logSecurityEvent({
            eventType: 'fingerprint_reuse',
            severity: 'medium',
            ipAddress,
            userAgent: 'system',
            fingerprint,
            description: `Fingerprint reutilizado em ${fingerprintUsage[0].count} dispositivos`,
            metadata: {
              usageCount: fingerprintUsage[0].count,
              detectionTime: now.toISOString(),
            },
          });
        }
      }

      // Verificar atividade suspeita recente
      const recentActivity = await db
        .select({ count: count() })
        .from(securityLogs)
        .where(
          and(
            eq(securityLogs.ipAddress, ipAddress),
            gte(securityLogs.createdAt, oneHourAgo)
          )
        );

      if (recentActivity[0]?.count >= 10) {
        await this.logSecurityEvent({
          eventType: 'suspicious_activity',
          severity: 'high',
          ipAddress,
          userAgent: 'system',
          description: `Atividade suspeita: ${recentActivity[0].count} eventos em 1h`,
          metadata: {
            eventCount: recentActivity[0].count,
            timeframe: '1h',
            detectionTime: now.toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('Erro ao detectar padrões suspeitos:', error);
    }
  }

  /**
   * Obtém logs de segurança recentes
   */
  async getRecentSecurityLogs(limit: number = 50) {
    try {
      return await db
        .select()
        .from(securityLogs)
        .orderBy(desc(securityLogs.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('Erro ao obter logs de segurança:', error);
      return [];
    }
  }

  /**
   * Obtém relatórios de abuso pendentes
   */
  async getPendingAbuseReports() {
    try {
      return await db
        .select()
        .from(abuseReports)
        .where(eq(abuseReports.status, 'pending'))
        .orderBy(desc(abuseReports.createdAt));
    } catch (error) {
      console.error('Erro ao obter relatórios de abuso:', error);
      return [];
    }
  }
}

export const securityLogger = new SecurityLoggerService();