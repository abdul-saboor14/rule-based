
"use client";

import { useState, type FormEvent } from "react";
import rules from "./rules.json";

type Rule = {
  intent: string;
  keywords: string[];
  reply: string;
};

type Message = {
  id: number;
  sender: "user" | "bot";
  text: string;
  time: string;
};

const chatbotRules = rules as Rule[];

const welcomeMessage =
  "Assalam-o-Alaikum! Welcome to UOS Helpdesk Bot 🎓\n\nI'm here to help you with University of Sargodha inquiries. You can ask me about:\n\n💰 Fee information\n📚 Admissions\n🕒 University timings\n📖 Library services\n🏠 Hostel facilities\n\nHow can I help you today?";

const fallbackMessage =
  "I'm sorry, I couldn't find an answer to that question. Please try asking about fees, admissions, university timings, library services, or hostel facilities. For official and up-to-date information, please contact the relevant University of Sargodha office.";

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, " ");
}


function getBotReply(message: string): string {
  const normalizedMessage = message
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  const matches = chatbotRules
    .flatMap((rule) =>
      rule.keywords
        .map((keyword) => ({
          rule,
          keyword: keyword
            .toLowerCase()
            .trim()
            .replace(/\s+/g, " "),
        }))
        .filter(({ keyword }) =>
          normalizedMessage.includes(keyword)
        )
    )
    .sort((a, b) => b.keyword.length - a.keyword.length);

  if (matches.length > 0) {
    return matches[0].rule.reply;
  }

  return fallbackMessage;
}


function getCurrentTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: welcomeMessage,
      time: getCurrentTime(),
    },
  ]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const userText = input.trim();

    if (!userText) return;

    const now = getCurrentTime();
    const reply = getBotReply(userText);
    const baseId = Date.now();

    const userMessage: Message = {
      id: baseId,
      sender: "user",
      text: userText,
      time: now,
    };

    const botMessage: Message = {
      id: baseId + 1,
      sender: "bot",
      text: reply,
      time: now,
    };

    setMessages((previousMessages) => [
      ...previousMessages,
      userMessage,
      botMessage,
    ]);

    setInput("");
  }

  function clearChat() {
    setMessages([
      {
        id: Date.now(),
        sender: "bot",
        text: welcomeMessage,
        time: getCurrentTime(),
      },
    ]);

    setInput("");
  }

  const suggestions = [
    { icon: "💰", label: "Fee information", question: "Tell me about university fees" },
    { icon: "📚", label: "Admissions", question: "How can I apply for admission?" },
    { icon: "🕒", label: "Timings", question: "What are the university timings?" },
    { icon: "📖", label: "Library", question: "Tell me about library services" },
    { icon: "🏠", label: "Hostel", question: "How can I apply for a hostel?" },
  ];

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl sm:min-h-[calc(100vh-4rem)]">
        {/* Header */}
        <header className="flex items-center justify-between gap-3 bg-gradient-to-r from-emerald-800 to-teal-700 px-4 py-4 text-white sm:px-7 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-2xl">
              🎓
            </div>

            <div className="min-w-0">
              <h1 className="text-lg font-bold tracking-tight sm:text-2xl">
                UOS Helpdesk Bot
              </h1>
              <div className="mt-1 flex items-center gap-2 text-xs text-emerald-100 sm:text-sm">
                <span className="h-2 w-2 rounded-full bg-green-300" />
                University of Sargodha · Rule-based assistant
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={clearChat}
            className="shrink-0 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white sm:text-sm"
            aria-label="Clear chat and restart conversation"
          >
            ↻ <span className="hidden sm:inline">New chat</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </header>

        {/* Chat messages */}
        <section
          aria-label="Chat conversation"
          aria-live="polite"
          className="flex-1 space-y-5 overflow-y-auto bg-slate-50 px-3 py-5 sm:px-7 sm:py-7"
        >
          <div className="mb-6 text-center">
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm">
              Your university information assistant
            </span>
          </div>

          {messages.map((message) => {
            const isUser = message.sender === "user";

            return (
              <div
                key={message.id}
                className={`flex items-end gap-2 sm:gap-3 ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {!isUser && (
                  <div
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg"
                  >
                    🎓
                  </div>
                )}

                <div
                  className={`flex max-w-[88%] flex-col sm:max-w-[75%] ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  <span className="mb-1.5 px-1 text-xs font-semibold text-slate-500">
                    {isUser ? "You" : "UOS Helpdesk Bot"}
                  </span>

                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm sm:px-5 ${
                      isUser
                        ? "rounded-br-sm bg-emerald-700 text-white"
                        : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <p className="whitespace-pre-line break-words">
                      {message.text}
                    </p>
                  </div>

                  <span className="mt-1.5 px-1 text-[11px] text-slate-400">
                    {message.time}
                  </span>
                </div>

                {isUser && (
                  <div
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-sm font-bold text-slate-600"
                  >
                    You
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Suggested questions */}
        <div className="border-t border-slate-200 bg-white px-3 pb-3 pt-4 sm:px-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Quick questions
          </p>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.label}
                type="button"
                onClick={() => {
                  const form = document.getElementById(
                    "chat-form"
                  ) as HTMLFormElement | null;

                  setInput(suggestion.question);

                  // Submit using the same rule-based message handler.
                  if (form) {
                    const data = new FormData(form);
                    data.set("message", suggestion.question);

                    const event = {
                      preventDefault: () => {},
                    } as FormEvent<HTMLFormElement>;

                    setMessages((previousMessages) => {
                      const now = getCurrentTime();
                      const baseId = Date.now();

                      return [
                        ...previousMessages,
                        {
                          id: baseId,
                          sender: "user",
                          text: suggestion.question,
                          time: now,
                        },
                        {
                          id: baseId + 1,
                          sender: "bot",
                          text: getBotReply(suggestion.question),
                          time: now,
                        },
                      ];
                    });

                    setInput("");
                  }
                }}
                className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm"
              >
                {suggestion.icon} {suggestion.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message input */}
        <footer className="border-t border-slate-200 bg-white p-3 sm:px-7 sm:py-5">
          <form
            id="chat-form"
            onSubmit={handleSubmit}
            className="flex items-center gap-2 sm:gap-3"
          >
            <label htmlFor="message-input" className="sr-only">
              Type your question
            </label>

            <input
              id="message-input"
              name="message"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about fees, admissions, library..."
              autoComplete="off"
              className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-100"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-40 sm:px-6"
            >
              <span>Send</span>
              <span aria-hidden="true">➤</span>
            </button>
          </form>

          <p className="mt-3 text-center text-[11px] text-slate-400 sm:text-xs">
            UOS Helpdesk Bot · Rule-based responses · No API required
          </p>
        </footer>
      </div>
    </main>
  );
}
