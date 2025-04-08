"use client";

import { useState, useEffect } from "react";
import { getAllMembers } from "@/lib/ddb/users";
import { UserProfile } from "@/data/types";

export default function MembersPage() {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [sortField, setSortField] = useState<"name" | "paymentDue">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Members</h1>
        
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
                        ${member.PaymentDue?.toFixed(2) || "0.00"}
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
