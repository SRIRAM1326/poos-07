'use client';

import React, { useEffect, useState } from 'react';
import { api, getCurrentUserId } from '@/services/api';
import { Certificate } from '@/types';
import { Award, Printer, ShieldCheck } from 'lucide-react';

interface CertificatesModalProps {
  onClose: () => void;
}

export const CertificatesModal: React.FC<CertificatesModalProps> = ({ onClose }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  useEffect(() => {
    async function loadCerts() {
      try {
        const userId = getCurrentUserId();
        if (userId === null) {
          setCertificates([]);
          return;
        }
        const data = await api.getCertificates(userId);
        if (Array.isArray(data)) {
          setCertificates(data);
        } else {
          setCertificates([]);
        }
      } catch (err) {
        console.error('Failed loading certificates:', err);
        setCertificates([]);
      }
    }
    loadCerts();
  }, []);


  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '820px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <button onClick={handlePrint} className="gold-btn" style={{ fontSize: '13px' }}>
            <Printer size={16} /> Print Verified Certificate
          </button>
          <button onClick={onClose} className="gold-btn-outline" style={{ fontSize: '13px', background: '#ffffff' }}>
            Close
          </button>
        </div>

        {certificates.map((cert) => (
          <div
            key={cert.id}
            style={{
              background: '#ffffff',
              border: '12px solid #fffbe6',
              outline: '2px solid #c9a227',
              borderRadius: 'var(--radius-lg)',
              padding: '48px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'var(--gold-bg)', border: '2px solid var(--gold-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Award size={36} color="var(--gold-dark)" />
              </div>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gold-dark)', fontWeight: 700 }}>
              VERIFIED OFFICIAL CERTIFICATE OF ACHIEVEMENT
            </div>

            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: 800, margin: '12px 0 24px', color: 'var(--text-main)' }}>
              {cert.title}
            </h1>

            <p style={{ fontSize: '14px', color: 'var(--text-soft)' }}>This is to certify that</p>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800, color: 'var(--gold-dark)', margin: '8px 0 16px' }}>
              {cert.recipient_name}
            </h2>

            <p style={{ fontSize: '15px', color: 'var(--text-soft)', maxWidth: '580px', margin: '0 auto 28px', lineHeight: '1.6' }}>
              {cert.description}
            </p>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: '24px', borderTop: '1px solid var(--border-gold)', marginTop: '24px',
              fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)'
            }}>
              <div style={{ textAlign: 'left' }}>
                <div>Issuer: <b>{cert.issuer_name}</b></div>
                <div>Issue Date: <b>{cert.issue_date}</b></div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ color: 'var(--green-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> PUBLICLY VERIFIED
                </div>
                <div style={{ fontSize: '10px' }}>ID: {cert.cert_hash}</div>
              </div>
            </div>
          </div>
        ))}

        {certificates.length === 0 && (
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px',
            textAlign: 'center',
            color: 'var(--text-muted)'
          }}>
            <Award size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-main)' }}>
              No verified certificates yet
            </div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>
              Certificates are issued after verified contributions are recognized on the platform.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
