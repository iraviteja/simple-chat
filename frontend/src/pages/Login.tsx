import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { MessageSquare } from "lucide-react";
import type { AxiosError } from "axios";

const Login = () => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { joinChat } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await joinChat(name);
      navigate("/chat");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      setError(error.response?.data?.message || "Failed to join chat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700 flex relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full backdrop-blur-sm animate-bounce"
          style={{ animationDelay: "-2s", animationDuration: "6s" }}
        />
        <div
          className="absolute top-60 right-20 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm animate-bounce"
          style={{ animationDelay: "-4s", animationDuration: "6s" }}
        />
        <div
          className="absolute bottom-20 left-20 w-10 h-10 bg-white/10 rounded-full backdrop-blur-sm animate-bounce"
          style={{ animationDelay: "-1s", animationDuration: "6s" }}
        />
      </div>

      {/* Left Side - Project Showcase */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 relative z-10 bg-white/5 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex items-center mb-10 animate-fade-in-left">
          <div className="relative w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mr-4 overflow-hidden group shadow-xl">
            <MessageSquare className="w-8 h-8 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </div>
          <h1 className="text-4xl font-bold text-white drop-shadow-lg">
            SimpleChat
          </h1>
        </div>

        {/* Hero Content */}
        <div
          className="text-center animate-fade-in-left max-w-lg"
          style={{ animationDelay: "0.2s" }}
        >
          <h2 className="text-5xl font-extrabold text-white mb-6 leading-tight drop-shadow-xl">
            Connect & Communicate
          </h2>
          <p className="text-xl text-white/80 mb-10 leading-relaxed">
            Experience seamless conversations with our next-generation chat
            platform
          </p>

          {/* Feature List */}
          <div className="flex flex-col gap-4 items-start">
            {[
              { icon: "🚀", text: "Real-time messaging" },
              { icon: "👥", text: "Group conversations" },
              { icon: "📎", text: "File sharing made easy" },
              { icon: "🌐", text: "Simple and fast" },
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center text-white/90 px-5 py-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 transition-all duration-300 hover:bg-white/15 hover:translate-x-2 cursor-pointer animate-fade-in-left"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                <span className="text-lg mr-3">{feature.icon}</span>
                <span className="font-medium">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Join Form */}
      <div className="flex-1 bg-white/95 backdrop-blur-sm flex items-center justify-center p-8 lg:p-16 relative z-10">
        <div className="w-full max-w-md animate-fade-in-right">
          {/* Join Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">
              Join SimpleChat
            </h2>
            <p className="text-gray-600">Enter your name to start chatting</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm animate-shake">
              {error}
            </div>
          )}

          {/* Join Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl text-base bg-white transition-all duration-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none placeholder-gray-400"
                required
                minLength={2}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/25 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? "Joining..." : "Join Chat"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
