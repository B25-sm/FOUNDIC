import React, { useEffect, useState } from 'react';
import { FaCompass, FaDna, FaHandshake, FaLightbulb, FaRocket, FaCoins } from 'react-icons/fa';
import './App.css';
// import logo from './logo.svg'; // Placeholder, replace with your logo file

function App() {
  // WhatsApp community link
  const whatsappLink = "https://chat.whatsapp.com/your-community-link";

  // Typewriter effect for subtitle
  const subtitleText = "Where Authentic Founders & Investors Connect";
  const [displayedSubtitle, setDisplayedSubtitle] = useState('');
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedSubtitle(subtitleText.slice(0, i + 1));
      i++;
      if (i === subtitleText.length) clearInterval(interval);
    }, 32);
    return () => clearInterval(interval);
  }, []);

  // Scroll-triggered animation for features
  const featuresRef = React.useRef<HTMLDivElement>(null);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  useEffect(() => {
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setFeaturesVisible(true);
      },
      { threshold: 0.2 }
    );
    if (featuresRef.current) observer.observe(featuresRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="app-outer">
      {/* Space Scene Background */}
      <div className="space-scene">
        <div className="stars"></div>
        <div className="earth"></div>
        <div className="moon"></div>
        <div className="connection-line"></div>
        <div className="connection-dots"></div>
      </div>
      
      {/* Aurora animated background blobs */}
      <div className="aurora-bg">
        <div className="aurora-blob blob1"></div>
        <div className="aurora-blob blob2"></div>
        <div className="aurora-blob blob3"></div>
        <div className="aurora-blob blob4"></div>
      </div>
      <nav className="thin-navbar">
        <div className="nav-content">
          <a href="#about">About</a>
          <a href="mailto:foundicnetwork@gmail.com">Contact</a>
          <a href="#ideas">Ideas</a>
          <a href="#join">Join Us</a>
        </div>
      </nav>
      <div className="app-container">
        <div className="hero">
          <div className="hero-title pulse">Foundic Network</div>
          <div className="hero-subtitle typewriter">{displayedSubtitle}</div>
        </div>
        {/* SVG Wave Divider */}
        <div className="wave-divider" aria-hidden="true">
          <svg viewBox="0 0 1440 90" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{width: '100%', height: '60px', display: 'block'}}>
            <path d="M0 60 Q 360 0 720 60 T 1440 60 V90 H0V60Z" fill="#23294d"/>
          </svg>
        </div>
        <h2 className="section-heading">Platform Features</h2>
        <div ref={featuresRef} className={`features-glass professional-features scroll-animate ${featuresVisible ? 'visible' : ''}`}>
          <div className="feature-item"><span className="feature-icon"><FaCompass /></span><span><strong>Founder Compass:</strong> Live dashboard showing real founder progress across all stages.</span></div>
          <div className="feature-item"><span className="feature-icon"><FaDna /></span><span><strong>Co-Founder DNA Match:</strong> Match by mindset, work style, and values.</span></div>
          <div className="feature-item"><span className="feature-icon"><FaHandshake /></span><span><strong>Mission Pods:</strong> 60-day co-building missions with value-for-value contributions.</span></div>
          <div className="feature-item"><span className="feature-icon"><FaLightbulb /></span><span><strong>Fail Forward Wall:</strong> Share failures and lessons to help others grow.</span></div>
          <div className="feature-item"><span className="feature-icon"><FaRocket /></span><span><strong>Signal Boost Wall:</strong> Highlight small wins and real action.</span></div>
          <div className="feature-item"><span className="feature-icon"><FaCoins /></span><span><strong>Investor Connect Wall:</strong> Verified investors discover top-performing, trusted builders.</span></div>
        </div>
        <button className="cta-btn" onClick={() => window.open(whatsappLink, '_blank', 'noopener noreferrer')}>Join the Network</button>
      </div>
      <footer className="thin-footer">
        <div className="footer-content">
          &copy; {new Date().getFullYear()} Foundic Network &mdash; Empowering Authentic Founders
        </div>
      </footer>
    </div>
  );
}

export default App;
