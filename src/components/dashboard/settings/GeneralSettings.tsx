"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RestaurantProfileData {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  website?: string;
}

export default function GeneralSettings({ data, refresh }: Readonly<{ data: RestaurantProfileData | null | undefined, refresh: () => void }>) {
  const [formData, setFormData] = useState({
    name: data?.name || "",
    phone: data?.phone || "",
    email: data?.email || "",
    address: data?.address || "",
    city: data?.city || "",
    state: data?.state || "",
    pincode: data?.pincode || "",
    website: data?.website || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.patch("/api/settings/profile", formData);
      toast.success("Profile updated successfully");
      refresh();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to update profile");
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-culinary-text font-cormorant">Restaurant Profile</h2>
        <p className="text-sm text-culinary-muted">Update your public restaurant information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Restaurant Name *</Label>
          <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Email Address *</Label>
          <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Phone Number *</Label>
          <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Website</Label>
          <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Full Address *</Label>
          <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>City</Label>
          <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>State</Label>
          <Input value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Pincode</Label>
          <Input value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })} />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={loading} className="bg-culinary-primary text-white hover:bg-culinary-secondary">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
