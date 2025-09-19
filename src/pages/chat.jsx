import React, { useState, useRef, useEffect } from "react";
import FileUploader from "../components/uploadfile";
import { ToastContainer, toast } from "react-toastify";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

const API_BASE = import.meta.env.VITE_DEV_API_URL;
const API_CHAT = API_BASE + "/chat";
const API_PDF = API_BASE + "/pdf";
const API_IDIOMS = API_BASE + "/idioms";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Gửi câu hỏi
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((msgs) => [...msgs, { role: "user", content: input }]);
    setLoading(true);

    try {
      const res = await fetch(API_CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: input,
          search_type: "hybrid",
          alpha: 0.5,
          k: 3,
          use_rerank: true,
          metadata_filter: null,
        }),
      });

      const data = await res.json();
      const cleanAnswer = (data.answer || "")
        .replace(/<think>[\s\S]*?<\/think>/, "")
        .trim();

      const sourcesList = (data.sources || [])
        .map((s) => `${s.file_name} (p.${s.page}, chunk ${s.chunk})`)
        .filter(Boolean);

      setMessages((msgs) => [
        ...msgs,
        {
          role: "bot",
          content: cleanAnswer || "No answer received.",
          source: sourcesList.join(", "),
        },
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        {
          role: "bot",
          content: "❌ Error: Unable to get response.",
          source: "",
        },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  // Upload PDF
  const handlePdfUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(API_PDF, { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(`✅ PDF uploaded! ${data.chunks} chunks created`);
    } catch (err) {
      toast.error(`❌ Upload failed: ${err.message}`);
    }
  };

  // Upload Idioms
  const handleIdiomsUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("source_name", "idioms");

    try {
      const res = await fetch(API_IDIOMS, { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(
        `✅ Idioms uploaded! ${data.docs} docs, ${data.chunks} chunks.`
      );
    } catch (err) {
      toast.error(`❌ Upload failed: ${err.message}`);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header */}
      <header className="bg-gray-600 text-white px-6 py-3 shadow flex justify-between items-center">
        <div className="flex gap-3">
          <FileUploader onUploaded={handlePdfUpload} label="Upload PDF" />
          <FileUploader onUploaded={handleIdiomsUpload} label="Upload Idioms" />
        </div>
      </header>

      {/* Chat messages */}
      <main className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            Hãy bắt đầu đặt câu hỏi...
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
                msg.role === "user"
                  ? "ml-auto bg-gray-600 text-white"
                  : "mr-auto bg-white text-gray-800 border"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {/* {msg.role === "bot" && msg.source && (
                <div className="text-xs text-gray-500 mt-2">
                  📚 <b>Sources:</b> {msg.source}
                </div>
              )} */}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input box */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-3 border-t bg-white px-4 py-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi của bạn..."
          className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base text-black"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
