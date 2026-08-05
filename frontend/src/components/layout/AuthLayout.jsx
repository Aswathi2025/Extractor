import React, { useEffect, useRef } from 'react';

const AuthLayout = ({ children, title, subtitle }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color = Math.random() > 0.5 ? '96, 165, 250' : '167, 139, 250';
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.reset();
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.fill();
      }
    }

    const init = () => {
      resize();
      particles = Array.from({ length: 80 }, () => new Particle());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      animationId = requestAnimationFrame(animate);
    };

    init();
    animate();
    window.addEventListener('resize', () => { resize(); init(); });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="auth-page">
      {/* Animated particle canvas */}
      <canvas ref={canvasRef} className="auth-particles" />

      {/* Glowing background orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      {/* Centered glass card */}
      <div className="auth-glass-card">
        {/* Logo / Icon */}
        <div className="auth-logo-wrap">
          <div className="auth-logo-icon">
            <i className="bi bi-lightning-charge-fill" />
          </div>
          <span className="auth-logo-text">Extractor.</span>
        </div>

        {/* Form heading from props (for pages that still pass title/subtitle) */}
        {(title || subtitle) && (
          <div className="auth-heading">
            {title    && <h1 className="auth-title">{title}</h1>}
            {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          </div>
        )}

        {/* Form content injected here */}
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
