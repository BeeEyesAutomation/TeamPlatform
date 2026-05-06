export type EmailEncryption = "none" | "ssl" | "starttls";
export type EmailLogStatus = "pending" | "sent" | "failed" | "retrying";

export interface EmailSetting {
  id: string;
  host: string;
  port: number;
  username: string;
  passwordEncrypted: string;
  fromEmail: string;
  fromName: string;
  encryption: EmailEncryption;
  isActive: boolean;
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  code: string;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
}

export interface EmailLog {
  id: string;
  toEmail: string;
  subject: string;
  templateCode?: string | null;
  status: EmailLogStatus;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export interface EmailLogListResponse {
  items: EmailLog[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
