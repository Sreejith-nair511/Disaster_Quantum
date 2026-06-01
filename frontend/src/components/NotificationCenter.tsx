"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface Notification {
  id: number;
  timestamp: string;
  channel: string;
  recipient?: string;
  region?: string;
  severity?: string;
  title?: string;
  message: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState("");
  const [channel, setChannel] = useState("sms");

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/alerts/history");
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/api/alerts/subscribe", {
        contact,
        channel,
      });
      setContact("");
      alert("Subscribed successfully (demo)");
    } catch (err) {
      console.error(err);
      alert("Subscription failed");
    }
  };

  return (
    <div className="glass-panel p-4 rounded-lg border border-slate-800">
      <h4 className="text-sm font-semibold text-slate-200 mb-2">Notification Center</h4>
      <div className="text-xs text-slate-400 mb-3">Recent notifications (demo)</div>
      <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
        {loading ? (
          <div className="text-xs text-slate-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-xs text-slate-500">No notifications yet.</div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="p-2 bg-slate-900/30 border border-slate-800 rounded">
              <div className="text-[11px] text-slate-400">{new Date(n.timestamp).toLocaleString()}</div>
              <div className="text-sm text-slate-200 font-semibold">{n.title || n.channel}</div>
              <div className="text-xs text-slate-300 mt-1">{n.message}</div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubscribe} className="flex gap-2">
        <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone/email" className="flex-1 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs" />
        <select value={channel} onChange={(e) => setChannel(e.target.value)} className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs">
          <option value="sms">SMS</option>
          <option value="email">Email</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
        <button className="px-3 py-1 bg-cyan-600 rounded text-xs">Subscribe</button>
      </form>
    </div>
  );
}
