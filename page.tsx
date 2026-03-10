"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { DiscordButton } from "@/components/DiscordButton";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  User,
  Clock,
  Shield,
  Wifi,
  Calendar,
  Cpu,
  Crown,
} from "lucide-react";
import { keyauth, type UserData } from "@/lib/keyauth";

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function formatTimeLeft(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));

  if (days > 0) {
    return `${days} day${days !== 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  return `${hours} hour${hours !== 1 ? "s" : ""}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = keyauth.getUserData();
    if (!user) {
      router.push("/");
      return;
    }
    setUserData(user);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    keyauth.logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="gradient-bg flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#699732] border-t-transparent" />
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  const primarySubscription = userData.subscriptions?.[0];

  return (
    <div className="gradient-bg min-h-screen px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-4">
            <Logo size={50} />
            <div>
              <h1 className="text-xl font-semibold text-white">Dashboard</h1>
              <p className="text-sm text-white/50">Welcome back, {userData.username}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleLogout} className="text-white/60">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* User Card */}
          <div className="rounded-xl bg-[#151515] p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#699732]/20">
                <User className="h-5 w-5 text-[#699732]" />
              </div>
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider">Username</p>
                <p className="text-lg font-semibold text-white">{userData.username}</p>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="rounded-xl bg-[#151515] p-6 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#699732]/20">
                <Crown className="h-5 w-5 text-[#699732]" />
              </div>
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider">Subscription</p>
                <p className="text-lg font-semibold text-white">
                  {primarySubscription?.subscription || "None"}
                </p>
              </div>
            </div>
          </div>

          {/* Time Left Card */}
          <div className="rounded-xl bg-[#151515] p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#699732]/20">
                <Clock className="h-5 w-5 text-[#699732]" />
              </div>
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wider">Time Remaining</p>
                <p className="text-lg font-semibold text-white">
                  {primarySubscription?.timeleft
                    ? formatTimeLeft(primarySubscription.timeleft)
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="rounded-xl bg-[#151515] p-6 animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#699732]" />
            Account Details
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {/* IP Address */}
            <div className="flex items-center gap-3 rounded-lg bg-[#1a1a1a] p-4">
              <Wifi className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-xs text-white/50">IP Address</p>
                <p className="text-sm font-mono text-white/80">{userData.ip || "Hidden"}</p>
              </div>
            </div>

            {/* HWID */}
            <div className="flex items-center gap-3 rounded-lg bg-[#1a1a1a] p-4">
              <Cpu className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-xs text-white/50">Hardware ID</p>
                <p className="text-sm font-mono text-white/80 truncate max-w-[200px]">
                  {userData.hwid || "Not set"}
                </p>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-center gap-3 rounded-lg bg-[#1a1a1a] p-4">
              <Calendar className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-xs text-white/50">Account Created</p>
                <p className="text-sm text-white/80">
                  {userData.createDate ? formatDate(userData.createDate) : "Unknown"}
                </p>
              </div>
            </div>

            {/* Last Login */}
            <div className="flex items-center gap-3 rounded-lg bg-[#1a1a1a] p-4">
              <Clock className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-xs text-white/50">Last Login</p>
                <p className="text-sm text-white/80">
                  {userData.lastLogin ? formatDate(userData.lastLogin) : "Now"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        {userData.subscriptions && userData.subscriptions.length > 0 && (
          <div className="mt-4 rounded-xl bg-[#151515] p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-[#699732]" />
              Active Subscriptions
            </h2>

            <div className="space-y-3">
              {userData.subscriptions.map((sub, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-[#1a1a1a] p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#699732]/20">
                      <Crown className="h-4 w-4 text-[#699732]" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{sub.subscription}</p>
                      <p className="text-xs text-white/50">
                        Expires: {formatDate(sub.expiry)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#699732]">Active</p>
                    <p className="text-xs text-white/50">
                      {formatTimeLeft(sub.timeleft)} left
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-white/30 animate-fade-in" style={{ animationDelay: "0.35s" }}>
          Powered by KeyAuth
        </div>
      </div>

      {/* Discord Button */}
      <DiscordButton />
    </div>
  );
}
