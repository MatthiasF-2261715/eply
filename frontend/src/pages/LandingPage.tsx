import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  Shield, 
  CheckCircle, 
  Star, 
  Users, 
  ChevronDown 
} from 'lucide-react';
import { motion, useAnimation, useScroll, useInView } from 'framer-motion';

function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  
  // --- ANIMATION REFS ---
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const testimonialsRef = useRef(null);
  
  const isHeroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const isFeaturesInView = useInView(featuresRef, { once: true });
  const isStatsInView = useInView(statsRef, { once: true });
  const isTestimonialsInView = useInView(testimonialsRef, { once: true });
  
  // --- STATS COUNTERS ---
  const [count1, setCount1] = React.useState(0);
  const [count2, setCount2] = React.useState(0);
  const [count3, setCount3] = React.useState(0);
  
  // Initialize stat counters when stats section comes into view
  useEffect(() => {
    if (isStatsInView) {
      const timer1 = setTimeout(() => setCount1(95), 100);
      const timer2 = setTimeout(() => setCount2(10000), 100);
      const timer3 = setTimeout(() => setCount3(45), 100);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isStatsInView]);

  // --- TESTIMONIAL DATA ---
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      content: "This tool has completely transformed how I handle email. I save at least 2 hours every day!",
      delay: 0.2
    },
    {
      name: "Michael Chen",
      role: "Startup Founder",
      content: "The responses are so accurate that my team couldn't tell I was using AI. Game changer for busy entrepreneurs.",
      delay: 0.4
    },
    {
      name: "Priya Patel",
      role: "Sales Executive",
      content: "I can now respond to 3x more client inquiries. The AI understands context and tone perfectly.",
      delay: 0.6
    }
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-white to-blue-50">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-gray-500 animate-bounce">
        <span className="text-sm mb-2">Scroll to explore</span>
        <ChevronDown size={20} />
      </div>

      {/* Hero Section */}
      <motion.div 
        ref={heroRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: isHeroInView ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10"
      >
        <div className="text-center">
          <motion.h1 
            initial={{ y: -50 }}
            animate={{ y: isHeroInView ? 0 : -50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl"
          >
            <span className="block">Automate Your Email</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-500">Responses with AI</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: isHeroInView ? 0 : 50, opacity: isHeroInView ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl"
          >
            Save hours every day by letting AI handle your email responses. Connect your Gmail account and let our smart assistant draft perfect replies based on your business context.
          </motion.p>
          
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: isHeroInView ? 1 : 0.8, opacity: isHeroInView ? 1 : 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-8 max-w-md mx-auto sm:flex sm:justify-center md:mt-10"
          >
            <div className="rounded-md shadow">
              <button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all md:py-4 md:text-lg md:px-10"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Animated email preview */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: isHeroInView ? 0 : 20, opacity: isHeroInView ? 1 : 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
          className="mt-16 flex justify-center"
        >
          <div className="relative w-full max-w-3xl h-64 bg-white rounded-xl shadow-lg p-4 overflow-hidden border border-gray-100">
            <div className="absolute left-4 top-4 h-3 w-3 rounded-full bg-red-400"></div>
            <div className="absolute left-9 top-4 h-3 w-3 rounded-full bg-yellow-400"></div>
            <div className="absolute left-14 top-4 h-3 w-3 rounded-full bg-green-400"></div>
            
            <div className="mt-5 p-4">
              <div className="bg-gray-100 h-6 w-32 rounded mb-4"></div>
              <div className="bg-gray-100 h-4 w-full rounded mb-3"></div>
              <div className="bg-gray-100 h-4 w-5/6 rounded mb-3"></div>
              <div className="bg-gray-100 h-4 w-4/6 rounded"></div>
              
              <div className="mt-6 flex items-center gap-4">
                <div className="flex-shrink-0">
                  <Mail className="h-10 w-10 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="bg-blue-100 h-6 w-32 rounded mb-2"></div>
                  <div className="bg-blue-100 h-4 w-5/6 rounded mb-2"></div>
                  <div className="bg-blue-100 h-4 w-4/6 rounded"></div>
                </div>
              </div>
              
              <div className="absolute right-8 bottom-8">
                <motion.div 
                  animate={{ 
                    y: [0, -8, 0],
                    rotate: [0, 3, 0]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 4,
                    ease: "easeInOut"
                  }}
                >
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full text-white">
                    <Sparkles size={30} />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <div ref={featuresRef} className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: isFeaturesInView ? 0 : 50, opacity: isFeaturesInView ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Smart Features for <span className="text-blue-600">Busy Professionals</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Our AI-powered tools help you stay on top of your inbox
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {/* AI-Powered Responses */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: isFeaturesInView ? 0 : 50, opacity: isFeaturesInView ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-all transform hover:-translate-y-1"
            >
              <div className="flex justify-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Sparkles className="h-10 w-10 text-blue-600" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900 text-center">AI-Powered Responses</h3>
              <p className="mt-4 text-base text-gray-500 text-center">
                Smart responses generated based on your business context and communication style.
              </p>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Context-aware replies</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Matches your tone</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Multi-language support</span>
                </li>
              </ul>
            </motion.div>

            {/* Time Saving */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: isFeaturesInView ? 0 : 50, opacity: isFeaturesInView ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-all transform hover:-translate-y-1"
            >
              <div className="flex justify-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="h-10 w-10 text-blue-600" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900 text-center">Save Hours Daily</h3>
              <p className="mt-4 text-base text-gray-500 text-center">
                Reduce email response time from hours to minutes with automated drafts.
              </p>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">One-click responses</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Batch processing</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Priority inbox sorting</span>
                </li>
              </ul>
            </motion.div>

            {/* Secure Integration */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: isFeaturesInView ? 0 : 50, opacity: isFeaturesInView ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-all transform hover:-translate-y-1"
            >
              <div className="flex justify-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Shield className="h-10 w-10 text-blue-600" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-medium text-gray-900 text-center">Secure Gmail Integration</h3>
              <p className="mt-4 text-base text-gray-500 text-center">
                Safe and secure integration with your Gmail account using OAuth authentication.
              </p>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">No password storage</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">Data encryption</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-600">GDPR compliant</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div ref={statsRef} className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: isStatsInView ? 1 : 0.9, opacity: isStatsInView ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
          >
            {/* Time Saved Stat */}
            <div className="text-center">
              <div className="text-5xl font-bold text-white">
                {isStatsInView && 
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                  >
                    {count1}%
                  </motion.span>
                }
              </div>
              <p className="mt-2 text-xl text-blue-100">Time Saved</p>
            </div>
            
            {/* Emails Processed Stat */}
            <div className="text-center">
              <div className="text-5xl font-bold text-white">
                {isStatsInView && 
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                  >
                    {count2.toLocaleString()}+
                  </motion.span>
                }
              </div>
              <p className="mt-2 text-xl text-blue-100">Emails Processed</p>
            </div>
            
            {/* Average Savings Stat */}
            <div className="text-center">
              <div className="text-5xl font-bold text-white">
                {isStatsInView && 
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                  >
                    {count3}min
                  </motion.span>
                }
              </div>
              <p className="mt-2 text-xl text-blue-100">Average Daily Savings</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div ref={testimonialsRef} className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: isTestimonialsInView ? 0 : 50, opacity: isTestimonialsInView ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              What Our <span className="text-blue-600">Users Say</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Join thousands of professionals who have transformed their email workflow
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: isTestimonialsInView ? 0 : 50, opacity: isTestimonialsInView ? 1 : 0 }}
                transition={{ duration: 0.8, delay: testimonial.delay }}
                className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-all transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900">{testimonial.name}</h4>
                    <p className="text-blue-600">{testimonial.role}</p>
                  </div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600">{testimonial.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isTestimonialsInView ? 1 : 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="bg-gray-50 py-16 relative z-10"
      >
        <div className="max-w-2xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Ready to transform your email workflow?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Try our AI email assistant risk-free and reclaim hours of your day.
          </p>
          <div className="mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 md:py-4 md:text-lg md:px-10"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default LandingPage;