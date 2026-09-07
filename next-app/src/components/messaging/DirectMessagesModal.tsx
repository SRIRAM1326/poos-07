'use client';

import React, { useEffect, useState } from 'react';
import { X, Send, MessageSquare, CheckCircle2 } from 'lucide-react';
import { api, getCurrentUserId } from '@/services/api';

interface DirectMessagesModalProps {
  onClose: () => void;
  otherUserName?: string;
  otherUserId?: number;
}

export function DirectMessagesModal({ onClose, otherUserName = 'Recipient', otherUserId }: DirectMessagesModalProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!otherUserId) return;
    const recipientId = otherUserId;
    async function loadThread() {
      try {
        const thread = await api.getMessageThread(recipientId);
        setMessages(thread);
      } catch (err) {
        console.error('Failed loading message thread:', err);
      }
    }
    loadThread();
  }, [otherUserId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !otherUserId) return;

    const content = input.trim();
    setInput('');
    setLoading(true);

    try {
      const msg = await api.sendMessage({
        recipient_id: otherUserId,
        content
      });
      setMessages(prev => [...prev, msg]);
    } catch (err) {
      console.error('Failed sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        height: '600px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--gold-bg)',
              border: '1px solid var(--gold-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-dark)'
            }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                {otherUserName}
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>
                Direct Candidate-Recruiter Opportunity Channel
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Message Thread */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {!otherUserId ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginTop: '40px' }}>
              Select a recipient to view this conversation.
            </div>
          ) : (
          messages.map((m, idx) => {
            const myUserId = getCurrentUserId();
            const isMe = myUserId !== null && m.sender_id === myUserId;
            return (
              <div
                key={idx}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: isMe ? 'var(--blue-primary)' : 'var(--bg-subtle)',
                  color: isMe ? '#ffffff' : 'var(--text-main)',
                  padding: '12px 16px',
                  borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  border: isMe ? 'none' : '1px solid var(--border-color)',
                  fontSize: '13px',
                  lineHeight: '1.5'
                }}
              >
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px', fontWeight: 600 }}>
                  {m.sender_name}
                </div>
                <div>{m.content}</div>
              </div>
            );
          })
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-base)' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={otherUserId ? 'Type your message regarding opportunities or technical reviews...' : 'Select a recipient first'}
              value={input}
              disabled={!otherUserId}
              onChange={(e) => setInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 46px 12px 16px',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !otherUserId}
              style={{
                position: 'absolute',
                right: '6px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: 'none',
                background: 'var(--accent-green)',
                color: '#0a0f1d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
