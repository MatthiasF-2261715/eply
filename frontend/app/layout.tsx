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
          buttonText="Accepteer cookies"
          declineButtonText="Weiger"
          enableDeclineButton
          style={{ background: "#2B373B" }}
          buttonStyle={{ 
            background: "#4F46E5",
            color: "white",
            fontSize: "13px",
            borderRadius: "4px",
            padding: "8px 16px"
          }}
          expires={150}
        >
          Deze website gebruikt cookies om uw ervaring te verbeteren. We gebruiken de volgende cookies:
          <ul style={{ marginTop: "10px", fontSize: "12px" }}>
            - Essentiële cookies voor het functioneren van de website
            - Sessie cookies voor het bijhouden van uw login status
            - Analytische cookies om het gebruik van onze diensten te verbeteren
          </ul>
          <br />
          <span style={{ fontSize: "12px" }}>
            Door verder te gaan, gaat u akkoord met ons{" "}
            <a href="/privacy-policy" style={{ color: "#4F46E5" }}>
              privacybeleid
            </a>
          </span>
        </CookieConsent>
      </body>
    </html>
  );
}
