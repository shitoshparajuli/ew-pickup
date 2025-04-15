"use client";

import { useState, useEffect } from "react";
import { getAllMembers, updateUserProfile } from "@/lib/ddb/users";
import { UserProfile } from "@/data/types";
import { useAuth } from "@/context/AuthContext";

export default function MembersPage() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [sortField, setSortField] = useState<"name" | "paymentDue">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(true);
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>("");
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        const data = await getAllMembers();
        setMembers(data);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const handleSort = (field: "name" | "paymentDue") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleUpdatePayment = async (userId: string) => {
    if (!newPaymentAmount) return;
    
    try {
      setUpdateLoading(true);
      const amount = parseFloat(newPaymentAmount);
      
      if (isNaN(amount)) {
        alert("Please enter a valid number");
        return;
      }

      await updateUserProfile(userId, {
        PaymentDue: amount
      });

      // Update local state
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.UserId === userId 
            ? { ...member, PaymentDue: amount }
            : member
        )
      );

      setEditingPayment(null);
      setNewPaymentAmount("");
    } catch (error) {
      console.error("Error updating payment:", error);
      alert("Failed to update payment. Please try again.");
    } finally {
      setUpdateLoading(false);
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    if (sortField === "name") {
      const nameA = `${a.FirstName} ${a.LastName}`.toLowerCase();
      const nameB = `${b.FirstName} ${b.LastName}`.toLowerCase();
      return sortDirection === "asc" 
        ? nameA.localeCompare(nameB) 
        : nameB.localeCompare(nameA);
    } else {
      const paymentA = a.PaymentDue || 0;
      const paymentB = b.PaymentDue || 0;
      return sortDirection === "asc" 
        ? paymentA - paymentB 
        : paymentB - paymentA;
    }
  });

  const membersWithPayment = members.filter(member => (member.PaymentDue || 0) > 0);

  // Function to render position with rank indicator
  const renderPositions = (positions: string[] | undefined) => {
    if (!positions || positions.length === 0) return "None";
    
    // Create a copy to avoid mutating the original
    const sortedPositions = [...positions];
    
    return (
      <div className="space-y-1">
        {sortedPositions.map((position, index) => (
          <div key={position} className="flex items-center">
            <span className={`inline-flex items-center justify-center rounded-full w-5 h-5 mr-2 text-xs font-medium ${
              index === 0 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
              index === 1 ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
              "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}>
              {index + 1}
            </span>
            {position}
          </div>
        ))}
      </div>
    );
  };

  const getSortIcon = (field: "name" | "paymentDue") => {
    if (sortField !== field) return null;
    
    return (
      <span className="ml-1">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const renderPaymentAmount = (userId: string, amount: number = 0) => {
    if (editingPayment === userId && isAdmin) {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={newPaymentAmount}
            onChange={(e) => setNewPaymentAmount(e.target.value)}
            className="w-24 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="0.00"
            step="0.01"
          />
          <button
            onClick={() => handleUpdatePayment(userId)}
            disabled={updateLoading}
            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
          >
            ✓
          </button>
          <button
            onClick={() => {
              setEditingPayment(null);
              setNewPaymentAmount("");
            }}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            ✕
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <span>${amount.toFixed(2)}</span>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingPayment(userId);
              setNewPaymentAmount(amount.toString());
            }}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 ml-2"
          >
            ✎
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Members</h1>

        {/* Payment Due Summary Section */}
        {membersWithPayment.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4 dark:text-white">Members with Payment Due</h2>
            <div className="space-y-3">
              {membersWithPayment.map(member => (
                <div key={member.UserId} className="flex justify-between items-center py-2 border-b dark:border-gray-700 last:border-0">
                  <span className="dark:text-gray-200">
                    {member.FirstName} {member.LastName}
                  </span>
                  {renderPaymentAmount(member.UserId, member.PaymentDue || 0)}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 md:p-8">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-300">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300 text-center py-8">No members found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th 
                      className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Name {getSortIcon("name")}
                      </div>
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-200">
                      Preferred Positions
                    </th>
                    <th 
                      className="py-3 px-4 text-left font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
                      onClick={() => handleSort("paymentDue")}
                    >
                      <div className="flex items-center">
                        Payment Due {getSortIcon("paymentDue")}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {sortedMembers.map((member) => (
                    <tr key={member.UserId} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150">
                      <td className="py-4 px-4 whitespace-nowrap dark:text-gray-200">
                        {member.FirstName} {member.LastName}
                      </td>
                      <td className="py-4 px-4 dark:text-gray-200">
                        {renderPositions(member.PreferredPositions)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap dark:text-gray-200">
                        {renderPaymentAmount(member.UserId, member.PaymentDue || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
