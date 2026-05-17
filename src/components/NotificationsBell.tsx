import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getNotifications } from "@/lib/api.functions";
import { useI18n } from "@/lib/i18n";

export function NotificationsBell() {
  const fn = useServerFn(getNotifications);
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fn(),
    refetchInterval: 60_000,
  });
  const [open, setOpen] = useState(false);
  const seenRef = useRef<Set<string>>(new Set());
  const { lang } = useI18n();
  const items = data?.notifications ?? [];

  // Browser push for new items
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission().catch(() => {});
    if (Notification.permission !== "granted") return;
    for (const n of items) {
      if (!seenRef.current.has(n.id)) {
        seenRef.current.add(n.id);
        try { new Notification("Netflilms", { body: n.title, icon: "/netflix-bg.jpg" }); } catch {}
      }
    }
  }, [items]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative rounded-full border p-2 text-muted-foreground hover:text-primary"
      >
        <Bell className="h-4 w-4" />
        {items.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-black text-white">
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border bg-card shadow-elegant overflow-hidden">
            <div className="border-b px-3 py-2 text-sm font-bold">
              {lang === "pt" ? "Notificações" : "Notifications"}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  {lang === "pt" ? "Sem notificações" : "No notifications"}
                </div>
              ) : items.map((n) => (
                <div key={n.id} className="border-b last:border-0 px-3 py-2">
                  <div className="text-sm font-semibold truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{n.body}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
