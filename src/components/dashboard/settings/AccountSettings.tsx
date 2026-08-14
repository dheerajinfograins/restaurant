"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  UserCircle, 
  KeyRound, 
  Save, 
  Eye, 
  EyeOff, 
  Mail, 
  Phone, 
  User,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AccountSettings({ refresh }: { readonly refresh: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.patch("/api/account", formData);
      toast.success("Account profile & security updated successfully!");
      setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
      refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to update account");
      } else {
        toast.error("Failed to update account");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100 shadow-sm">
            <UserCircle size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-cormorant">
              Administrator Profile & Security
            </h2>
            <p className="text-xs text-gray-500">
              Update personal administrator details and reset account login password.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Profile Card */}
        <div className="bg-gray-50/70 rounded-2xl border border-gray-200/80 p-5 space-y-4 text-xs">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <User size={15} className="text-culinary-primary" /> Administrator Profile
          </h3>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <User size={12} className="text-gray-400" /> Full Name
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Leave blank to keep existing"
                className="rounded-xl border-gray-200 text-xs py-2 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Mail size={12} className="text-gray-400" /> Email Address (Login ID)
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Leave blank to keep existing"
                className="rounded-xl border-gray-200 text-xs py-2 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-gray-50/70 rounded-2xl border border-gray-200/80 p-5 space-y-4 text-xs">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <KeyRound size={15} className="text-amber-600" /> Change Login Password
          </h3>

          <div className="space-y-3">
            <div className="space-y-1.5 relative">
              <Label className="text-xs font-bold text-gray-700">Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrentPw ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Required only to change password"
                  className="rounded-xl border-gray-200 text-xs py-2 bg-white pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <Label className="text-xs font-bold text-gray-700">New Password</Label>
              <div className="relative">
                <Input
                  type={showNewPw ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter secure new password"
                  className="rounded-xl border-gray-200 text-xs py-2 bg-white pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="pt-2">
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-xl px-6 text-xs gap-2 shadow-sm h-9"
        >
          <Save size={14} />
          {loading ? "Updating Account..." : "Save Account Settings"}
        </Button>
      </div>
    </div>
  );
}
