import React from 'react';
import './Footer.css';
import { FiGithub, FiMail, FiTwitter } from 'react-icons/fi';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-left">
          <h2 className="footer-logo">CS:MARKET GLASSES</h2>
          <p className="footer-email">suporte@csmarketglasses.com</p>
          <p className="footer-tagline">© {new Date().getFullYear()} — Todos os direitos reservados.</p>
        </div>

        <div className="footer-right">
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="social-icon"><FiGithub /></a>
          <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="social-icon"><FiTwitter /></a>
          <a href="mailto:suporte@csmarketglasses.com" className="social-icon"><FiMail /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
