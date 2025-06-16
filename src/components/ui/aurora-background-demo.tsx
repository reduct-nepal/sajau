"use client";

import { motion } from "framer-motion";
import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function AuroraBackgroundDemo() {
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4"
      >
        <div className="text-6xl lg:text-7xl xl:text-8xl font-bold text-gray-900 leading-tight">
          Make your{" "}
          <span className="text-[#F0BC00]">Reduct</span>{" "}
          screenshots{" "}
          <span className="text-[#F0BC00]">shine</span>
        </div>
        <div className="text-xl lg:text-2xl text-gray-600 mb-12 max-w-3xl leading-relaxed">
          Sajau helps you instantly decorate and beautify your Reduct screenshots with clean, branded borders. Just upload, select a preset style, and export.
        </div>
        <Link to="/editor">
          <Button 
            size="lg" 
            className="bg-[#F0BC00] hover:bg-[#E0AC00] text-black font-semibold text-lg px-8 py-4 h-auto"
          >
            Brand your screenshot
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
        </Link>
      </motion.div>
    </AuroraBackground>
  );
} 