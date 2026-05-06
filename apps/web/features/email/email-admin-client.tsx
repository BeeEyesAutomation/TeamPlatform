"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getStoredUser, hasPermission } from "../../lib/auth";
import type { EmailLog, EmailSetting, EmailTemplate } from "../../types/email";
import { fetchEmailLogs, fetchEmailSettings, fetchEmailTemplates, retryEmailLog, saveEmailSettings, sendTestEmail, updateEmailTemplate } from "./email-api";

const tabs = ["settings", "templates", "logs"] as const;

export function EmailAdminClient() {
  const user = getStoredUser();
  const canManage = hasPermission(user, "email.manage");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("settings");
  const [settings, setSettings] = useState<EmailSetting[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [settingsResponse, templatesResponse, logsResponse] = await Promise.all([
        fetchEmailSettings(),
        fetchEmailTemplates(),
        fetchEmailLogs({ pageSize: 100 })
      ]);
      setSettings(settingsResponse.data);
      setTemplates(templatesResponse.data);
      setLogs(logsResponse.data.items);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load email configuration");
    }
  }

  useEffect(() => {
    if (canManage) void load();
  }, [canManage]);

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await saveEmailSettings({
        host: form.get("host"),
        port: form.get("port"),
        username: form.get("username"),
        password: form.get("password") || undefined,
        passwordEnvVar: form.get("passwordEnvVar") || undefined,
        fromEmail: form.get("fromEmail"),
        fromName: form.get("fromName"),
        encryption: form.get("encryption"),
        isActive: form.get("isActive") === "on"
      });
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save SMTP settings");
    }
  }

  async function testEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await sendTestEmail(String(form.get("toEmail")));
      event.currentTarget.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot queue test email");
    }
  }

  async function saveTemplate(event: FormEvent<HTMLFormElement>, template: EmailTemplate) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await updateEmailTemplate(template.id, {
        subject: form.get("subject"),
        body: form.get("body"),
        isActive: form.get("isActive") === "on"
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot save template");
    }
  }

  if (!canManage) {
    return <div className="rounded-md border border-border bg-white p-5 text-sm text-muted">Ban khong co quyen cau hinh email.</div>;
  }

  return (
    <section className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-semibold">Email automation</h1>
        <p className="mt-2 text-sm text-muted">Cau hinh SMTP, mau email va nhat ky hang doi gui email.</p>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? "border-b-2 border-primary px-3 py-2 text-sm font-semibold text-primary" : "px-3 py-2 text-sm text-muted"} type="button" onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "settings" ? (
        <div className="space-y-4">
          <form className="grid gap-3 rounded-md border border-border bg-white p-4 md:grid-cols-3" onSubmit={(event) => void submitSettings(event)}>
            <input className="h-10 rounded-md border border-border px-3 text-sm" name="host" placeholder="SMTP host" required />
            <input className="h-10 rounded-md border border-border px-3 text-sm" name="port" placeholder="Port" type="number" required />
            <input className="h-10 rounded-md border border-border px-3 text-sm" name="username" placeholder="Username" required />
            <input className="h-10 rounded-md border border-border px-3 text-sm" name="password" placeholder="Password or app password" type="password" />
            <input className="h-10 rounded-md border border-border px-3 text-sm" name="passwordEnvVar" placeholder="Password env var" />
            <select className="h-10 rounded-md border border-border px-3 text-sm" name="encryption" defaultValue="starttls">
              <option value="none">none</option>
              <option value="ssl">ssl</option>
              <option value="starttls">starttls</option>
            </select>
            <input className="h-10 rounded-md border border-border px-3 text-sm" name="fromEmail" placeholder="From email" type="email" required />
            <input className="h-10 rounded-md border border-border px-3 text-sm" name="fromName" placeholder="From name" required />
            <label className="flex h-10 items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked /> Active</label>
            <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white md:w-fit" type="submit">Luu SMTP</button>
          </form>

          <form className="flex gap-2 rounded-md border border-border bg-white p-4" onSubmit={(event) => void testEmail(event)}>
            <input className="h-10 rounded-md border border-border px-3 text-sm" name="toEmail" placeholder="test@example.com" type="email" required />
            <button className="h-10 rounded-md border border-border px-4 text-sm font-medium" type="submit">Gui test qua queue</button>
          </form>

          <SimpleTable headers={["Host", "From", "Encryption", "Active"]} rows={settings.map((setting) => [setting.host, setting.fromEmail, setting.encryption, setting.isActive ? "Yes" : "No"])} />
        </div>
      ) : null}

      {activeTab === "templates" ? (
        <div className="space-y-3">
          {templates.map((template) => (
            <form key={template.id} className="grid gap-2 rounded-md border border-border bg-white p-4" onSubmit={(event) => void saveTemplate(event, template)}>
              <div className="text-sm font-semibold">{template.code}</div>
              <input className="h-10 rounded-md border border-border px-3 text-sm" name="subject" defaultValue={template.subject} />
              <textarea className="min-h-24 rounded-md border border-border p-3 text-sm" name="body" defaultValue={template.body} />
              <label className="flex items-center gap-2 text-sm"><input name="isActive" type="checkbox" defaultChecked={template.isActive} /> Active</label>
              <button className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white md:w-fit" type="submit">Luu mau</button>
            </form>
          ))}
        </div>
      ) : null}

      {activeTab === "logs" ? (
        <SimpleTable headers={["To", "Template", "Subject", "Status", "Error", "Retry"]} rows={logs.map((log) => [
          log.toEmail,
          log.templateCode ?? "-",
          log.subject,
          log.status,
          log.errorMessage ?? "-",
          log.status === "failed" ? <button key={log.id} className="text-primary" type="button" onClick={async () => { await retryEmailLog(log.id); await load(); }}>Retry</button> : "-"
        ])} />
      ) : null}
    </section>
  );
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: Array<Array<string | number | JSX.Element>> }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border bg-white">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-surface text-left text-muted"><tr>{headers.map((header) => <th key={header} className="p-3">{header}</th>)}</tr></thead>
        <tbody>{rows.map((row, index) => <tr key={index} className="border-t border-border">{row.map((cell, cellIndex) => <td key={cellIndex} className="p-3">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
