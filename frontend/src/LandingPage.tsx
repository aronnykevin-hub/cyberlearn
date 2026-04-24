import React, { useState, useEffect } from 'react';
import { Menu, X, Moon, Sun, ArrowRight, Shield, Users, BookOpen, BarChart3, Bell, Award, Mail, Share2, MessageCircle } from 'lucide-react';

export default function LandingPage({ onStartTrial = () => {} }) {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsMenuOpen(false);
      return;
    }

    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const footerGroups = {
    Product: [
      { label: 'Features', target: 'features' },
      { label: 'Pricing', target: 'pricing' },
      { label: 'Security', target: 'how-it-works' },
      { label: 'Roadmap', target: 'how-it-works' },
    ],
    Company: [
      { label: 'About', target: 'top' },
      { label: 'Blog', target: 'features' },
      { label: 'Careers', target: 'pricing' },
      { label: 'Contact', target: 'contact' },
    ],
    Legal: [
      { label: 'Privacy', target: 'contact' },
      { label: 'Terms', target: 'contact' },
      { label: 'Security', target: 'features' },
      { label: 'Compliance', target: 'contact' },
    ],
  };

  return (
    <div className={isDark ? 'dark' : ''} id="top">
      <div className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
      }`}>
        
        {/* ============ NAVIGATION ============ */}
        <nav className={`fixed w-full z-50 transition-all duration-300 ${
          scrollY > 50 
            ? isDark 
              ? 'bg-slate-900/95 backdrop-blur-md shadow-lg' 
              : 'bg-white/95 backdrop-blur-md shadow-lg'
            : 'bg-transparent'
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              
              {/* Logo */}
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <Shield className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-lg group-hover:blur-xl transition-all"></div>
                </div>
                <span className="font-display text-2xl font-bold bg-gradient-to-r from-[#0047AB] to-sky-500 bg-clip-text text-transparent">Cyberlearn</span>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex gap-8">
                {['Features', 'How It Works', 'Pricing', 'Contact'].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item.toLowerCase().replace(' ', '-'))}
                    className={`text-sm font-medium transition-colors duration-300 hover:text-blue-600 ${
                      isDark ? 'text-slate-300 hover:text-blue-400' : 'text-slate-600'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center gap-4">
                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setIsDark(!isDark)}
                  className={`p-2 rounded-lg transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* CTA Button */}
                <button onClick={() => onStartTrial()} className="hidden md:block px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-300">
                  Get Started
                </button>

                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
              <div className={`md:hidden pb-4 space-y-2 animate-in fade-in slide-in-from-top ${
                isDark ? 'bg-slate-800' : 'bg-slate-50'
              }`}>
                {['Features', 'How It Works', 'Pricing', 'Contact'].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item.toLowerCase().replace(' ', '-'))}
                    className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'hover:bg-slate-700' 
                        : 'hover:bg-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* ============ HERO SECTION ============ */}
        <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
          
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute top-20 right-10 w-72 h-72 rounded-full blur-3xl animate-pulse ${
              isDark 
                ? 'bg-blue-600/20' 
                : 'bg-blue-400/10'
            }`}></div>
            <div className={`absolute bottom-10 left-10 w-96 h-96 rounded-full blur-3xl animate-pulse ${
              isDark 
                ? 'bg-[#0047AB]/15' 
                : 'bg-[#0047AB]/8'
            }`} style={{animationDelay: '1s'}}></div>
          </div>

          <div className="relative max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left Content */}
              <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
                <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#0047AB]/10 to-white border border-[#0047AB]/20">
                  <span className="text-sm font-semibold text-[#0047AB]">Employee Cyberthreat Vigilance System</span>
                </div>

                <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight bg-gradient-to-r from-[#0047AB] via-sky-600 to-sky-400 bg-clip-text text-transparent">
                  Secure Your <span className="block">Organization</span> Today
                </h1>

                <p className={`text-xl leading-relaxed ${
                  isDark ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  Empower your employees with comprehensive cybersecurity training. Create department-based modules, receive threat reports, test awareness with real-world scenarios, and track progress in real-time.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </button>
                  <button className={`px-8 py-4 rounded-lg font-semibold border-2 transition-all duration-300 hover:scale-105 ${
                    isDark 
                      ? 'border-slate-600 hover:bg-slate-800' 
                      : 'border-slate-300 hover:bg-slate-50'
                  }`}>
                    Watch Demo
                  </button>
                </div>

                {/* ...stats removed... */}
              </div>

              {/* Right Visual - Animated Dashboard Preview */}
              <div className="relative animate-in fade-in slide-in-from-right duration-1000 lg:block hidden">
                <div className="relative group">
                  <div className={`absolute inset-0 rounded-[2rem] blur-3xl transition-all ${
                    isDark
                      ? 'bg-[#0047AB]/20'
                      : 'bg-[#0047AB]/10'
                  }`}></div>

                  <div className={`relative rounded-[2rem] overflow-hidden border shadow-2xl ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-700/70'
                      : 'bg-white border-slate-200/80'
                  } group-hover:scale-[1.02] transition-transform duration-300`}>
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/70 dark:border-slate-700/70 bg-white/90 dark:bg-slate-900/90">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-red-400"></span>
                          <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                          <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                        </div>
                        <div>
                          <p className="font-display font-semibold text-sm">Team Operations View</p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Workforce awareness dashboard</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#0047AB]/10 text-[#0047AB]">Live</span>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="rounded-[1.5rem] overflow-hidden border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
                        <img
                          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80"
                          alt="Workers at desktop computers in an office"
                          className="h-[310px] w-full object-cover"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Completion', value: '87%' },
                          { label: 'Reports', value: '12' },
                          { label: 'Teams', value: '24' },
                        ].map((item) => (
                          <div key={item.label} className={`rounded-xl border p-3 text-center ${
                            isDark
                              ? 'border-slate-700 bg-slate-800/60'
                              : 'border-slate-200 bg-slate-50'
                          }`}>
                            <p className="text-xs text-slate-500">{item.label}</p>
                            <p className="font-display text-lg font-bold text-[#0047AB]">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className={`rounded-xl border p-4 ${
                        isDark
                          ? 'border-slate-700 bg-slate-800/80'
                          : 'border-slate-200 bg-white'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold">Awareness snapshot</p>
                          <Award className="w-4 h-4 text-[#0047AB]" />
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div className="h-full w-[87%] rounded-full bg-gradient-to-r from-[#0047AB] to-sky-400"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-8 -right-8 w-36 h-36 bg-[#0047AB]/10 rounded-full blur-3xl animate-bounce" style={{animationDuration: '3s'}}></div>
                  <div className="absolute -top-8 -left-8 w-28 h-28 bg-sky-400/10 rounded-full blur-3xl animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FEATURES SECTION ============ */}
        <section id="features" className={`py-20 px-4 sm:px-6 lg:px-8 ${
          isDark ? 'bg-slate-800/50' : 'bg-slate-50'
        }`}>
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
                <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
                Vigilance-Driven Features for
                <span className="block bg-gradient-to-r from-[#0047AB] to-sky-500 bg-clip-text text-transparent"> Modern Threat Defense</span>
              </h2>
              <p className={`text-xl max-w-2xl mx-auto ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Everything you need to build a vigilant, security-focused organization
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: BookOpen,
                  title: "Smart Learning Modules",
                  description: "Department-based, role-specific cybersecurity training tailored to your organization's needs",
                  color: "from-blue-600 to-blue-400"
                },
                {
                  icon: Bell,
                  title: "Phishing Simulations",
                  description: "Realistic fake notifications and emails to test employee awareness and improve security response",
                  color: "from-orange-600 to-orange-400"
                },
                {
                  icon: Shield,
                  title: "Threat Reporting",
                  description: "Employees can easily report suspicious activities with detailed information and screenshots",
                  color: "from-red-600 to-red-400"
                },
                {
                  icon: Users,
                  title: "Team Management",
                  description: "Create company profiles, add employees, assign departments, and manage roles seamlessly",
                  color: "from-[#0047AB] to-sky-500"
                },
                {
                  icon: BarChart3,
                  title: "Progress Tracking",
                  description: "Real-time analytics and detailed reports on employee learning progress and certifications",
                  color: "from-green-600 to-green-400"
                },
                {
                  icon: Award,
                  title: "Digital Certificates",
                  description: "Issue professional certificates automatically upon module completion for employee recognition",
                  color: "from-yellow-600 to-yellow-400"
                },
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className={`group p-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer border ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700/50 hover:border-blue-600/50'
                        : 'bg-white border-slate-200/50 hover:border-blue-600/30'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-3 mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-full h-full text-white" />
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{feature.description}</p>

                    {/* Arrow Indicator */}
                    <div className="mt-4 inline-flex items-center text-blue-600 group-hover:gap-3 transition-all">
                      <span className="text-sm font-semibold">Learn more</span>
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section id="how-it-works" className={`py-20 px-4 sm:px-6 lg:px-8 ${
          isDark ? 'bg-slate-900' : 'bg-white'
        }`}>
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
                <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
                How Cyberlearn
                <span className="block bg-gradient-to-r from-[#0047AB] to-sky-500 bg-clip-text text-transparent"> Powers Your Organization</span>
              </h2>
            </div>

            {/* Process Flow */}
            <div className="space-y-8 max-w-4xl mx-auto">
              {[
                {
                  step: 1,
                  title: "Admin Creates Company Profile",
                  description: "Set up your organization, configure departments, and define security policies",
                  icon: Shield,
                  highlights: ["Configure departments", "Set security policies", "Invite team members"]
                },
                {
                  step: 2,
                  title: "Add Employees & Assign Roles",
                  description: "Import employees who've already signed up and assign them to departments and roles",
                  icon: Users,
                  highlights: ["Bulk import employees", "Assign roles", "Set permissions"]
                },
                {
                  step: 3,
                  title: "Deploy Custom Training Modules",
                  description: "Assign department-specific training tailored to your organization. Modules and schedules are managed automatically.",
                  icon: BookOpen,
                  highlights: ["Assign modules", "Department-based", "Automated scheduling"]
                },
                {
                  step: 4,
                  title: "Automated Phishing Simulations",
                  description: "The system automatically sends realistic phishing campaigns and fake notifications to test employee awareness.",
                  icon: Bell,
                  highlights: ["Fully automated", "No manual setup", "Realistic scenarios"]
                },
                {
                  step: 5,
                  title: "Monitor Threat Reports",
                  description: "Receive and manage employee threat reports with admin responses and tracking",
                  icon: Shield,
                  highlights: ["Receive reports", "Add responses", "Track resolution"]
                },
                {
                  step: 6,
                  title: "Issue Certificates",
                  description: "Automatically award digital certificates upon successful module completion",
                  icon: Award,
                  highlights: ["Auto-issue certs", "Track achievements", "Share credentials"]
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="relative">
                    {/* Connector Line */}
                    {idx < 5 && (
                      <div className={`absolute left-8 top-24 w-1 h-12 ${
                        isDark ? 'bg-gradient-to-b from-blue-600 to-transparent' : 'bg-gradient-to-b from-blue-400 to-transparent'
                      }`}></div>
                    )}

                    {/* Step Card */}
                    <div className={`flex gap-6 group cursor-pointer transition-all duration-300 hover:scale-102 p-6 rounded-xl ${
                      isDark
                        ? 'hover:bg-slate-800/50'
                        : 'hover:bg-slate-50'
                    }`}>
                      {/* Step Number Circle */}
                      <div className={`relative flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl transition-all group-hover:scale-110 ${
                        isDark
                        ? 'bg-gradient-to-br from-[#0047AB] to-sky-600 text-white'
                        : 'bg-gradient-to-br from-[#0047AB] to-sky-500 text-white'
                      }`}>
                        {item.step}
                        <div className="absolute inset-0 rounded-full bg-blue-600/20 group-hover:bg-blue-600/40 transition-all blur-lg"></div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-2">
                        <div className="flex items-start gap-3">
                          <Icon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                          <div>
                            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                            <p className={`mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {item.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.highlights.map((highlight, i) => (
                                <span
                                  key={i}
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    isDark
                                      ? 'bg-slate-800 text-blue-400'
                                      : 'bg-blue-50 text-blue-600'
                                  }`}
                                >
                                  {highlight}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ============ BENEFITS SECTION ============ */}
        <section className={`py-20 px-4 sm:px-6 lg:px-8 ${
          isDark ? 'bg-slate-800/50' : 'bg-slate-50'
        }`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
                Why Choose
                <span className="block bg-gradient-to-r from-[#0047AB] to-sky-500 bg-clip-text text-transparent"> Cyberlearn?</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "📊 Real-Time Analytics",
                  description: "Track employee learning progress, test scores, and security improvements with comprehensive dashboards"
                },
                {
                  title: "🎯 Department-Based Learning",
                  description: "Create targeted training for IT, HR, Finance, and other departments with role-specific content"
                },
                {
                  title: "🚨 Immediate Threat Response",
                  description: "Employees report threats instantly, admins respond quickly, and incidents are tracked for improvement"
                },
                {
                  title: "🎓 Automated Certificates",
                  description: "Recognize achievements with professional digital certificates issued automatically upon completion"
                },
                {
                  title: "🔒 Enhanced Security Culture",
                  description: "Build a security-aware organization through continuous education and realistic phishing simulations"
                },
                {
                  title: "📱 Employee Engagement",
                  description: "Increase participation with interactive modules, gamification, and recognition through certificates"
                },
              ].map((benefit, idx) => (
                <div key={idx} className={`p-8 rounded-xl border transition-all duration-300 hover:scale-105 hover:shadow-lg group cursor-pointer ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700/50 hover:border-blue-600/50'
                    : 'bg-white border-slate-200/50 hover:border-blue-600/30'
                }`}>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-blue-600 transition-colors">{benefit.title}</h3>
                  <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PRICING SECTION ============ */}
        <section id="pricing" className={`py-20 px-4 sm:px-6 lg:px-8 ${
          isDark ? 'bg-slate-900' : 'bg-white'
        }`}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
                Simple,
                <span className="block bg-gradient-to-r from-[#0047AB] to-sky-500 bg-clip-text text-transparent"> Transparent Pricing</span>
              </h2>
              <p className={`text-xl max-w-2xl mx-auto ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                Choose the plan that fits your organization
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  name: "Starter",
                  price: "$299",
                  period: "/month",
                  description: "Perfect for small teams",
                  features: ["Up to 50 employees", "5 training modules", "Basic reporting", "Email support"],
                  highlighted: false
                },
                {
                  name: "Professional",
                  price: "$799",
                  period: "/month",
                  description: "For growing organizations",
                  features: ["Up to 500 employees", "Unlimited modules", "Advanced analytics", "Phishing simulations", "Priority support", "Custom branding"],
                  highlighted: true
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  period: "/month",
                  description: "For large enterprises",
                  features: ["Unlimited employees", "Full customization", "Dedicated account manager", "API access", "24/7 support", "SLA guarantee"],
                  highlighted: false
                },
              ].map((plan, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-2xl transition-all duration-300 hover:scale-105 border-2 ${
                    plan.highlighted
                      ? isDark
                        ? 'bg-gradient-to-br from-[#0047AB]/15 to-sky-100 border-[#0047AB] shadow-2xl'
                        : 'bg-gradient-to-br from-[#0047AB]/8 to-white border-[#0047AB] shadow-xl'
                  : isDark
                  ? 'bg-slate-800/50 border-slate-700/50 hover:border-blue-600/50'
                  : 'bg-white border-slate-200/50 hover:border-blue-600/30'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#0047AB] to-sky-500 text-white text-sm font-bold rounded-full">
                      Most Popular
                    </div>
                  )}

                  <div className="p-8">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className={`mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{plan.description}</p>

                    <div className="mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{plan.period}</span>
                    </div>

                    <button onClick={() => onStartTrial()} className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 mb-6 ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-[#0047AB] to-sky-500 text-white hover:shadow-lg'
                        : isDark
                        ? 'bg-slate-700 hover:bg-slate-600'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}>
                      Get Started
                    </button>

                    <div className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0047AB] to-sky-500 flex items-center justify-center text-white text-xs">✓</div>
                          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                All plans include a <span className="font-bold text-blue-600">14-day free trial</span>. No credit card required.
              </p>
            </div>
          </div>
        </section>

        {/* ============ CTA SECTION ============ */}
        <section className={`py-20 px-4 sm:px-6 lg:px-8 ${
          isDark ? 'bg-slate-800/50' : 'bg-slate-50'
        }`}>
          <div className="max-w-4xl mx-auto text-center">
                <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
              Ready to Secure Your
              <span className="block bg-gradient-to-r from-[#0047AB] to-sky-500 bg-clip-text text-transparent"> Organization?</span>
            </h2>
            <p className={`text-xl mb-8 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Join hundreds of organizations building a security-aware culture with Cyberlearn
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
              <button className={`px-8 py-4 rounded-lg font-semibold border-2 transition-all duration-300 hover:scale-105 ${
                isDark 
                  ? 'border-slate-600 hover:bg-slate-800' 
                  : 'border-slate-300 hover:bg-slate-100'
              }`}>
                Schedule Demo
              </button>
            </div>
          </div>
        </section>

        {/* ============ CONTACT SECTION ============ */}
        <section id="contact" className={`py-20 px-4 sm:px-6 lg:px-8 ${
          isDark ? 'bg-slate-900' : 'bg-white'
        }`}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-4xl font-bold mb-4">Get in Touch</h2>
                  <p className={`text-lg ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Have questions? Our team is here to help you secure your organization.
                  </p>
                </div>

                <div className="space-y-6">
                  {[
                  {
                    icon: Mail,
                    label: "Email",
                    value: "nansubugaluis@gmail.com",
                    color: "from-blue-600 to-blue-400",
                    href: "mailto:nansubugaluis@gmail.com"
                  },
                  {
                    icon: MessageCircle,
                    label: "WhatsApp",
                    value: "+256701948579",
                    color: "from-green-600 to-green-400",
                    href: "https://wa.me/256701948579"
                  },
                ].map((contact, idx) => {
                    const Icon = contact.icon;
                    return (
                      <a
                        key={idx}
                        href={contact.href}
                        target={contact.href.startsWith('http') ? '_blank' : undefined}
                        rel={contact.href.startsWith('http') ? 'noreferrer' : undefined}
                        className={`flex items-start gap-4 p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg group ${
                          isDark
                            ? 'hover:bg-slate-800/50'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${contact.color} p-3 flex-shrink-0 group-hover:scale-110 transition-transform`}>
                          <Icon className="w-full h-full text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-500">{contact.label}</p>
                          <p className="text-lg font-bold">{contact.value}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors ml-auto opacity-0 group-hover:opacity-100" />
                      </a>
                    );
                  })}
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-500">Contact us</p>
                  <div className="flex gap-4">
                    {[
                      { name: 'Email', icon: Mail, href: 'mailto:nansubugaluis@gmail.com' },
                      { name: 'WhatsApp', icon: MessageCircle, href: 'https://wa.me/256701948579' }
                    ].map((social, idx) => {
                      const Icon = social.icon;
                      return (
                        <a
                          key={idx}
                          href={social.href}
                          target={social.href.startsWith('http') ? '_blank' : undefined}
                          rel={social.href.startsWith('http') ? 'noreferrer' : undefined}
                          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg ${
                            isDark
                              ? 'bg-slate-800 hover:bg-gradient-to-r hover:from-[#0047AB] hover:to-sky-600'
                              : 'bg-slate-100 hover:bg-gradient-to-r hover:from-[#0047AB] hover:to-sky-600'
                          }`}
                        >
                          <Icon className={`w-6 h-6 transition-colors ${
                            isDark ? 'text-slate-400' : 'text-slate-600'
                          } hover:text-white`} />
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className={`p-8 rounded-2xl border ${
                isDark
                  ? 'bg-slate-800/50 border-slate-700/50'
                  : 'bg-slate-50 border-slate-200/50'
              }`}>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                        isDark
                          ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                        isDark
                          ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Organization</label>
                    <input
                      type="text"
                      placeholder="Your organization"
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                        isDark
                          ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Message</label>
                    <textarea
                      rows="4"
                      placeholder="Tell us about your needs..."
                      className={`w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                        isDark
                          ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-500'
                          : 'bg-white border-slate-200 text-slate-900 placeholder-slate-500'
                      }`}
                    ></textarea>
                  </div>

                  <button type="submit" className="w-full py-3 bg-[#0047AB] text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300">
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ============ FOOTER ============ */}
        <footer className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-900 border-slate-800'} border-t py-12 px-4 sm:px-6 lg:px-8`}>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <span className="text-xl font-bold text-white">Cyberlearn</span>
                </div>
                <p className="text-slate-400 text-sm">
                  Empowering organizations with cybersecurity awareness and training.
                </p>
              </div>

              {/* Product */}
              <div>
                <h4 className="font-display font-semibold text-white mb-4">Product</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  {footerGroups.Product.map((item) => (
                    <li key={item.label}>
                      <a
                        href={`#${item.target}`}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToSection(item.target);
                        }}
                        className="hover:text-[#0047AB] transition-colors"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="font-display font-semibold text-white mb-4">Company</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  {footerGroups.Company.map((item) => (
                    <li key={item.label}>
                      <a
                        href={`#${item.target}`}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToSection(item.target);
                        }}
                        className="hover:text-[#0047AB] transition-colors"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="font-display font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2 text-slate-400 text-sm">
                  {footerGroups.Legal.map((item) => (
                    <li key={item.label}>
                      <a
                        href={`#${item.target}`}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToSection(item.target);
                        }}
                        className="hover:text-[#0047AB] transition-colors"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom */}
            <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
              <p className="text-slate-400 text-sm">
                © 2026 Cyberlearn. All rights reserved.
              </p>
              <div className="flex gap-4 mt-4 sm:mt-0">
                {[
                  { icon: Mail, href: 'mailto:nansubugaluis@gmail.com', label: 'Email' },
                  { icon: MessageCircle, href: 'https://wa.me/256701948579', label: 'WhatsApp' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                    className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-[#0047AB] hover:bg-slate-700 transition-all"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                  );
                })}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
