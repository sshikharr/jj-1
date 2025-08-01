"use client";
import { useState, useEffect, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MessageSquarePlus,
  Code,
  Settings,
  HelpCircle,
  LogOut,
  LayoutDashboardIcon,
  Mail,
  FileQuestion,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { MyContext } from "@/context/MyContext";
import { useToast } from "@/hooks/use-toast"; // Adjust the import path as needed

const plans = [
  {
    name: "Basic",
    monthly: 0,
    annually: 0,
    description: "Ideal for individuals and small businesses.",
    features: ["Basic support", "Limited access", "Essential tools"],
  },
  {
    name: "Super",
    monthly: 199,
    annually: 199,
    description: "Perfect for growing businesses and startups.",
    features: ["Priority support", "Extended access", "Advanced analytics"],
  },
  {
    name: "Advance",
    monthly: 399,
    annually: 399,
    description: "Best for enterprises requiring robust solutions.",
    features: ["24/7 support", "Full access", "Custom integrations"],
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setSelectedChat, selectedChat, setUser, setMessages } =
    useContext(MyContext);
  const { toast } = useToast();

  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [couponMessage, setCouponMessage] = useState("");
  const [billPlan, setBillPlan] = useState("monthly");
  const isMonthly = billPlan === "monthly";
  const [apiKeys, setApiKeys] = useState([]);
  // Track which keys are visible (unmasked)
  const [visibleKeys, setVisibleKeys] = useState({});
  const [processingPlan, setProcessingPlan] = useState(null);

  // Fetch API keys for the current user.
  const fetchApiKeys = async () => {
    console.log("Fetching API keys for user:", user?.userId || user?._id);
    try {
      if (!(user?.userId || user?._id)) return;
      const id = user.userId || user._id;
      const res = await axios.get(`/api/api-keys?userId=${id}`);
      console.log("Fetched API keys:", res.data.apiKeys);
      setApiKeys(res.data.apiKeys);

      // Reset visible states for keys
      const visibility = {};
      res.data.apiKeys.forEach((k) => (visibility[k.key] = false));
      setVisibleKeys(visibility);
    } catch (error) {
      console.error("Failed to fetch API keys", error);
    }
  };

  useEffect(() => {
    if (showSettings && (user?.userId || user?._id)) {
      fetchApiKeys();
    }
  }, [showSettings, user]);

  console.log("User", user)

// Helper function to update user and localStorage
const updateUserData = (updatedUser) => {
  setUser(updatedUser);
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }
};

// Newsletter Subscribe Function with localStorage update
const handleNewsletterSubscribe = async () => {
  try {
    const response = await axios.put("http://localhost:5000/api/users/subscribe-newsletter", {
      email: user?.email
    });
    
    if (response.status === 200) {
      toast({
        title: "Subscribed",
        description: "You've subscribed to the newsletter!",
      });
      
      // Update user state and localStorage
      const updatedUser = { ...user, newsLetterSubscribed: true };
      updateUserData(updatedUser);
    }
  } catch (error) {
    console.error("Newsletter subscription failed:", error);
    toast({
      title: "Error",
      description: error.response?.data?.error || "Failed to subscribe to newsletter",
      variant: "destructive",
    });
  }
};

// Newsletter Opt-out Function with localStorage update
const handleNewsletterOptOut = async () => {
  try {
    const response = await axios.put("http://localhost:5000/api/users/subscribe-newsletter", {
      email: user?.email,
      unsubscribe: true // Add this flag to handle opt-out
    });
    
    if (response.status === 200) {
      toast({
        title: "Opted Out",
        description: "You've opted out of the newsletter.",
      });
      
      // Update user state and localStorage
      const updatedUser = { ...user, newsLetterSubscribed: false };
      updateUserData(updatedUser);
    }
  } catch (error) {
    console.error("Newsletter opt-out failed:", error);
    toast({
      title: "Error",
      description: error.response?.data?.error || "Failed to opt out of newsletter",
      variant: "destructive",
    });
  }
};

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.clear();
    }
    router.push("/login");
    setUser(null);
    setMessages([]);
    setSelectedChat(null);
  };

const handleBuyNow = async (plan) => {
  setProcessingPlan(plan); // Set which plan is being processed
  setCouponMessage("");
  try {
    const response = await axios.post("/api/cashfree/initiate", {
      plan,
      coupon,
      userId: user?._id,
    });
    const { payment_link, message } = response.data;
    if (payment_link) {
      window.location.href = payment_link;
    } else {
      setCouponMessage(
        message || "Payment processed. Your plan has been updated."
      );
    }
  } catch (error) {
    console.error("Payment initiation failed", error);
    setCouponMessage(
      error.response?.data?.error ||
        "Payment initiation failed. Please try again."
    );
  }
  setProcessingPlan(null); // Reset processing state
};

  // API key management functions with toast notifications.
  const generateApiKey = async () => {
    console.log("Attempting to generate API key");
    try {
      const id = user?.userId || user?._id;
      if (!id) {
        console.error("User ID not found");
        toast({
          title: "Error",
          description: "User ID not found",
          variant: "destructive",
        });
        return;
      }
      // If on basic plan, enforce maximum of 3 active API keys.
      if (user.plan === "basic") {
        const activeCount = apiKeys.filter((k) => k.active).length;
        if (activeCount >= 3) {
          toast({
            title: "Limit Reached",
            description:
              "Maximum API keys reached for basic plan. Upgrade your plan for more.",
            variant: "destructive",
          });
          return;
        }
      }
      const res = await axios.post("/api/api-keys", {
        userId: id,
        action: "generate",
      });
      if (res.data.error) {
        toast({
          title: "Error",
          description: res.data.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "API Key generated!" });
      }
      fetchApiKeys();
    } catch (error) {
      console.error("Error generating API key", error);
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive",
      });
    }
  };

  const regenerateApiKey = async () => {
    console.log("Attempting to regenerate API key");
    try {
      const id = user?.userId || user?._id;
      if (!id) {
        console.error("User ID not found");
        toast({
          title: "Error",
          description: "User ID not found",
          variant: "destructive",
        });
        return;
      }
      const res = await axios.post("/api/api-keys", {
        userId: id,
        action: "regenerate",
      });
      if (res.data.error) {
        toast({
          title: "Error",
          description: res.data.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "API Key regenerated!" });
      }
      fetchApiKeys();
    } catch (error) {
      console.error("Error regenerating API key", error);
      toast({
        title: "Error",
        description: "Failed to regenerate API key",
        variant: "destructive",
      });
    }
  };

  const deactivateApiKey = async (key) => {
    console.log("Attempting to deactivate API key:", key);
    try {
      const id = user?.userId || user?._id;
      if (!id) return;
      const res = await axios.delete(`/api/api-keys?userId=${id}&key=${key}`);
      if (res.data.error) {
        toast({
          title: "Error",
          description: res.data.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "Success", description: "API Key deactivated" });
      }
      fetchApiKeys();
    } catch (error) {
      console.error("Error deactivating API key", error);
      toast({
        title: "Error",
        description: "Failed to deactivate API key",
        variant: "destructive",
      });
    }
  };

  // Toggle visibility (show/hide) for a given API key.
  const toggleVisibility = (key) => {
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const copyToClipboard = (key) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Copied", description: "API Key copied to clipboard!" });
  };

  const navItems = [
    {
      icon: MessageSquarePlus,
      label: "Start new chat",
      onClick: () => {
        router.push("/");
        setSelectedChat(null);
      },
      isActive: pathname === "/" && !selectedChat,
    },
    {
      icon: Code,
      label: "Developer API",
      onClick: () => router.push("/apidocs"),
      isActive: pathname === "/apidocs",
    },
    {
      icon: Settings,
      label: "Settings",
      onClick: () => setShowSettings(true),
      isActive: pathname === "/settings",
    },
    {
      icon: HelpCircle,
      label: "Updates",
      onClick: () => setShowHelp(true),
      isActive: pathname === "/updates",
    },
    {
      icon: FileQuestion,
      label: "FAQs",
      onClick: () => router.push("/faq"),
      isActive: pathname === "/faq",
    },
    ...(!user?.newsLetterSubscribed
      ? [
          {
            icon: Mail,
            label: "Subscribe to Newsletter",
            onClick: handleNewsletterSubscribe,
            isActive: false,
          },
        ]
      : []),
  ];

  return (
    <div className="flex h-screen w-[280px] flex-col border-r py-4 lg:mt-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pb-4 lg:mt-0 mt-14">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg font-bold">
          <img
            src="https://res.cloudinary.com/dc9msi1wn/image/upload/v1737221626/LOGO_1_nj85xe.png"
            alt="juristo"
            className="h-8 w-8"
          />
        </div>
        <button
          className="text-xl font-medium tracking-tight shadow-none"
          onClick={() => router.push("/")}
        >
          Juristo
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 space-y-1 px-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className={cn(
              "flex w-full items-center text-left gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors hover:bg-accent",
              item.isActive && "bg-accent text-blue-600"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
        <Link
          href="/dashboard"
          className="flex w-full items-center gap-2 rounded-lg px-0 py-2 text-[15px] font-medium transition-colors hover:bg-accent m-3"
        >
          <LayoutDashboardIcon className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Premium Section */}
      <div className="px-4 mt-auto">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-[#0A2540] to-[#144676] p-4 text-white">
            <h3 className="font-semibold">
              {user?.plan
                ? "Your Current Plan: " +
                  user.plan.charAt(0).toUpperCase() +
                  user.plan.slice(1)
                : "Upgrade Your Plan"}
            </h3>
            <p className="text-xs text-white/80">
              {user?.plan === "basic"
                ? "You are on the free Basic plan."
                : "Enjoy premium features with your plan."}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <Button
                size="sm"
                className="h-7 bg-white text-[#0A2540] hover:bg-white/90"
                onClick={() => setShowPlanDialog(true)}
              >
                {user?.plan === "basic" ? "Upgrade" : "Change Plan"}
              </Button>
            </div>
          </div>
        </Card>

        {/* User Profile & Logout */}
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 hover:opacity-80">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {user?.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {user?.name || "Guest"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
{/* Settings Dialog */}
<Dialog open={showSettings} onOpenChange={setShowSettings}>
  {/* Responsive dialog content */}
  <DialogContent className="p-4 sm:p-6 max-h-[80vh] w-[95vw] max-w-6xl space-y-4 sm:space-y-6">
    <DialogHeader>
      <DialogTitle className="text-xl sm:text-2xl font-bold">Settings</DialogTitle>
    </DialogHeader>

    <div className="space-y-4 sm:space-y-6">
      {/* API Key Management Card */}
      <Card className="p-3 sm:p-4 shadow-sm">
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">API Key Management</h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-3 sm:mb-4">
          <Button variant="outline" onClick={generateApiKey} className="w-full sm:w-auto">
            Generate API Key
          </Button>
          <Button variant="outline" onClick={regenerateApiKey} className="w-full sm:w-auto">
            Regenerate API Key
          </Button>
        </div>
        
        {/* Desktop Table - Hidden on mobile */}
        <div className="hidden md:block">
          <table className="w-full table-auto divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-black">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  API Key
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-black divide-y divide-gray-200 dark:divide-gray-700">
              {apiKeys && apiKeys.length > 0 ? (
                apiKeys.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">
                          {visibleKeys[item.key]
                            ? item.key
                            : "••••••••••••••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleVisibility(item.key)}
                          title={visibleKeys[item.key] ? "Hide" : "Show"}
                        >
                          {visibleKeys[item.key] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        {visibleKeys[item.key] && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(item.key)}
                            title="Copy"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {item.expires
                        ? new Date(item.expires).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {item.active ? (
                        <span className="text-green-600 dark:text-green-400">Active</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">Inactive</span>
                      )}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      {item.active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deactivateApiKey(item.key)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center"
                  >
                    No API Keys generated.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout - Hidden on desktop */}
        <div className="md:hidden space-y-3">
          {apiKeys && apiKeys.length > 0 ? (
            apiKeys.map((item, index) => (
              <Card key={index} className="p-3 bg-gray-50 dark:bg-gray-900">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      API Key
                    </span>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleVisibility(item.key)}
                        title={visibleKeys[item.key] ? "Hide" : "Show"}
                        className="h-8 w-8"
                      >
                        {visibleKeys[item.key] ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                      {visibleKeys[item.key] && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(item.key)}
                          title="Copy"
                          className="h-8 w-8"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">
                    {visibleKeys[item.key] ? item.key : "••••••••••••••••••••"}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Created
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Expires
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {item.expires
                          ? new Date(item.expires).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      {item.active ? (
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                    {item.active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateApiKey(item.key)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No API Keys generated.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Other Settings */}
      <div className="space-y-3 sm:space-y-4">
    
              {user?.newsLetterSubscribed && (
                <Card className="p-4 shadow-sm">
                  <h3 className="text-xl font-semibold mb-2">
                    Newsletter Subscription
                  </h3>
                  <Button variant="outline" onClick={handleNewsletterOptOut}>
                    Opt Out
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Updates</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Latest Updates</h3>
            <p className="text-sm text-muted-foreground">
              Version 2.0 is now available with improved AI capabilities.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Premium Plans Modal */}
      {/* Premium Plans Modal */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto mx-auto p-4 sm:p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-center">
              Select a Premium Plan
            </DialogTitle>
          </DialogHeader>
          
          {/* Coupon Section */}
          <div className="w-full max-w-md mx-auto space-y-3">
            <div className="space-y-2">
              <label
                htmlFor="coupon"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Coupon Code
              </label>
              <input
                type="text"
                id="coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Enter coupon code"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm 
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                         dark:focus:ring-indigo-400 dark:focus:border-indigo-400
                         transition-colors duration-200 ease-in-out
                         text-sm sm:text-base"
              />
              {couponMessage && (
                <p
                  className={`text-xs sm:text-sm font-medium ${
                    couponMessage.toLowerCase().includes("invalid") ||
                    couponMessage.toLowerCase().includes("error")
                      ? "text-red-500 dark:text-red-400"
                      : "text-green-500 dark:text-green-400"
                  }`}
                >
                  {couponMessage}
                </p>
              )}
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
            {plans.map((plan) => {
  const price = isMonthly ? plan.monthly : plan.annually;
  const isActive =
    user?.plan?.toLowerCase() === plan.name.toLowerCase();
  const isPremium = plan.name !== "Basic";
  
  // Function to get button text based on plan name
const getButtonText = (planName, userPlan) => {
  const currentPlan = userPlan?.toLowerCase();
  const targetPlan = planName.toLowerCase();
  
  if (currentPlan === targetPlan) {
    return 'Current Plan';
  }
  
  switch(targetPlan) {
    case 'basic':
      return currentPlan === 'super' || currentPlan === 'advance' ? 'Downgrade to Basic' : 'Select Basic';
    case 'super':
      if (currentPlan === 'basic') return 'Upgrade to Super';
      if (currentPlan === 'advance') return 'Downgrade to Super';
      return 'Select Super';
    case 'advance':
      return currentPlan === 'basic' || currentPlan === 'super' ? 'Upgrade to Advance' : 'Select Advance';
    default:
      return 'Select Plan';
  }
};
  
  return (
    <div
      key={plan.name}
      className={`relative flex flex-col p-4 sm:p-6 border-2 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl
        ${isActive 
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-400" 
          : isPremium 
            ? "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600" 
            : "border-gray-200 dark:border-gray-700"
        }
        ${isPremium ? "transform hover:scale-105" : ""}
        bg-white dark:bg-gray-900`}
    >
      {/* Plan Header */}
      <div className="text-center mb-4">
        <div className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 ${
          isPremium 
            ? "bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent" 
            : "text-gray-900 dark:text-gray-100"
        }`}>
          {price === 0 ? "Free" : `₹${price}`}
          <span className="text-lg sm:text-xl font-normal text-gray-500 dark:text-gray-400 ml-1">
            {price === 0 ? "" : `/${isMonthly ? "mo" : "yr"}`}
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {plan.name}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2">
          {plan.description}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>

      {/* Features List */}
      <ul className="space-y-3 flex-1 mb-6">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="flex items-start text-sm sm:text-base">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-5 h-5 text-green-500 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293A1 1 0 106.293 10.707l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="ml-3 text-gray-700 dark:text-gray-300">
              {feature}
            </span>
          </li>
        ))}
      </ul>

    {/* Action Button */}
    <div className="mt-auto">
      {isActive ? (
        <Button 
          className="w-full h-12 text-base font-semibold bg-gray-100 text-gray-500 cursor-not-allowed" 
          disabled
        >
          Current Plan
        </Button>
      ) : (
        <Button
          className={`w-full h-12 text-base font-semibold transition-all duration-300 ${
            isPremium
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
              : "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          }`}
          onClick={() => handleBuyNow(plan.name.toLowerCase())}
          disabled={processingPlan !== null} // Disable all buttons when any is processing
        >
          {processingPlan === plan.name.toLowerCase() ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          ) : (
            getButtonText(plan.name, user?.plan)
          )}
        </Button>
      )}
    </div>
    </div>
  );
})}
          </div>

          {/* Additional Info */}
          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              All plans include secure payment processing and can be cancelled anytime.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}