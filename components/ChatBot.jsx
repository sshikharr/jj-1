"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Mic, Moon, Sun, ChevronDown, MessageCircleIcon } from "lucide-react";
import { format } from "date-fns";
import { MyContext } from "@/context/MyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageActions } from "@/components/message-actions";
import ChatBoxForDocs from "@/components/ChatBotForImage";
import ChatBot from "@/app/get-legal-doc/page";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { useTheme } from "next-themes";
import ChatList from "./ChatList";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import countries from "world-countries";
import * as i18nCountries from "i18n-iso-countries";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Register languages for i18n-iso-countries
i18nCountries.registerLocale(require("i18n-iso-countries/langs/en.json"));

const languageOptions = [
  { value: "en", label: "English", countryCode: "GB" },
  { value: "es", label: "Spanish", countryCode: "ES" }, 
  { value: "fr", label: "French", countryCode: "FR" },
  { value: "hi", label: "Hindi", countryCode: "IN" }, 
  { value: "zh", label: "Chinese", countryCode: "CN" },
  { value: "ar", label: "Arabic", countryCode: "SA" }, 

];

// Map country data from world-countries
const countryOptions = countries.map((country) => ({
  name: country.name.common,
  flag: `https://flagcdn.com/w40/${country.cca2.toLowerCase()}.png`,
  code: country.cca2,
}));
const defaultCountry =
  countryOptions.find((country) => country.name === "India") ||
  countryOptions[0];

export default function ChatBox() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const chatEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState("chat");
  const [showFeatures, setShowFeatures] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [copied, setCopied] = useState(false);
  const [isChatListOpen, setIsChatListOpen] = useState(false);

  const {
    user,
    loading: contextLoading,
    selectedChat,
    selectedLanguage,
    fetchChats,
    setSelectedChat,
    setSelectedLanguage,
  } = useContext(MyContext);

  useEffect(() => {
    if (!contextLoading && !user) {
      router.push("/login");
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [contextLoading, user, router]);

  useEffect(() => {
    if (selectedChat && Array.isArray(selectedChat.messages)) {
      const filteredMessages = selectedChat.messages
        .filter(
          (msg) => !msg.content.startsWith("You are a Legal AI Assistant")
        )
        .map((msg) => ({
          ...msg,
          timestamp: new Date(),
        }));
      setMessages(filteredMessages);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;
    setLoading(true);
    setShowFeatures(false);

    const newMessage = {
      userId: user._id,
      message: input,
      newChat: !selectedChat,
      chatId: selectedChat?.chatId,
      country: selectedCountry.name,
      language:
        selectedLanguage.label ||
        (user.language && user.language.label) ||
        "English",
    };

    try {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: input, timestamp: new Date() },
        {
          role: "assistant",
          content: "",
          timestamp: new Date(),
          loading: true,
        },
      ]);
      setInput("");

      const response = await fetch(
        "http://localhost:5000/api/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMessage),
        }
      );

      const responseData = await response.json();
      if (responseData && responseData.response) {
        const aiResponse = responseData.response
          .replace(
            /^You are a Legal AI Assistant named Juristo[\s\S]*?(?=\n\n|$)/,
            ""
          )
          .trim();

        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1
              ? {
                  role: "assistant",
                  content: aiResponse,
                  timestamp: new Date(),
                }
              : msg
          )
        );
      }

      if (responseData) {
        setSelectedChat(responseData.chat);
      }

      setLoading(false);
      fetchChats(user);
    } catch (error) {
      console.error("Error sending message:", error);
      setLoading(false);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateResponse = async (userQuery, assistantMessageIndex) => {
    if (!user) return;
    setLoading(true);

    setMessages((prev) =>
      prev.map((msg, index) =>
        index === assistantMessageIndex
          ? { ...msg, content: "", loading: true, timestamp: new Date() }
          : msg
      )
    );

    const newMessage = {
      userId: user._id,
      message: userQuery,
      newChat: false,
      chatId: selectedChat?.chatId,
      country: selectedCountry.name,
      language:
        selectedLanguage.label ||
        (user.language && user.language.label) ||
        "English",
    };

    try {
      const response = await fetch(
        "http://localhost:5000/api/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newMessage),
        }
      );

      const responseData = await response.json();

      if (responseData && responseData.response) {
        const aiResponse = responseData.response
          .replace(/^You are a Legal AI Assistant[\s\S]*?(?=\n\n|$)/, "")
          .trim();

        setMessages((prev) =>
          prev.map((msg, index) =>
            index === assistantMessageIndex
              ? {
                  role: "assistant",
                  content: aiResponse,
                  timestamp: new Date(),
                  loading: false,
                }
              : msg
          )
        );
      }

      setLoading(false);
      fetchChats(user);
    } catch (error) {
      console.error("Error generating response:", error);
      setLoading(false);
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === assistantMessageIndex ? { ...msg, loading: false } : msg
        )
      );
    }
  };

  const handleToggleAudio = (index) => {
    const msg = messages[index];
    if (!msg || !msg.content) return;

    // Stop any current speech
    speechSynthesis.cancel();

    // Toggle mute state
    if (msg.isSpeaking) {
      setMessages((prev) =>
        prev.map((m, i) => (i === index ? { ...m, isSpeaking: false } : m))
      );
    } else {
      const utterance = new SpeechSynthesisUtterance(msg.content);
      utterance.lang = selectedLanguage.value || "en-US";
      utterance.onend = () => {
        setMessages((prev) =>
          prev.map((m, i) => (i === index ? { ...m, isSpeaking: false } : m))
        );
      };
      speechSynthesis.speak(utterance);
      setMessages((prev) =>
        prev.map((m, i) => (i === index ? { ...m, isSpeaking: true } : m))
      );
    }
  };

  const features = [
    {
      title: "Research Assistance",
      description: "Get help in researching legal cases",
      onClick: () => setCurrentTab("chat"),
    },
    {
      title: "Case Prediction",
      description: "Use AI to predict case outcomes",
      onClick: () => setCurrentTab("analysis"),
    },
    {
      title: "Document Drafting",
      description: "Draft legal documents with AI assistance",
      onClick: () => setCurrentTab("drafting"),
    },
  ];

  const toggleChatList = () => {
    setIsChatListOpen(!isChatListOpen);
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <div className="sticky top-0 border-b p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div />
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 border rounded-md shadow-sm">
                    <img
                      src={selectedCountry.flag}
                      alt={`${selectedCountry.name} flag`}
                      width={20}
                      height={15}
                      className="rounded-sm"
                    />
                    <span className="text-sm font-medium">
                      {selectedCountry.name}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-60 overflow-y-auto border rounded-md shadow-lg">
                  {countryOptions.map((country) => (
                    <DropdownMenuItem
                      key={country.name}
                      onSelect={() => setSelectedCountry(country)}
                      className="flex items-center gap-2 px-4 py-2 cursor-pointer"
                    >
                      <img
                        src={country.flag}
                        alt={`${country.name} flag`}
                        width={20}
                        height={15}
                        className="rounded-sm"
                      />
                      <span>{country.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 border rounded-md shadow-sm">
                    <img
                      src={`https://flagcdn.com/w40/${(selectedLanguage.countryCode || "GB").toLowerCase()}.png`}
                      alt={`${selectedLanguage.label || "English"} flag`}
                      width={20}
                      height={15}
                      className="rounded-sm"
                    />
                    <span className="text-sm font-medium">
                      {selectedLanguage.label || "English"}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-60 overflow-y-auto border rounded-md shadow-lg">
                  {languageOptions.map((language) => (
                    <DropdownMenuItem
                      key={language.value}
                      onSelect={() => setSelectedLanguage(language)}
                      className="flex items-center gap-2 px-4 py-2 cursor-pointer"
                    >
                      <img
                        src={`https://flagcdn.com/w40/${language.countryCode.toLowerCase()}.png`}
                        alt={`${language.label} flag`}
                        width={20}
                        height={15}
                        className="rounded-sm"
                      />
                      <span>{language.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div />
          </div>
        </div>

        <ScrollArea className="flex-1 scroll-area">
          <div className="p-4">
            <div className="p-4 flex justify-center">
              <Tabs
                value={currentTab}
                className="w-full max-w-2xl justify-center items-center flex"
                onValueChange={(value) => setCurrentTab(value)}
              >
                <TabsList className="bg-gray-100 p-1 rounded-full mx-auto">
                  <TabsTrigger
                    value="chat"
                    className="rounded-full px-4 py-1 text-xs data-[state=active]:bg-[#0A0F1C] data-[state=active]:text-white"
                  >
                    Research Assistant
                  </TabsTrigger>
                  <TabsTrigger
                    value="analysis"
                    className="rounded-full px-4 py-1 text-xs data-[state=active]:bg-[#0A0F1C] data-[state=active]:text-white"
                  >
                    Case Prediction
                  </TabsTrigger>
                  <TabsTrigger
                    value="drafting"
                    className="rounded-full px-4 py-1 text-xs data-[state=active]:bg-[#0A0F1C] data-[state=active]:text-white"
                  >
                    Drafting
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="mt-8">
              {showFeatures && (
                <>
                  <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold">
                      How can we <span className="text-blue-600">assist</span>{" "}
                      you today?
                    </h1>
                    <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                      Empower law students and professionals with real-time
                      learning. Simplify complex cases and stay updated with
                      AI-generated summaries.
                    </p>
                  </div>

                  <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 ">
                    {features.map((feature) => (
                      <Card
                        key={feature.title}
                        className="group cursor-pointer hover:shadow-lg transition-all duration-300"
                        onClick={feature.onClick}
                      >
                        <CardContent className="p-4">
                          <h3 className="text-base font-semibold mb-2">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-gray-500 mb-4">
                            {feature.description}
                          </p>
                          <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors transform group-hover:-translate-y-1 group-hover:translate-x-1" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {currentTab === "analysis" && <ChatBoxForDocs />}
              {currentTab === "drafting" && <ChatBot />}
              {currentTab === "chat" && (
                <div className="space-y-6">
                  {messages.map((msg, index) => (
                    <div key={index} className="space-y-4">
                      {index === 0 && (
                        <div className="text-center text-sm text-gray-500">
                          Today
                        </div>
                      )}
                      <div
                        className={`flex ${
                          msg.role === "user" ? "justify-end" : "justify-start"
                        } gap-3`}
                      >
                        {msg.role === "assistant" && (
                          <Avatar className="w-7 h-7">
                            <AvatarFallback>J</AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex flex-col gap-2 max-w-[80%]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">
                              {msg.role === "user" ? "You" : "Response"}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {format(msg.timestamp, "dd MMM • h:mm a")}
                            </span>
                          </div>
                          {msg.loading ? (
                            <div className="px-3 py-1.5 rounded-lg text-xs">
                              <Skeleton className="w-[200px] h-[12px]" />
                              <Skeleton className="w-[150px] h-[12px] mt-1" />
                              <Skeleton className="w-[100px] h-[12px] mt-1" />
                            </div>
                          ) : (
                            <div
                              className={`px-3 py-1.5 rounded-lg text-xs text-white ${
                                msg.role === "user"
                                  ? "bg-gradient-to-br from-[#0A2540] to-[#144676] p-4"
                                  : "bg-gray-100 p-4"
                              }`}
                            >
                              {msg.role === "user" ? (
                                msg.content
                              ) : (
                                <ReactMarkdown
                                  className="formatted-content prose prose-sm max-w-none text-black"
                                  remarkPlugins={[remarkGfm]}
                                >
                                  {msg.content}
                                </ReactMarkdown>
                              )}
                            </div>
                          )}
                          {msg.role === "assistant" && !msg.loading && (
                            <MessageActions
                              onCopy={() => handleCopy(msg.content)}
                              onGenerateResponse={() =>
                                handleGenerateResponse(
                                  messages[index - 1].content,
                                  index
                                )
                              }
                              onToggleAudio={() => handleToggleAudio(index)}
                              content={msg.content}
                            />
                          )}
                        </div>
                        {msg.role === "user" && (
                          <Avatar className="w-7 h-7">
                            <AvatarImage src="/placeholder.svg" />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {currentTab === "chat" && (
          <div className="p-4 border-t">
            <div className="max-w-4xl mx-auto flex gap-4">
              <div className="flex-1 flex items-center gap-2 rounded-lg border p-2">
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask questions for your legal help"
                  className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button variant="ghost" size="icon">
                  <Mic className="h-5 w-5 text-gray-400" />
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={loading}
                  className="bg-gradient-to-br from-[#0A2540] to-[#144676] p-4 text-white hover:bg-blue-700"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <button
        className="lg:hidden fixed top-4 lg:right-4 right-2 z-50 p-2 rounded-md dark:bg-gray-800 bg-white dark:text-white text-black"
        onClick={toggleChatList}
      >
        <MessageCircleIcon size={24} />
      </button>
      {/* Chat List */}
      <div
        className={cn(
          "lg:flex flex-none lg:w-72 h-full overflow-y-auto bg-black fixed lg:static top-0 right-0 transition-transform duration-300 ease-in-out z-30",
          isChatListOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
      >
        <ChatList currentTab={currentTab} />
      </div>
    </div>
  );
}