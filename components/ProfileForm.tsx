"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserId, saveUserProfile } from "@/lib/ddb";
import { ProfileFormProps, PreferredPositions } from "@/data/types";

interface MessageState {
  type: "" | "success" | "error";
  text: string;
}

export default function ProfileForm({ initialData = {} }: ProfileFormProps) {
  const { user } = useAuth();
  const userId = getUserId(user);
  
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "",
    preferredPositions: initialData.preferredPositions || {
      defender: 0,
      midfielder: 0,
      attacker: 0,
    },
  });
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState>({ type: "", text: "" });

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePositionChange = (position: keyof PreferredPositions, value: string): void => {
    setFormData((prev) => ({
      ...prev,
      preferredPositions: {
        ...prev.preferredPositions,
        [position]: parseInt(value),
      },
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      await saveUserProfile(userId, formData);

      setMessage({
        type: "success",
        text: "Profile saved successfully!",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({
        type: "error",
        text: "Failed to save profile. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Your Profile</h2>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded ${
            message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="firstName" className="block text-gray-700 font-medium mb-2">
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="mb-6">
        <label htmlFor="lastName" className="block text-gray-700 font-medium mb-2">
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="mb-6">
        <h3 className="text-gray-700 font-medium mb-3">Preferred Positions (Rank 1-3)</h3>
        <div className="space-y-3">
          <div className="flex items-center">
            <label htmlFor="defender" className="w-32 text-gray-700">
              Defender:
            </label>
            <select
              id="defender"
              value={formData.preferredPositions.defender}
              onChange={(e) => handlePositionChange("defender", e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Not selected</option>
              <option value="1">1st choice</option>
              <option value="2">2nd choice</option>
              <option value="3">3rd choice</option>
            </select>
          </div>

          <div className="flex items-center">
            <label htmlFor="midfielder" className="w-32 text-gray-700">
              Midfielder:
            </label>
            <select
              id="midfielder"
              value={formData.preferredPositions.midfielder}
              onChange={(e) => handlePositionChange("midfielder", e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Not selected</option>
              <option value="1">1st choice</option>
              <option value="2">2nd choice</option>
              <option value="3">3rd choice</option>
            </select>
          </div>

          <div className="flex items-center">
            <label htmlFor="attacker" className="w-32 text-gray-700">
              Attacker:
            </label>
            <select
              id="attacker"
              value={formData.preferredPositions.attacker}
              onChange={(e) => handlePositionChange("attacker", e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">Not selected</option>
              <option value="1">1st choice</option>
              <option value="2">2nd choice</option>
              <option value="3">3rd choice</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}