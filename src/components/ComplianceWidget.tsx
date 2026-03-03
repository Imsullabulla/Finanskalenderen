'use client';
import React from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { useApp } from '@/context/AppContext';

export default function ComplianceWidget() {
    const { t } = useI18n();
    const { complianceScore } = useApp();

    return (
        <div className="compliance-widget">
            <div className="compliance-widget-header">
                <span className="compliance-widget-title">{t.compliance.title}</span>
                <span className="compliance-widget-score">{complianceScore.percentage}%</span>
            </div>
            <div className="compliance-bar">
                <div
                    className="compliance-bar-fill"
                    style={{ width: `${complianceScore.percentage}%` }}
                />
            </div>
            <div className="compliance-breakdown">
                <div className="compliance-stat">
                    <span className="compliance-stat-dot" style={{ background: 'var(--status-reported)' }} />
                    <span className="compliance-stat-label">{t.compliance.reported}</span>
                    <span className="compliance-stat-value">{complianceScore.reported}</span>
                </div>
                <div className="compliance-stat">
                    <span className="compliance-stat-dot" style={{ background: 'var(--status-warning)' }} />
                    <span className="compliance-stat-label">{t.compliance.pending}</span>
                    <span className="compliance-stat-value">{complianceScore.pending}</span>
                </div>
                <div className="compliance-stat">
                    <span className="compliance-stat-dot" style={{ background: 'var(--status-overdue)' }} />
                    <span className="compliance-stat-label">{t.compliance.overdue}</span>
                    <span className="compliance-stat-value">{complianceScore.overdue}</span>
                </div>
                <div className="compliance-stat">
                    <span className="compliance-stat-dot" style={{ background: 'var(--status-inactive)' }} />
                    <span className="compliance-stat-label">{t.compliance.inactive}</span>
                    <span className="compliance-stat-value">{complianceScore.inactive}</span>
                </div>
            </div>
        </div>
    );
}
