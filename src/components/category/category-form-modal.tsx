"use client";

import { useEffect, useState, useRef, DragEvent, ChangeEvent } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import Image from "next/image";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { Switch } from "@/components/ui/switch";
import { ICategory } from "@/modules/category/types";
import { Loader2, UploadCloud } from "lucide-react";

// Reuse the schema from backend if possible, or define locally for client
const formSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(100),
  image: z.string().optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type FormValues = z.infer<typeof formSchema>;

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: ICategory | null;
  onSuccess: () => void;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  category,
  onSuccess,
}: Readonly<CategoryFormModalProps>) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!category;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      image: "",
      description: "",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        image: category.image || "",
        description: category.description || "",
        status: category.status,
      });
    } else {
      form.reset({
        name: "",
        image: "",
        description: "",
        status: "ACTIVE",
      });
    }
  }, [category, form, isOpen]);

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageUrl = useWatch({ control: form.control, name: "image" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      void processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      void processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP, etc.)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setIsUploadingImage(true);
    const toastId = toast.loading("Uploading image to Cloudinary...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "categories");

      const response = await axios.post("/api/upload?folder=categories", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedUrl = response.data?.data?.url;
      if (uploadedUrl) {
        form.setValue("image", uploadedUrl);
        setShowUrlInput(false);
        toast.success("Image uploaded to Cloudinary!", { id: toastId });
      } else {
        toast.error("Upload succeeded but no image URL received", { id: toastId });
      }
    } catch (error: unknown) {
      console.error("Cloudinary upload failed:", error);
      let errMsg = "Failed to upload image to Cloudinary";
      if (axios.isAxiosError(error)) {
        errMsg = error.response?.data?.message || errMsg;
      }
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  async function onSubmit(data: FormValues) {
    setIsLoading(true);
    try {
      if (isEditing) {
        await axios.put(`/api/categories/${category.id}`, data);
        toast.success("Category updated successfully");
      } else {
        await axios.post("/api/categories", data);
        toast.success("Category created successfully");
      }
      onSuccess();
      onClose();
    } catch (error) {
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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-lg w-[95vw] overflow-y-auto bg-culinary-background border-l border-culinary-border/50 shadow-2xl p-0">
        <div className="p-6 border-b border-culinary-border/50 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
          <SheetHeader>
            <SheetTitle className="font-cormorant text-3xl font-semibold text-culinary-text">
              {isEditing ? "Edit Category" : "Add New Category"}
            </SheetTitle>
            <SheetDescription className="text-culinary-muted text-sm">
              {isEditing
                ? "Make changes to your category here."
                : "Create a new category for your menu items."}
            </SheetDescription>
          </SheetHeader>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-culinary-text font-medium">Category Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Appetizers" 
                        className="bg-white border-culinary-border focus-visible:ring-culinary-primary transition-all shadow-sm"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-culinary-text font-medium">Category Image</FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                        
                        {imageUrl ? (
                          <div className="relative h-40 w-full border border-culinary-border rounded-xl overflow-hidden group">
                            <Image src={imageUrl} alt="Category Preview" fill sizes="(max-width: 768px) 100vw, 500px" className="object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage}>
                                {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change Image"}
                              </Button>
                              <Button type="button" variant="destructive" size="sm" onClick={() => { form.setValue("image", ""); setShowUrlInput(false); }} disabled={isUploadingImage}>
                                Remove
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isUploadingImage}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer group shadow-sm ${isDragging ? "border-culinary-primary bg-culinary-primary/5" : "border-culinary-border bg-white hover:bg-white/50"}`}
                          >
                            <div className="w-12 h-12 rounded-full bg-culinary-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                              {isUploadingImage ? (
                                <Loader2 className="text-culinary-primary animate-spin" size={24} />
                              ) : (
                                <UploadCloud className="text-culinary-primary" size={24} />
                              )}
                            </div>
                            <p className="text-sm font-medium text-culinary-text">
                              {isUploadingImage ? "Uploading to Cloudinary..." : "Upload Image"}
                            </p>
                            <p className="text-xs text-culinary-muted mt-1">
                              {isUploadingImage ? "Please wait a moment" : "Drag & Drop or Click to Browse"}
                            </p>
                          </button>
                        )}

                        <div className="flex items-center gap-2">
                          <Button type="button" variant="link" size="sm" className="text-xs text-culinary-primary p-0 h-auto" onClick={() => setShowUrlInput(!showUrlInput)}>
                            {showUrlInput ? "Hide URL Input" : "Or enter Image URL instead"}
                          </Button>
                        </div>

                        {showUrlInput && (
                          <Input 
                            placeholder="https://example.com/image.jpg" 
                            className="bg-white border-culinary-border focus-visible:ring-culinary-primary transition-all shadow-sm mt-2"
                            {...field} 
                          />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-culinary-text font-medium">Description</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea 
                          placeholder="Brief description of this category" 
                          className="resize-none h-28 bg-white border-culinary-border focus-visible:ring-culinary-primary transition-all shadow-sm pb-8"
                          {...field} 
                        />
                        <div className="absolute bottom-2 right-3 text-xs text-culinary-muted">
                          {(field.value || "").length} / 500 characters
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-culinary-border p-4 bg-white shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-culinary-text font-medium text-base">Active Status</FormLabel>
                      <p className="text-sm text-culinary-muted">
                        Make this category visible on the menu.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === "ACTIVE"}
                        onCheckedChange={(checked) => field.onChange(checked ? "ACTIVE" : "INACTIVE")}
                        className="data-[state=checked]:bg-culinary-primary"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-8 border-t border-culinary-border/50 sticky bottom-0 bg-culinary-background pb-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose} 
                disabled={isLoading}
                className="border-culinary-border text-culinary-text hover:bg-white px-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-culinary-primary text-white hover:bg-culinary-primary/90 px-8 shadow-md hover:shadow-lg transition-all" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
