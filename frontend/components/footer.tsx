'use client';

import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-3 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-xs sm:text-sm md:text-base">
          <span className="text-orange-400 font-semibold">Gemini 3 Hackathon</span> |{' '}
          <span className="text-blue-300">Developed, Designed and Submitted by Owais Qazi</span> |{' '}
          <span className="text-green-300">Phone: +92-335-3221003</span> |{' '}
          <span className="text-yellow-300">Email: osqazi@gmail.com</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;