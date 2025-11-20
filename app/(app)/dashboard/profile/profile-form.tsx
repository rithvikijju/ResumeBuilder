"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfile, type ProfileActionState } from "./actions";
import { useState } from "react";

type ProfileFormProps = {
  initialData: {
    full_name: string;
    headline: string;
    location: string;
    phone: string;
    email: string;
    links: Array<{ label: string; url: string }>;
  };
};

const initialState: ProfileActionState = { status: "success", message: "" };

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfile, initialState);
  const [links, setLinks] = useState(initialData.links || []);

  const addLink = () => {
    setLinks([...links, { label: "", url: "" }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: "label" | "url", value: string) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: value };
    setLinks(updated);
  };

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={initialData.full_name}
              placeholder="John Doe"
            />
            <p className="text-xs text-gray-500">This will appear as the main heading on your resume.</p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              disabled
              value={initialData.email}
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500">Email is managed through your account settings.</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={initialData.phone}
              placeholder="(555) 123-4567"
            />
            <p className="text-xs text-gray-500">Optional. Will appear in resume header if provided.</p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium text-gray-700">
              Location
            </label>
            <Input
              id="location"
              name="location"
              type="text"
              defaultValue={initialData.location}
              placeholder="New York, NY"
            />
            <p className="text-xs text-gray-500">Optional. City, State or City, Country format.</p>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <label htmlFor="headline" className="text-sm font-medium text-gray-700">
              Professional Headline
            </label>
            <Input
              id="headline"
              name="headline"
              type="text"
              defaultValue={initialData.headline}
              placeholder="Software Engineer | Full-Stack Developer"
            />
            <p className="text-xs text-gray-500">Optional. Brief professional tagline.</p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Links</label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addLink}
              >
                Add Link
              </Button>
            </div>
            <p className="text-xs text-gray-500">Add LinkedIn, GitHub, portfolio, or other relevant links.</p>

            {links.map((link, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Label (e.g., LinkedIn)"
                    value={link.label}
                    onChange={(e) => updateLink(index, "label", e.target.value)}
                  />
                  <Input
                    placeholder="URL (e.g., https://linkedin.com/in/username)"
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(index, "url", e.target.value)}
                  />
                </div>
                <input type="hidden" name={`link_label_${index}`} value={link.label} />
                <input type="hidden" name={`link_url_${index}`} value={link.url} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLink(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}

            {links.length === 0 && (
              <p className="text-sm text-gray-400 italic">No links added yet. Click "Add Link" to add one.</p>
            )}
          </div>

          {/* Status message */}
          {state.message && (
            <div
              className={`rounded-lg p-3 text-sm ${
                state.status === "error"
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {state.message}
            </div>
          )}

          {/* Submit button */}
          <div className="flex justify-end">
            <Button type="submit" variant="primary">
              Save Profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

