'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mail, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function HeroSection() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetch(`${process.env.BACKEND_URL}/users/profile`, { credentials: 'include' })
      .then(res => {
        console.log(res.status);
        if (res.status === 200) {
          setIsAuthenticated(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000" />
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-2000" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Powered by AI Technology
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Automatische{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Draft-Replies
            </span>{' '}
            met AI
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
            Transformeer je e-mail workflow met intelligente AI-ondersteuning. 
            Genereer professionele conceptantwoorden binnen seconden en verhoog je productiviteit.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {isAuthenticated ? (
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              onClick={() => router.push('/dashboard')}
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Dashboard
            </Button>
          ) : (
            <Button
              disabled={loading}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              onClick={() => window.location.href = `${process.env.BACKEND_URL}/auth/outlook-login`}
            >
              <Mail className="w-5 h-5 mr-2" />
              {loading ? 'Laden...' : 'Login met Outlook'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
                    
          <Button
            variant="outline"
            size="lg"
            className="px-8 py-6 text-lg rounded-full border-2 hover:bg-gray-50 transition-all duration-300"
          >
            Meer informatie
          </Button>
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          {[
            {
              icon: <Sparkles className="w-8 h-8 text-blue-600" />,
              title: 'AI-Powered',
              description: 'Intelligente concepten op basis van context'
            },
            {
              icon: <Mail className="w-8 h-8 text-purple-600" />,
              title: 'Outlook Integratie',
              description: 'Naadloze verbinding met je e-mail'
            },
            {
              icon: <ArrowRight className="w-8 h-8 text-green-600" />,
              title: 'Tijdsbesparing',
              description: 'Tot 80% sneller e-mailen'
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/80 transition-all duration-300 hover:shadow-lg"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}