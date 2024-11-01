import React from 'react';
import { MessageCircle, BarChart, Target, Brain, LineChart } from 'lucide-react';

const RankHigherMedia = () => {
  // Centralized content configuration
  const coreSolutions = [
    {
      icon: <BarChart className="w-8 h-8 text-blue-400" />,
      title: "Improve Digital Workflow",
      description: "Streamline your digital processes and enhance operational efficiency with data-driven insights."
    },
    {
      icon: <Target className="w-8 h-8 text-blue-400" />,
      title: "Open Revenue Channels",
      description: "Discover and capitalize on untapped market opportunities through strategic digital expansion."
    },
    {
      icon: <LineChart className="w-8 h-8 text-blue-400" />,
      title: "Optimize PPC Campaigns",
      description: "Maximize your ad spend ROI through strategic bidding and campaign optimization."
    },
    {
      icon: <Brain className="w-8 h-8 text-blue-400" />,
      title: "Get Data Insights",
      description: "Transform your data into actionable strategies that drive business growth."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-gray-100">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-gray-900/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold text-blue-400">
            Rank Higher Media
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <a href="#services" className="text-gray-300 hover:text-white transition-colors">Services</a>
            <a href="#approach" className="text-gray-300 hover:text-white transition-colors">Our Approach</a>
            <a href="#results" className="text-gray-300 hover:text-white transition-colors">Results</a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
            <a href="#contact" className="bg-blue-600 px-6 py-2 rounded-lg text-white hover:bg-blue-700 transition-colors">
              Get Started
            </a>
          </div
