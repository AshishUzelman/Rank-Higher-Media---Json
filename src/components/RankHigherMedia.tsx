import React from 'react';
import { MessageCircle, BarChart, Target, Brain, LineChart } from 'lucide-react';

const RankHigherMedia = () => {
  // Centralized content - easy to update later
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 md:py-40 bg-gradient-to-br from-blue-900 via-gray-900 to-black">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Boost Your ROI<br />with Data-Driven SEM
              </h1>
              <p className="text-xl text-gray-300">
                We focus on your customers through deep site analysis and data-driven strategies that increase traffic, 
                relevance, and sales.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#contact" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center">
                  Get Your Free Audit
                </a>
                <a href="#case-studies" className="border border-gray-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors text-center">
                  View Case Studies
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="/api/placeholder/800/600" 
                alt="Analytics Dashboard" 
                className="rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Core Solutions */}
      <section className="py-20 bg-gray-900/50" id="services">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreSolutions.map((solution, index) => (
              <div 
                key={index} 
                className="bg-gray-800/50 p-6 rounded-lg hover:transform hover:-translate-y-1 transition-all duration-300 border border-gray-700/50"
              >
                <div className="mb-4">{solution.icon}</div>
                <h3 className="text-xl font-bold mb-2">{solution.title}</h3>
                <p className="text-gray-300">{solution.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-black/50" id="approach">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Comprehensive Digital Solutions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800/30 p-8 rounded-lg border border-gray-700/50">
              <h3 className="text-xl font-bold mb-4">Digital Advertising</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  Google Ads Optimization
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  Bing Ads Management
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  Facebook Advertising
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  LinkedIn Marketing
                </li>
              </ul>
            </div>
            <div className="bg-gray-800/30 p-8 rounded-lg border border-gray-700/50">
              <h3 className="text-xl font-bold mb-4">Site Optimization</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  Increase Site Traffic
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  Improve Conversion Rate
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  A/B Testing
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  User Experience Enhancement
                </li>
              </ul>
            </div>
            <div className="bg-gray-800/30 p-8 rounded-lg border border-gray-700/50">
              <h3 className="text-xl font-bold mb-4">Strategy Development</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  Organic & Paid Media
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  New Sales Segments
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  Market Analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">•</span>
                  Campaign Integration
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-gray-900 to-black">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-8">Ready to Scale Your Growth?</h2>
          <p className="text-xl mb-8 text-gray-300">Get your free SEM audit and discover your untapped potential</p>
          <a 
            href="#contact"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
          >
            Request Free Audit
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Rank Higher Media</h3>
              <p className="text-gray-400">Your partner in digital growth and optimization</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Search Engine Marketing</li>
                <li>Conversion Optimization</li>
                <li>Analytics & Reporting</li>
                <li>Landing Page Design</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Case Studies</li>
                <li>Blog</li>
                <li>Guides</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>info@rankhighermedia.com</li>
                <li>Contact Form</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            © {new Date().getFullYear()} Rank Higher Media. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RankHigherMedia;
