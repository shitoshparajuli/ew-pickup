"use client";

import Link from "next/link";
import { Github } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black text-white py-4 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-400">© {new Date().getFullYear()} Everest Warriors. All rights reserved.</p>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 mr-2">Developed by Shitosh</span>
            <Link 
              href="https://github.com/shitoshparajuli/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center"
            >
              <Github size={18} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
} 