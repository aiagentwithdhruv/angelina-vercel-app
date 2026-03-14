'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

interface CalendarEvent {
  title: string;
  start: string;
  end?: string;
}

export function CalendarCard() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState(true);

  useEffect(() => {
    fetch('/api/tools/check_calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: 7 }),
    })
      .then((r) => {
        if (!r.ok) { setConnected(false); return null; }
        return r.json();
      })
      .then((d) => {
        if (d?.success === false) { setConnected(false); return; }
        if (d?.events) setEvents(d.events.slice(0, 5));
      })
      .catch(() => setConnected(false));
  }, []);

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="rounded-xl bg-gunmetal/50 border border-steel-dark p-5">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-cyan-glow" />
        <h3 className="font-orbitron text-sm font-semibold text-text-secondary">CALENDAR</h3>
      </div>
      {!connected ? (
        <div className="text-sm text-text-muted">
          <p>Google Calendar not connected.</p>
          <Link href="/settings" className="text-cyan-glow/70 hover:text-cyan-glow text-xs mt-1 block">
            Connect in Settings →
          </Link>
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-text-muted">No upcoming events today.</p>
      ) : (
        <div className="space-y-2">
          {events.map((ev, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <Clock className="w-3.5 h-3.5 text-text-muted mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-text-primary truncate">{ev.title}</p>
                <p className="text-xs text-text-muted">{formatTime(ev.start)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
