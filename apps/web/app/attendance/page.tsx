import { AppShell } from "../../components/layout/app-shell";
import { AttendanceClient } from "../../features/attendance/attendance-client";

export default function AttendancePage() {
  return (
    <AppShell>
      <AttendanceClient />
    </AppShell>
  );
}
