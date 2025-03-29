"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { saveUserProfile } from "@/lib/ddb/users";
import { ProfileFormProps, PreferredPositions } from "@/data/types";
import PositionRankingTabs from "./PositionRankingTabs";

interface MessageState {
  type: "" | "success" | "error";
  text: string;
}

export default function ProfileForm({ initialData = {} }: ProfileFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  
  const defaultPositions = [
    "Defender",
    "Midfielder",
    "Attacker"
  ];
  
  const [formData, setFormData] = useState({
    FirstName: initialData.FirstName || "",
    LastName: initialData.LastName || "",
    PreferredPositions: initialData.PreferredPositions || defaultPositions,
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

  const handlePositionsChange = (positions: string[]): void => {
    setFormData((prev) => ({
      ...prev,
      PreferredPositions: positions,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      if (!user) {
        throw new Error("User not authenticated");
      }
      
      await saveUserProfile(user.userId, formData);

      setMessage({
        type: "success",
        text: "Profile saved successfully!",
      });

      // Redirect to profile view page after successful save
      setTimeout(() => {
        router.push("/profile");
      }, 600);
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
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center dark:text-white">Your Profile</h2>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded ${
            message.type === "success" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="FirstName" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
          First Name
        </label>
        <input
          type="text"
          id="FirstName"
          name="FirstName"
          value={formData.FirstName}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        />
      </div>

      <div className="mb-6">
        <label htmlFor="LastName" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
          Last Name
        </label>
        <input
          type="text"
          id="LastName"
          name="LastName"
          value={formData.LastName}
          onChange={handleChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          required
        />
      </div>

      <div className="mb-6">
        <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-3">Preferred Positions</h3>
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
          <PositionRankingTabs 
            positions={formData.PreferredPositions} 
            onChange={handlePositionsChange} 
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-black border border-black text-white hover:bg-gray-800 px-6 py-3 rounded-full transition duration-200 font-bold cursor-pointer disabled:opacity-50 focus:outline-none"
      >
        {isSubmitting ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}