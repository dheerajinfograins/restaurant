"use client";

import { useEffect, useState } from "react";
import { useForm, Resolver, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";
import { Loader2, UploadCloud, X } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { IProduct } from "@/modules/product/types";
import { ICategory } from "@/modules/category/types";
import { createProductSchema } from "@/modules/product/validation";

// We'll use the schema to infer types for the form
type FormValues = z.infer<typeof createProductSchema>;

interface ProductFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly product: IProduct | null;
  readonly onSuccess: () => void;
  readonly categories: ICategory[];
}

const processImageFile = (
  file: File,
  onSuccess: (base64: string) => void
) => {
  if (!file.type.startsWith("image/")) {
    toast.error("Please upload an image file");
    return;
  }
  // Limit to 2MB since it's converted to base64
  if (file.size > 2 * 1024 * 1024) {
    toast.error("Image must be less than 2MB");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    if (event.target?.result) {
      onSuccess(event.target.result as string);
    }
  };
  reader.readAsDataURL(file);
};

async function submitProductForm(
  data: FormValues,
  isEditing: boolean,
  productId: string | undefined,
  setIsLoading: (loading: boolean) => void,
  onSuccess: () => void,
  onClose: () => void
) {
  setIsLoading(true);
  try {
    if (isEditing) {
      await axios.put(`/api/products/${productId}`, data);
      toast.success("Product updated successfully");
    } else {
      await axios.post("/api/products", data);
      toast.success("Product created successfully");
    }
    onSuccess();
    onClose();
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      toast.error(
        error.response?.data?.message || "An error occurred. Please try again."
      );
    } else {
      toast.error("An error occurred. Please try again.");
    }
  } finally {
    setIsLoading(false);
  }
}

const getDefaultFormValues = (product: IProduct | null): FormValues => {
  if (!product) {
    return {
      name: "",
      categoryId: "",
      description: "",
      price: 0,
      discount: 0,
      image: "",
      foodType: "VEG",
      isAvailable: true,
      isFeatured: false,
      preparationTime: 0,
    };
  }

  return {
    name: product.name,
    categoryId: product.categoryId,
    description: product.description || "",
    price: product.price,
    discount: product.discount,
    image: product.image || "",
    foodType: product.foodType,
    isAvailable: product.isAvailable,
    isFeatured: product.isFeatured,
    preparationTime: product.preparationTime || 0,
  };
};

export function ProductFormModal({
  isOpen,
  onClose,
  product,
  onSuccess,
  categories,
}: ProductFormModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevProductId, setPrevProductId] = useState(product?.id);
  const isEditing = !!product;

  if (isOpen !== prevIsOpen || product?.id !== prevProductId) {
    setPrevIsOpen(isOpen);
    setPrevProductId(product?.id);
    if (isOpen) {
      const hasExternalImage = Boolean(product?.image && !product.image.startsWith("data:image"));
      setShowUrlInput(hasExternalImage);
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(createProductSchema) as unknown as Resolver<FormValues>,
    defaultValues: getDefaultFormValues(product),
  });

  // Reset form when modal opens or selected product changes
  useEffect(() => {
    if (isOpen) {
      form.reset(getDefaultFormValues(product));
    }
  }, [isOpen, product, form]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleImageSelect = (file?: File) => {
    if (!file) return;
    processImageFile(file, (base64) => {
      form.setValue("image", base64);
      setShowUrlInput(false);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleImageSelect(e.dataTransfer.files?.[0]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageSelect(e.target.files?.[0]);
  };

  const onSubmit = (data: FormValues) => {
    submitProductForm(data, isEditing, product?.id, setIsLoading, onSuccess, onClose);
  };

  const currentImage = useWatch({ control: form.control, name: "image" });
  const descriptionValue = useWatch({ control: form.control, name: "description" }) || "";
  const categoryIdValue = useWatch({ control: form.control, name: "categoryId" });
  const foodTypeValue = useWatch({ control: form.control, name: "foodType" });
  const isAvailableValue = useWatch({ control: form.control, name: "isAvailable" });
  const isFeaturedValue = useWatch({ control: form.control, name: "isFeatured" });

  const modalLabels = isEditing
    ? { title: "Edit Product", button: "Update Product", loading: "Updating..." }
    : { title: "Add New Product", button: "Create Product", loading: "Creating..." };

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="sm:max-w-xl w-[95vw] overflow-y-auto bg-culinary-background border-l border-culinary-border/50 shadow-2xl p-0">
        <div className="p-6 border-b border-culinary-border/50 bg-white sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle className="font-cormorant text-3xl text-culinary-text font-bold">
              {modalLabels.title}
            </SheetTitle>
          </SheetHeader>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-8">
          <div className="space-y-6">

            {/* Image Upload Area */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-culinary-text">Product Image</Label>
              {!showUrlInput ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${currentImage ? 'border-culinary-primary/30 bg-white' : 'border-culinary-border hover:border-culinary-primary/50 hover:bg-white'} group relative overflow-hidden`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <button
                    type="button"
                    className="absolute inset-0 w-full h-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-culinary-primary focus-visible:ring-inset bg-transparent border-none z-0"
                    onClick={() => document.getElementById('product-image-upload')?.click()}
                    aria-label="Upload product image"
                  />
                  {currentImage ? (
                    <div className="relative w-full aspect-video flex items-center justify-center pointer-events-none">
                      <Image src={currentImage} alt="Preview" width={400} height={192} className="max-h-48 w-auto object-contain rounded-md shadow-sm" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-md text-white">
                        <UploadCloud size={24} className="mb-2" />
                        <span className="text-sm font-medium">Click or Drop to Replace</span>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          form.setValue("image", "");
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 pointer-events-none">
                      <div className="w-12 h-12 bg-culinary-background rounded-full flex items-center justify-center mx-auto mb-3 text-culinary-muted group-hover:text-culinary-primary group-hover:bg-culinary-primary/10 transition-colors">
                        <UploadCloud size={24} />
                      </div>
                      <p className="text-sm font-medium text-culinary-text">Click or drag image here</p>
                      <p className="text-xs text-culinary-muted mt-1">JPEG, PNG, WEBP (Max 2MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    id="product-image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileInput}
                  />
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    {...form.register("image")}
                    className="bg-white border-culinary-border focus:ring-culinary-primary/20 transition-all shadow-sm pr-10"
                  />
                  {currentImage && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded bg-gray-100 overflow-hidden shadow-sm border border-gray-200">
                      <Image src={currentImage} alt="preview" width={24} height={24} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-culinary-primary hover:underline font-medium"
                >
                  {showUrlInput ? "Upload Image File Instead" : "Or enter Image URL instead"}
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-culinary-text">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Margherita Pizza"
                  {...form.register("name")}
                  className="bg-white border-culinary-border focus:ring-culinary-primary/20 shadow-sm"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500 font-medium">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId" className="text-sm font-semibold text-culinary-text">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={categoryIdValue}
                  onValueChange={(value) => form.setValue("categoryId", value || "")}
                >
                  <SelectTrigger className="bg-white border-culinary-border focus:ring-culinary-primary/20 shadow-sm">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                    {categories.length === 0 && (
                      <div className="p-2 text-sm text-center text-culinary-muted">No categories available</div>
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.categoryId && (
                  <p className="text-sm text-red-500 font-medium">{form.formState.errors.categoryId.message}</p>
                )}
              </div>
            </div>

            {/* Pricing Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-semibold text-culinary-text">
                  Price (₹) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 299"
                  {...form.register("price")}
                  className="bg-white border-culinary-border focus:ring-culinary-primary/20 shadow-sm"
                />
                {form.formState.errors.price && (
                  <p className="text-sm text-red-500 font-medium">{form.formState.errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount" className="text-sm font-semibold text-culinary-text">
                  Discount (%)
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="e.g. 10"
                  {...form.register("discount")}
                  className="bg-white border-culinary-border focus:ring-culinary-primary/20 shadow-sm"
                />
              </div>
            </div>

            {/* Attributes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="foodType" className="text-sm font-semibold text-culinary-text">Food Type</Label>
                <Select
                  value={foodTypeValue}
                  onValueChange={(value) => {
                    if (value) form.setValue("foodType", value as "VEG" | "NON_VEG" | "EGG");
                  }}
                >
                  <SelectTrigger className="bg-white border-culinary-border shadow-sm">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VEG">Vegetarian</SelectItem>
                    <SelectItem value="NON_VEG">Non-Vegetarian</SelectItem>
                    <SelectItem value="EGG">Contains Egg</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preparationTime" className="text-sm font-semibold text-culinary-text">
                  Prep Time (mins)
                </Label>
                <Input
                  id="preparationTime"
                  type="number"
                  min="0"
                  placeholder="e.g. 15"
                  {...form.register("preparationTime")}
                  className="bg-white border-culinary-border shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="description" className="text-sm font-semibold text-culinary-text">Description</Label>
                <span className="text-xs text-culinary-muted">{descriptionValue.length} / 500 characters</span>
              </div>
              <Textarea
                id="description"
                placeholder="Delicious hand-tossed pizza with fresh mozzarella..."
                {...form.register("description")}
                className="resize-none h-24 bg-white border-culinary-border focus:ring-culinary-primary/20 shadow-sm"
                maxLength={500}
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white p-4 rounded-xl border border-culinary-border/50 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold text-culinary-text">Availability</Label>
                  <p className="text-xs text-culinary-muted">Show this item on the menu</p>
                </div>
                <Switch
                  checked={isAvailableValue}
                  onCheckedChange={(checked) => form.setValue("isAvailable", checked)}
                  className="data-[state=checked]:bg-culinary-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold text-culinary-text">Featured Item</Label>
                  <p className="text-xs text-culinary-muted">Highlight as a special/popular item</p>
                </div>
                <Switch
                  checked={isFeaturedValue}
                  onCheckedChange={(checked) => form.setValue("isFeatured", checked)}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-culinary-border/50 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="bg-white shadow-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-culinary-primary text-white hover:bg-culinary-primary/90 shadow-md transition-all font-medium min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {modalLabels.loading}
                </>
              ) : (
                modalLabels.button
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
