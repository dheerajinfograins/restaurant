"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import {
  Leaf,
  Drumstick,
  Utensils,
  Building2,
  User,
  RefreshCw,
  Save,
  Edit3
} from "lucide-react";
import axios from "axios";
import { DietaryType } from "./RestaurantRegistrationModal";

interface RestaurantItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  dietaryCategory: DietaryType;
  fssaiLicense: string | null;
  isActive: boolean;
  users: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  }>;
}

interface RestaurantEditModalProps {
  isOpen: boolean;
  restaurant: RestaurantItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface RestaurantEditFormProps {
  restaurant: RestaurantItem;
  onClose: () => void;
  onSuccess: () => void;
}

function RestaurantEditForm({
  restaurant,
  onClose,
  onSuccess,
}: Readonly<RestaurantEditFormProps>) {
  const [loading, setLoading] = useState(false);

  // Form State initialized directly from props
  const [dietaryCategory, setDietaryCategory] = useState<DietaryType>(
    restaurant.dietaryCategory || "BOTH"
  );
  const [name, setName] = useState(restaurant.name || "");
  const [email, setEmail] = useState(restaurant.email || "");
  const [phone, setPhone] = useState(restaurant.phone || "");
  const [address, setAddress] = useState(restaurant.address || "");
  const [city, setCity] = useState(restaurant.city || "");
  const [state, setState] = useState(restaurant.state || "");
  const [pincode, setPincode] = useState(restaurant.pincode || "");
  const [fssaiLicense, setFssaiLicense] = useState(restaurant.fssaiLicense || "");
  const [isActive, setIsActive] = useState(restaurant.isActive ?? true);

  // Owner State initialized directly from props
  const owner = restaurant.users?.[0];
  const [ownerName, setOwnerName] = useState(owner?.name || "");
  const [ownerEmail, setOwnerEmail] = useState(owner?.email || "");
  const [ownerPhone, setOwnerPhone] = useState(owner?.phone || "");

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error("Please enter restaurant name");
    if (!email.trim()) return toast.error("Please enter restaurant email");
    if (!phone.trim()) return toast.error("Please enter restaurant phone");
    if (!address.trim()) return toast.error("Please enter restaurant address");

    try {
      setLoading(true);
      const res = await axios.patch(`/api/super-admin/restaurants/${restaurant.id}`, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim() || null,
        state: state.trim() || null,
        pincode: pincode.trim() || null,
        dietaryCategory,
        fssaiLicense: fssaiLicense.trim() || null,
        isActive,
        ownerName: ownerName.trim() || undefined,
        ownerEmail: ownerEmail.trim() || undefined,
        ownerPhone: ownerPhone.trim() || undefined,
      });

      if (res.data.success) {
        toast.success("Restaurant updated successfully! 🎉");
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to update restaurant");
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update restaurant");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogHeader className="p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white rounded-t-3xl border-b border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/30">
              <Edit3 className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold font-cormorant text-white">
                Edit Restaurant Details
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-300">
                Update restaurant profile, dietary classification, and owner information.
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold ${isActive ? "text-emerald-400" : "text-stone-400"}`}>
              {isActive ? "Active" : "Inactive"}
            </span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Dietary Policy Switcher */}
        <div className="space-y-2">
          <Label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
            Dietary Policy & Classification
          </Label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setDietaryCategory("PURE_VEG")}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                dietaryCategory === "PURE_VEG"
                  ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                  : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              <Leaf className={`w-5 h-5 ${dietaryCategory === "PURE_VEG" ? "text-emerald-600" : "text-stone-400"}`} />
              <span className="font-bold text-xs">🌱 Pure Veg</span>
            </button>

            <button
              type="button"
              onClick={() => setDietaryCategory("PURE_NON_VEG")}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                dietaryCategory === "PURE_NON_VEG"
                  ? "bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20"
                  : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              <Drumstick className={`w-5 h-5 ${dietaryCategory === "PURE_NON_VEG" ? "text-rose-600" : "text-stone-400"}`} />
              <span className="font-bold text-xs">🍗 Pure Non-Veg</span>
            </button>

            <button
              type="button"
              onClick={() => setDietaryCategory("BOTH")}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 transition-all text-center ${
                dietaryCategory === "BOTH"
                  ? "bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20"
                  : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              <Utensils className={`w-5 h-5 ${dietaryCategory === "BOTH" ? "text-amber-600" : "text-stone-400"}`} />
              <span className="font-bold text-xs">🥗🍗 Multi-Cuisine</span>
            </button>
          </div>
        </div>

        {/* Restaurant Basic Details */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-stone-400" /> Restaurant Profile
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-stone-700">Restaurant Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border-stone-200 text-xs h-9 mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-stone-700">Official Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border-stone-200 text-xs h-9 mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-stone-700">Contact Phone *</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl border-stone-200 text-xs h-9 mt-1"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-stone-700">FSSAI License</Label>
              <Input
                value={fssaiLicense}
                onChange={(e) => setFssaiLicense(e.target.value)}
                placeholder="14-digit FSSAI Number"
                className="rounded-xl border-stone-200 text-xs h-9 mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-stone-700">Street Address *</Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="rounded-xl border-stone-200 text-xs mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-semibold text-stone-700">City</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="rounded-xl border-stone-200 text-xs h-9 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-stone-700">State</Label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="rounded-xl border-stone-200 text-xs h-9 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-stone-700">Pincode</Label>
              <Input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="rounded-xl border-stone-200 text-xs h-9 mt-1"
              />
            </div>
          </div>
        </div>

        {/* Owner Account Details */}
        <div className="space-y-3 pt-2 border-t border-stone-100">
          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-stone-400" /> Owner Account Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-semibold text-stone-700">Owner Name</Label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="rounded-xl border-stone-200 text-xs h-9 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-stone-700">Owner Email</Label>
              <Input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                className="rounded-xl border-stone-200 text-xs h-9 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-stone-700">Owner Phone</Label>
              <Input
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                className="rounded-xl border-stone-200 text-xs h-9 mt-1"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-stone-200 text-xs h-9.5 px-4"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-culinary-primary hover:bg-culinary-primary/90 text-white font-bold rounded-xl text-xs h-9.5 px-5 gap-1.5 shadow-md shadow-amber-950/10"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </>
  );
}

export default function RestaurantEditModal({
  isOpen,
  restaurant,
  onClose,
  onSuccess,
}: Readonly<RestaurantEditModalProps>) {
  if (!restaurant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-stone-200 shadow-2xl">
        <RestaurantEditForm
          key={restaurant.id}
          restaurant={restaurant}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
