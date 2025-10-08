'use client';

import React from 'react';
import Navbar from '../components/Navbar';
import './globals.css';
import { ToastContainer } from "@/components/ui/toast-container"
import CookieConsent from "react-cookie-consent";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-white">
          <Navbar />
          <main>{children}</main>
        </div>
        <ToastContainer />
        <CookieConsent
          location="bottom"
          buttonText="Accepteer alle cookies"
          declineButtonText="Alleen essentiële"
          enableDeclineButton
          style={{ 
            background: "#3B82F6",
            width: "100%",
            margin: "0",
            padding: "16px",
            position: "fixed",
            bottom: "0",
            left: "0",
            zIndex: "999",
          }}
          buttonStyle={{ 
            background: "white",
            color: "#3B82F6",
            fontSize: "14px",
            fontWeight: "500",
            borderRadius: "8px",
            padding: "12px 24px",
            border: "none",
            cursor: "pointer",
          }}
          declineButtonStyle={{
            background: "transparent",
            border: "1px solid white",
            color: "white",
            fontSize: "14px",
            fontWeight: "500",
            borderRadius: "8px",
            padding: "12px 24px",
            marginRight: "12px",
            cursor: "pointer",
          }}
          contentStyle={{
            color: "white",
            flex: "1",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">
              We waarderen uw privacy
            </h3>
            <p className="text-sm text-white/90">
              We gebruiken cookies om uw ervaring te verbeteren en onze diensten te optimaliseren.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-white/90">Essentiële cookies voor functionaliteit</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-white/90">Sessie cookies voor login status</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-white/90">Analytische cookies voor verbetering</span>
              </div>
            </div>
            <p className="text-xs text-white/80">
              Door verder te gaan, gaat u akkoord met ons{" "}
              <a href="/privacy-policy" className="text-white hover:text-white/90 underline">
                privacybeleid
              </a>
            </p>
          </div>
        </CookieConsent>
      </body>
    </html>
  );
}