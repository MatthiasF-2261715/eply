'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-6 transform -translate-x-1/2 z-50 w-full"
    >
      <div className="mx-auto max-w-2xl bg-white/20 backdrop-blur-lg border border-white/20 rounded-full px-8 py-4 shadow-lg w-full">
        <div className="flex items-center justify-between w-full">
          <span className="font-bold text-lg text-blue-700">Eply</span>
          <div className="flex items-center space-x-8 ml-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:bg-white/20',
                  pathname === item.href
                    ? 'text-blue-600 bg-white/30'
                    : 'text-gray-700 hover:text-blue-600'
                )}
              >
                {pathname === item.href && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/30 rounded-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}