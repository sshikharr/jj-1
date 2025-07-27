// app/layout.js or app/layout.tsx
import { MyProvider } from "@/context/MyContext";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import "../app/formatted-content.css";

// ✅ This is the correct way to set title and description in App Router
export const metadata = {
  title: "Juristo – AI-Powered Legal Assistance for Every Need",
  description:
    "Get instant legal guidance with Juristo, your AI-driven legal chatbot. Whether you need advice on contracts, compliance, or personal rights, Juristo simplifies legal assistance—quick, reliable, and available 24/7.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MyProvider>
          <ThemeProvider attribute="class">
            <Toaster />
            {children}
          </ThemeProvider>
        </MyProvider>
      </body>
    </html>
  );
}
