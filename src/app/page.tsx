
"use client";

import { useRef, useState, useEffect, type FormEvent } from "react";
import rules from "./rules.json";

type Rule = {
  intent: string;
  keywords: string[];
  reply: string;
};

type Message = {
  id: number;
  role: "bot" | "user";
  content: string;
  time: string;
};

const knowledgeBase = rules as Rule[];

const welcome =
  "Assalam-o-Alaikum! 👋\n\nWelcome to UOS Helpdesk Bot. I'm your rule-based student assistant.\n\nAsk me about admissions, fee policies, hostels, library facilities, exam procedures, university rules and student services.\n\nWhat would you like to know?";

const fallback =
  "I don't have a verified answer to that specific question in my knowledge base yet. Please ask about a particular UOS topic such as admissions, hostel allotment, fee refunds, library facilities, transcripts or examinations. You can also select one of the suggested questions.";

const initialMessages: Message[] = [
  { id: 1, role: "bot", content: welcome, time: "" },
];

const stopWords = new Set([
  "a", "an", "the", "is", "are", "was", "were", "i", "me",
  "my", "you", "your", "we", "it", "in", "on", "at", "of",
  "to", "for", "from", "with", "and", "or", "do", "does",
  "did", "can", "could", "would", "should", "what",
  "which", "when", "where", "who", "how", "tell",
  "please", "about", "know", "want", "need", "there",
  "any", "get", "give", "some", "be", "by", "this",
  "that", "u", "uos", "university", "sargodha"
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTokens(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((word) => word.length > 1 && !stopWords.has(word))
    .map((word) => {
      if (word.endsWith("ies") && word.length > 4) {
        return word.slice(0, -3) + "y";
      }
      if (word.endsWith("s") && word.length > 4 && !word.endsWith("ss")) {
        return word.slice(0, -1);
      }
      return word;
    });
}

function getBotReply(question: string): string {
  const input = normalize(question);

  if (!input) return fallback;

  // 1. Give highest priority to a complete keyword phrase.
  // 2. Otherwise calculate a keyword similarity score.
  let bestRule: Rule | null = null;
  let bestScore = 0;

  const inputTokens = new Set(getTokens(input));

  for (const rule of knowledgeBase) {
    for (const keyword of rule.keywords) {
      const phrase = normalize(keyword);
      const phraseTokens = new Set(getTokens(phrase));

      if (!phrase) continue;

      let score = 0;

      if (input === phrase) {
        score = 1000 + phrase.length;
      } else if (
        phrase.length >= 8 &&
        (` ${input} `).includes(` ${phrase} `)
      ) {
        score = 500 + phrase.length;
      } else if (phraseTokens.size > 0) {
        let common = 0;

        for (const token of phraseTokens) {
          if (inputTokens.has(token)) common++;
        }

        const precision = common / phraseTokens.size;
        const coverage =
          common / Math.max(inputTokens.size, 1);

        // Require meaningful overlap, not just one broad word.
        if (
          (common >= 2 && precision >= 0.65) ||
          (common === 1 &&
            phraseTokens.size === 1 &&
            inputTokens.size === 1)
        ) {
          score =
            precision * 60 +
            coverage * 20 +
            common * 5;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestRule = rule;
      }
    }
  }

  if (bestRule && bestScore >= 60) {
    return bestRule.reply;
  }

  return fallback;
}

function currentTime(): string {
  return new Date().toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const topics = [
  {
    icon: "🎓",
    title: "Admissions",
    desc: "Applications, entry tests and merit lists",
    question: "How to apply for admission",
  },
  {
    icon: "💳",
    title: "Fees & Refunds",
    desc: "Payment procedures and refund policies",
    question: "What is the fee refund policy",
  },
  {
    icon: "🏠",
    title: "Hostel Life",
    desc: "Accommodation, facilities and rules",
    question: "How to apply for hostel",
  },
  {
    icon: "📚",
    title: "Library",
    desc: "Books, digital resources and services",
    question: "Tell me about library facilities",
  },
  {
    icon: "📝",
    title: "Examinations",
    desc: "Results, transcripts and rechecking",
    question: "How to apply for rechecking",
  },
  {
    icon: "🏅",
    title: "Campus Life",
    desc: "Student facilities, sports and Wi-Fi",
    question: "Does campus have wifi",
  },
];

const suggestedQuestions = [
  "When do admissions open?",
  "How do I apply for admission?",
  "Can I apply with a hope certificate?",
  "What is the fee refund policy?",
  "How to apply for hostel?",
  "What is the hostel attendance time?",
  "What facilities are in the library?",
  "How do I get an English proficiency certificate?",
  "What is the dress code?",
  "How do I freeze a semester?",
];

export default function Home() {
  const [messages, setMessages] =
    useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] =
    useState<"home" | "chat">("home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showQuestions, setShowQuestions] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(2);

  useEffect(() => {
    if (activeTab === "chat") {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [messages, activeTab]);

  function openChat(question?: string) {
    setActiveTab("chat");
    setMobileMenu(false);

    if (question) {
      sendMessage(question);
    }
  }

  function sendMessage(text: string) {
    const cleaned = text.trim();
    if (!cleaned) return;

    const reply = getBotReply(cleaned);
    const time = currentTime();

    const userMessage: Message = {
      id: nextId.current++,
      role: "user",
      content: cleaned,
      time,
    };

    const botMessage: Message = {
      id: nextId.current++,
      role: "bot",
      content: reply,
      time,
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
      botMessage,
    ]);

    setInput("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage(input);
    inputRef.current?.focus();
  }

  function resetChat() {
    nextId.current = 2;
    setMessages(initialMessages);
    setInput("");
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] text-[#192F59]">
      {/* Top University Bar */}
      <div className="bg-[#192F59] px-5 py-2.5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <span className="text-[11px] font-medium tracking-wider text-white/80 sm:text-xs">
            UNIVERSITY OF SARGODHA · STUDENT HELP PLATFORM
          </span>
          <span className="hidden text-xs text-white/70 sm:block">
            Academic support made simple
          </span>
        </div>
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <button
            onClick={() => {
              setActiveTab("home");
              setMobileMenu(false);
            }}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#192F59] text-2xl text-white">
              🎓
            </div>

            <div>
              <p className="text-lg font-black leading-tight tracking-tight">
                UOS <span className="text-[#ED1C24]">CONNECT</span>
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-500">
                Smart Student Helpdesk
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            <button
              onClick={() => setActiveTab("home")}
              className={`text-sm font-semibold transition ${
                activeTab === "home"
                  ? "text-[#ED1C24]"
                  : "text-[#192F59] hover:text-[#ED1C24]"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => openChat()}
              className={`text-sm font-semibold transition ${
                activeTab === "chat"
                  ? "text-[#ED1C24]"
                  : "text-[#192F59] hover:text-[#ED1C24]"
              }`}
            >
              Helpdesk
            </button>
            <button
              onClick={() => {
                setActiveTab("home");
                setTimeout(() => {
                  document.getElementById("topics")?.scrollIntoView({
                    behavior: "smooth",
                  });
                }, 20);
              }}
              className="text-sm font-semibold hover:text-[#ED1C24]"
            >
              Explore Topics
            </button>
            <button
              onClick={() => openChat()}
              className="rounded-xl bg-[#ED1C24] px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Ask UOS Bot ↗
            </button>
          </nav>

          <button
            className="rounded-lg border border-slate-200 p-2 text-xl md:hidden"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
        </div>

        {mobileMenu && (
          <div className="space-y-2 border-t bg-white px-5 py-4 md:hidden">
            <button
              onClick={() => {
                setActiveTab("home");
                setMobileMenu(false);
              }}
              className="block w-full rounded-lg px-3 py-2 text-left font-medium"
            >
              Home
            </button>
            <button
              onClick={() => openChat()}
              className="block w-full rounded-lg bg-red-50 px-3 py-2 text-left font-semibold text-[#ED1C24]"
            >
              Open Helpdesk
            </button>
          </div>
        )}
      </header>

      {activeTab === "home" ? (
        <>
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-white">
            <div className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-red-50 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-blue-50 blur-3xl" />

            <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-bold tracking-wider text-[#D51A22]">
                  <span className="h-2 w-2 rounded-full bg-[#ED1C24]" />
                  THE SMARTER WAY TO FIND ANSWERS
                </div>

                <h1 className="max-w-2xl text-4xl font-black leading-[1.12] tracking-tight text-[#192F59] sm:text-5xl lg:text-6xl">
                  Your Campus.
                  <br />
                  Your Questions.
                  <br />
                  <span className="text-[#ED1C24]">
                    Answered.
                  </span>
                </h1>

                <p className="mt-7 max-w-xl text-base leading-8 text-slate-600">
                  Welcome to UOS Connect — a student-friendly
                  helpdesk experience inspired by the University
                  of Sargodha. Find answers about admissions,
                  hostel life, academic procedures and campus
                  facilities, all in one place.
                </p>

                <div className="mt-9 flex flex-wrap gap-3">
                  <button
                    onClick={() => openChat()}
                    className="rounded-xl bg-[#ED1C24] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-red-100 transition hover:-translate-y-0.5 hover:bg-red-700"
                  >
                    Start Asking Questions ↗
                  </button>
                  <button
                    onClick={() =>
                      document.getElementById("topics")?.scrollIntoView({
                        behavior: "smooth",
                      })
                    }
                    className="rounded-xl border-2 border-[#192F59] px-7 py-4 text-sm font-bold text-[#192F59] transition hover:bg-slate-100"
                  >
                    Explore Student Services
                  </button>
                </div>

                <div className="mt-10 flex flex-wrap items-center gap-5 text-xs font-medium text-slate-500">
                  <span>✓ Rule-based answers</span>
                  <span>✓ No account needed</span>
                  <span>✓ Instant replies</span>
                </div>
              </div>

              {/* Visual Assistant Preview */}
              <div className="relative">
                <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-100 via-white to-red-100 blur-2xl" />

                <div className="relative overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white shadow-2xl shadow-blue-950/10">
                  <div className="flex items-center justify-between bg-[#192F59] px-6 py-5 text-white">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl">
                        🎓
                      </div>
                      <div>
                        <p className="font-bold">UOS Helpdesk Bot</p>
                        <p className="mt-1 text-xs text-blue-200">
                          Rule-based Campus Assistant
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-green-400/15 px-3 py-1 text-xs text-green-200">
                      ● Ready
                    </span>
                  </div>

                  <div className="space-y-5 bg-[#F8FAFE] p-6">
                    <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700 shadow-sm">
                      Assalam-o-Alaikum! 👋
                      <br />
                      How can I help you with your university
                      questions?
                    </div>

                    <div className="ml-auto max-w-[82%] rounded-2xl rounded-tr-sm bg-[#192F59] p-4 text-sm text-white">
                      How do I apply for hostel accommodation?
                    </div>

                    <div className="max-w-[92%] rounded-2xl rounded-tl-sm border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-700 shadow-sm">
                      Complete the hostel application, get your
                      department chairperson&apos;s recommendation,
                      and submit it for merit-based allotment.
                    </div>

                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400">
                      <span className="flex-1">Ask a question...</span>
                      <span className="rounded-lg bg-[#ED1C24] px-3 py-2 text-white">
                        ➤
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openChat()}
                    className="w-full border-t bg-white px-5 py-4 text-sm font-bold text-[#ED1C24] transition hover:bg-red-50"
                  >
                    Open Interactive Chat →
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Statistics */}
          <section className="bg-[#192F59] px-5 py-8 text-white">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 md:grid-cols-4">
              {[
                ["30+", "Knowledge intents"],
                ["6", "Student topics"],
                ["24/7", "Offline rule engine"],
                ["0", "API subscriptions"],
              ].map(([number, label]) => (
                <div key={label} className="text-center">
                  <p className="text-3xl font-black">{number}</p>
                  <p className="mt-2 text-xs text-blue-200">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Topics */}
          <section id="topics" className="scroll-mt-24 px-5 py-20">
            <div className="mx-auto max-w-7xl">
              <div className="mb-10 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ED1C24]">
                  STUDENT SERVICES
                </p>
                <h2 className="mt-3 text-3xl font-black text-[#192F59] sm:text-4xl">
                  What do you need help with?
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
                  Choose a topic to ask the chatbot a relevant
                  question and receive a dedicated answer.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {topics.map((topic) => (
                  <button
                    key={topic.title}
                    onClick={() => openChat(topic.question)}
                    className="group rounded-2xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-red-200 hover:shadow-xl"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F4FA] text-2xl transition group-hover:bg-red-50">
                      {topic.icon}
                    </div>
                    <h3 className="mt-6 text-lg font-bold text-[#192F59]">
                      {topic.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {topic.desc}
                    </p>
                    <p className="mt-6 text-sm font-bold text-[#ED1C24]">
                      Ask a question →
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-5 pb-20">
            <div className="mx-auto max-w-7xl rounded-3xl bg-[#192F59] p-9 text-center text-white md:p-14">
              <h2 className="text-3xl font-black">
                Still have a question?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-blue-100">
                Ask the UOS Helpdesk Bot directly. No login,
                registration or external service required.
              </p>
              <button
                onClick={() => openChat()}
                className="mt-8 rounded-xl bg-[#ED1C24] px-8 py-4 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Launch Helpdesk Bot ↗
              </button>
            </div>
          </section>
        </>
      ) : (
        /* Chat Page */
        <section className="mx-auto max-w-7xl px-3 py-6 sm:px-5 sm:py-10">
          <div className="mb-6">
            <button
              onClick={() => setActiveTab("home")}
              className="mb-4 text-sm font-semibold text-slate-500 transition hover:text-[#ED1C24]"
            >
              ← Back to Home
            </button>
            <h1 className="text-3xl font-black text-[#192F59]">
              Student Helpdesk
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Ask questions about university services and policies.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            {/* Questions sidebar */}
            <aside className="hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:block">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-xl bg-red-50 p-3 text-xl">
                  💡
                </div>
                <div>
                  <h2 className="font-bold">Popular Questions</h2>
                  <p className="text-xs text-slate-500">
                    Tap one to get an answer
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={question}
                    onClick={() => sendMessage(question)}
                    className="flex w-full items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-left text-xs leading-5 text-slate-700 transition hover:border-red-100 hover:bg-red-50"
                  >
                    <span className="font-bold text-[#ED1C24]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {question}
                  </button>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-blue-50 p-4 text-xs leading-6 text-[#192F59]">
                <strong>About this assistant</strong>
                <p className="mt-1 text-slate-600">
                  Answers are selected from predefined
                  question-and-answer rules. This is a student
                  project, not an official university service.
                </p>
              </div>
            </aside>

            {/* Chat container */}
            <div className="flex h-[min(78vh,760px)] min-h-[510px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="flex items-center justify-between gap-3 bg-[#192F59] p-4 text-white sm:p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-xl">
                    🎓
                  </div>
                  <div>
                    <h2 className="text-sm font-bold sm:text-base">
                      UOS Helpdesk Bot
                    </h2>
                    <p className="mt-1 text-[11px] text-blue-200">
                      ● Ready to answer your questions
                    </p>
                  </div>
                </div>

                <button
                  onClick={resetChat}
                  className="rounded-lg border border-white/20 px-3 py-2 text-xs font-medium transition hover:bg-white/10"
                >
                  ↻ New Chat
                </button>
              </div>

              <div
                role="log"
                aria-live="polite"
                aria-label="Chat messages"
                className="flex-1 space-y-5 overflow-y-auto bg-[#F8FAFD] p-4 sm:p-6"
              >
                <div className="text-center text-[11px] font-medium text-slate-400">
                  YOUR UOS CONVERSATION
                </div>

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.role === "bot" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#192F59] text-sm text-white">
                        🎓
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] sm:max-w-[77%] ${
                        message.role === "user"
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      <p className="mb-1 text-[11px] font-semibold text-slate-500">
                        {message.role === "bot" ? "UOS Bot" : "You"}
                      </p>
                      <div
                        className={`rounded-2xl px-4 py-3 text-left text-sm leading-7 shadow-sm ${
                          message.role === "user"
                            ? "rounded-br-sm bg-[#192F59] text-white"
                            : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        <p className="whitespace-pre-line break-words">
                          {message.content}
                        </p>
                      </div>
                      {message.time && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          {message.time}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Suggestions */}
              <div className="border-t border-slate-100 bg-white px-4 pt-3 sm:px-5">
                <button
                  onClick={() => setShowQuestions(!showQuestions)}
                  className="mb-2 text-xs font-bold text-slate-500"
                >
                  {showQuestions
                    ? "Suggested questions −"
                    : "Suggested questions +"}
                </button>

                {showQuestions && (
                  <div className="flex gap-2 overflow-x-auto pb-3">
                    {suggestedQuestions.slice(0, 6).map((question) => (
                      <button
                        key={question}
                        onClick={() => sendMessage(question)}
                        className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-[#192F59] transition hover:border-red-200 hover:bg-red-50"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 border-t border-slate-100 bg-white p-3 sm:gap-3 sm:p-5"
              >
                <label htmlFor="chat-input" className="sr-only">
                  Ask your question
                </label>
                <input
                  ref={inputRef}
                  id="chat-input"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type your university question..."
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#192F59] focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="rounded-xl bg-[#ED1C24] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-7"
                >
                  Send ➤
                </button>
              </form>
              <p className="bg-white pb-3 text-center text-[10px] text-slate-400">
                Rule-based assistant · Responses may require policy updates
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Floating assistant button */}
      {activeTab === "home" && (
        <button
          onClick={() => openChat()}
          aria-label="Open UOS chatbot"
          className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[#ED1C24] text-2xl text-white shadow-2xl shadow-red-300 transition hover:scale-110"
        >
          💬
        </button>
      )}

      <footer className="border-t border-slate-200 bg-white px-5 py-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-slate-500 sm:flex-row">
          <p>
            <strong className="text-[#192F59]">UOS CONNECT</strong>
            {" "}— Student Helpdesk Project
          </p>
          <p>
            Independent educational project · Not an official UOS service
          </p>
        </div>
      </footer>
    </main>
  );
}
