import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context";
import { VITE_API_URL } from "@/config";
import { getAccessToken } from "@/storage";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import type { ChatMessage, Contact } from "@/types";
import { PageCard, PageToolbar } from "@/components";

export default function Chat() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const currentUserId = user?._id || user?.id || "";
  const isDoctor = user?.roles?.includes("doctor");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typedMessage, setTypedMessage] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 1. Fetch available connected contact index cards on initialization mount
  useEffect(() => {
    if (!currentUserId) return;
    setLoadingContacts(true);

    const lookupPath = isDoctor ? "/doctor/doctor/patients" : "/auth/me";

    window
      .fetch(`${VITE_API_URL}${lookupPath}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      })
      .then((res) => {
        if (!res.ok) throw new Error(t("chat.loadHistoryError"));
        return res.json();
      })
      .then((data: any) => {
        if (isDoctor) {
          setContacts(
            data.map((p: any) => ({
              _id: p.id || p._id || p,
              email: p.email,
              roles: ["patient"],
            })),
          );
        } else {
          if (
            data &&
            data.user &&
            data.user.connectedUsers &&
            data.user.connectedUsers.length > 0
          ) {
            const normalizedContacts = data.user.connectedUsers.map(
              (contact: any) => {
                const resolvedId =
                  typeof contact === "string"
                    ? contact
                    : contact._id || contact.id || "";

                return {
                  ...(typeof contact === "object" ? contact : {}),
                  _id: resolvedId,
                  email:
                    typeof contact === "string"
                      ? contact
                      : contact.email || contact.username || "doctor@user.com",
                  roles: contact.roles || ["doctor"],
                };
              },
            );

            setContacts(normalizedContacts.filter((c: any) => c._id !== ""));
          } else {
            setContacts([]);
          }
        }
      })
      .catch((err) => toast.error(err.message || t("chat.sidebarHeader")))
      .finally(() => setLoadingContacts(false));
  }, [currentUserId, isDoctor, t]);

  // 2. Fetch linear chronological conversation logs when a contact card profile is clicked
  useEffect(() => {
    if (!activeContact) return;
    setLoadingChat(true);

    window
      .fetch(`${VITE_API_URL}/chat/history/${activeContact._id}`, {
        headers: { Authorization: `Bearer ${getAccessToken()}` },
      })
      .then((res) => {
        if (!res.ok) throw new Error(t("chat.loadHistoryError"));
        return res.json();
      })
      .then((data) => {
        setMessages(data);
        setTimeout(
          () => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }),
          60,
        );
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoadingChat(false));
  }, [activeContact, t]);

  // 3. Dispatch a new message text string to the backend API route validation gateways
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeContact) return;

    try {
      const res = await window.fetch(`${VITE_API_URL}/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          receiverId: activeContact._id,
          text: typedMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Message dispatch anomaly.");

      setMessages((prev) => [...prev, data]);
      setTypedMessage("");
      setTimeout(
        () => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        60,
      );
    } catch (err: any) {
      toast.error(err.message || t("chat.sendError"));
    }
  };
  return (
    <PageCard size="lg">
      <PageToolbar
        title={t("chat.sidebarHeader")}
        leading={
          activeContact && (
            <span className="text-xs sm:text-sm font-semibold text-white/70 truncate max-w-48 sm:max-w-xs">
              {activeContact.email}
            </span>
          )
        }
      />

      <main className="grid grid-cols-1 md:grid-cols-3 md:h-[65vh] border border-base-content/10 rounded-2xl overflow-hidden">
        {/* LEFT COLUMN SIDEBAR: Channels Directory */}
        <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-base-content/10 p-4 flex flex-col gap-4 bg-base-content/5 max-h-60 md:max-h-none md:h-full overflow-hidden">
          <h2 className="text-xs font-black uppercase tracking-wider text-base-content/60 border-b border-base-content/10 pb-2 shrink-0 text-left">
            {t("chat.sidebarHeader")}
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loadingContacts ? (
              <div className="text-center py-8">
                <span className="loading loading-spinner text-primary loading-sm"></span>
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-xs italic text-base-content/40 text-center py-6">
                {t("chat.emptyDirectory")}
              </p>
            ) : (
              contacts.map((contact, index) => {
                const dynamicContactId = contact._id || contact.id || "";
                const uniqueKey = dynamicContactId || `contact-key-${index}`;

                const displayRoleLabel = isDoctor
                  ? t("chat.patientLabel")
                  : t("chat.doctorLabel");

                return (
                  <div
                    key={uniqueKey}
                    onClick={() => {
                      if (dynamicContactId) {
                        setActiveContact({
                          ...contact,
                          _id: dynamicContactId,
                        });
                        setTypedMessage("");
                      } else {
                        toast.error(t("chat.invalidContact"));
                      }
                    }}
                    className={`p-3 rounded-xl cursor-pointer transition-all border text-left select-none ${
                      activeContact?._id === dynamicContactId &&
                      dynamicContactId
                        ? "bg-primary/10 border-primary text-primary font-bold shadow-3xs"
                        : "bg-base-100 border-base-content/10 hover:border-primary/40"
                    }`}
                  >
                    <p className="text-xs truncate font-bold">
                      {contact.email}
                    </p>
                    <span className="text-[9px] uppercase tracking-widest text-base-content/50 font-bold block mt-0.5">
                      {displayRoleLabel}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN MAIN PANEL: Interactive Chat Window Feed */}
        <div className="md:col-span-2 flex flex-col bg-base-100 h-[60vh] md:h-full overflow-hidden text-left">
          {activeContact ? (
            <>
              {/* Header Context Title */}
              <header className="p-4 border-b border-base-content/10 bg-base-content/5 flex justify-between items-center shrink-0 select-none">
                <div className="text-left">
                  <h3 className="text-xs font-black truncate max-w-sm sm:max-w-md">
                    {activeContact.email}
                  </h3>
                  <p className="text-[9px] text-base-content/50 font-mono tracking-wider mt-0.5 uppercase">
                    {t("chat.encryptedTunnel")}
                  </p>
                </div>
              </header>

              {/* Chat Thread Messages Box View */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
                {loadingChat ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="loading loading-dots text-base-content/30"></span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMyMessage = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg._id}
                        className={`chat ${isMyMessage ? "chat-end" : "chat-start"}`}
                      >
                        <div
                          className={`chat-bubble text-xs rounded-2xl p-3 max-w-xs sm:max-w-md leading-relaxed font-medium ${
                            isMyMessage
                              ? "chat-bubble-primary text-white shadow-3xs"
                              : "bg-base-content/10 text-base-content border border-base-200/60 shadow-3xs"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <div className="chat-footer text-base-content/40 text-[9px] font-mono mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString(
                            i18n.resolvedLanguage === "de" ? "de-DE" : "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: i18n.resolvedLanguage !== "de",
                            },
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input Interactive Action Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-base-content/10 bg-base-content/5 flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder={t("chat.placeholder")}
                  className="input input-bordered input-sm rounded-xl text-xs grow bg-base-100 border-base-content/20 focus:outline-primary placeholder:text-base-content/40 placeholder:opacity-50"
                  disabled={loadingChat}
                />
                <button
                  type="submit"
                  disabled={loadingChat || !typedMessage.trim()}
                  className="btn btn-primary btn-sm rounded-xl font-bold px-5 text-xs text-white"
                >
                  {t("chat.send")}
                </button>
              </form>
            </>
          ) : (
            <div className="m-auto text-center space-y-3 text-base-content/40 select-none py-16">
              <div className="text-5xl">💬</div>
              <h3 className="font-black text-xs uppercase tracking-widest">
                {t("chat.emptyStateTitle")}
              </h3>
              <p className="text-xs max-w-xs mx-auto font-semibold leading-normal">
                {t("chat.emptyStateSubtitle")}
              </p>
            </div>
          )}
        </div>
      </main>
    </PageCard>
  );
}
