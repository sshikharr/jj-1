"use client";
import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ChatBot from "@/components/ChatBot";
import ChatList from "@/components/ChatList";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import "@/app/formatted-content.css";
import { Menu, MessageCircleIcon } from "lucide-react";
import { MyContext } from "@/context/MyContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [currentTab, setCurrentTab] = useState("chat");
  const router = useRouter();
  
  // Get loading state and other context values
  const { isSidebarOpen, toggleSidebar, loading, user } = useContext(MyContext);

  // Check authentication on component mount
  useEffect(() => {
    if (!loading) {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        router.push("/login");
      }
    }
  }, [loading, router]);

  const switchTab = (tab) => {
    setCurrentTab(tab);
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="lg:w-1/5 h-full dark:bg-black bg-white">
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
          </div>
        </div>
        <div className="flex-1 h-full p-4">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  // Additional check - if not loading but no user, don't render
  if (!loading && !user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex gap-4 justify-center items-start h-screen">
      {/* Menu Button for Mobile */}
      <button
        className="lg:hidden fixed top-4 lg:left-4 left-2 z-50 p-2 rounded-md dark:bg-gray-800 bg-white dark:text-white text-black"
        onClick={toggleSidebar}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "lg:flex flex-none lg:w-1/5 h-full dark:bg-black bg-white fixed lg:static top-0 left-0 transition-transform duration-300 ease-in-out z-30",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <Sidebar />
      </div>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 dark:bg-black bg-opacity-50"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main ChatBot Section */}
      <div className="flex-1 h-full relative overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto">
          <ChatBot />
        </div>
      </div>
    </div>
  );
}