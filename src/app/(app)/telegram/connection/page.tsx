"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../../lib/auth";
import { tgWebStart, tgWebStatus, tgWebVerify, tgWebStop } from "../../../../lib/api";

export default function TelegramConnectionPage() {
  const { user, loading } = useAuth();
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''), []);
  const [status, setStatus] = useState<string>("DISCONNECTED");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [tgUrl, setTgUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const pollRef = useRef<any>(null);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    tgWebStatus(token).then((r: any) => { if (mounted) setStatus(r.status); }).catch(() => {});
    return () => { mounted = false; };
  }, [token]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function startQr() {
    if (!token) return;
    setBusy(true);
    try {
      const res = await tgWebStart(token, { method: 'qr' });
      setQrDataUrl(res.qrCode || null);
      setWebUrl(res.webUrl || null);
      setTgUrl(res.tgUrl || null);
      setStatus(res.status || 'QR_READY');
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const s = await tgWebStatus(token);
          setStatus(s.status);
          if (s.status === 'CONNECTED') {
            setQrDataUrl(null);
            clearInterval(pollRef.current);
          }
        } catch {}
      }, 2000);
    } catch (e: any) {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  async function startPhone() {
    if (!token || !phone) return;
    setBusy(true);
    try {
      const res = await tgWebStart(token, { method: 'code', phone });
      setStatus(res.status || 'AWAITING_CODE');
    } catch (e: any) {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!token || !code) return;
    setBusy(true);
    try {
      const res = await tgWebVerify(token, code, password || undefined);
      setStatus(res.status || (res.success ? 'CONNECTED' : 'DISCONNECTED'));
    } catch (e: any) {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    if (!token) return;
    setBusy(true);
    try {
      await tgWebStop(token);
      setStatus('DISCONNECTED');
      setQrDataUrl(null);
      setWebUrl(null);
      setTgUrl(null);
      if (pollRef.current) clearInterval(pollRef.current);
    } catch (e: any) {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6">Please sign in to connect Telegram.</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Telegram Connection</h1>
      <div className="space-y-2">
        <div className="text-sm text-gray-600">Status: <span className="font-medium">{status}</span></div>
        <div className="flex gap-2">
          <button onClick={startQr} disabled={busy} className="px-3 py-2 bg-blue-600 text-white rounded">Start QR Login</button>
          <button onClick={stop} disabled={busy} className="px-3 py-2 bg-gray-200 rounded">Disconnect</button>
        </div>
      </div>

      {qrDataUrl && (
        <div className="space-y-2">
          <div className="text-sm">Scan this QR with your Telegram app:</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Telegram QR" className="w-64 h-64 bg-white p-2" />
          <div className="text-xs text-gray-500 break-all">
            {webUrl ? (<div>Open in browser: {webUrl}</div>) : null}
            {tgUrl ? (<div>Open in app: {tgUrl}</div>) : null}
          </div>
        </div>
      )}

      <div className="space-y-3 border-t pt-4">
        <div className="font-medium">Login with Phone Code</div>
        <div className="flex gap-2">
          <input
            type="tel"
            placeholder="Phone number (e.g. +11234567890)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border rounded px-3 py-2 w-80"
          />
          <button onClick={startPhone} disabled={busy || !phone} className="px-3 py-2 bg-blue-600 text-white rounded">Send Code</button>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border rounded px-3 py-2 w-48"
          />
          <input
            type="password"
            placeholder="2FA Password (if required)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded px-3 py-2 w-64"
          />
          <button onClick={verify} disabled={busy || !code} className="px-3 py-2 bg-green-600 text-white rounded">Verify</button>
        </div>
      </div>
    </div>
  );
}

