import { useEffect, useRef } from "react";
import "./Hero.css";

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const coinImgRef = useRef<HTMLImageElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const section = heroRef.current;
    const bg = bgRef.current;
    const overlay = overlayRef.current;
    const coinImg = coinImgRef.current;
    if (!section || !bg || !overlay || !coinImg) return;

    let inView = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(section);

    let currentProgress = 0;
    let targetProgress = 0;

    const tick = () => {
      if (inView) {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top;
        const sectionHeight = rect.height;
        const viewportHeight = window.innerHeight;

        const rawProgress =
          (viewportHeight - sectionTop) / (viewportHeight + sectionHeight);
        targetProgress = Math.max(0, Math.min(rawProgress, 1));
      }

      // Lerp for smooth animation
      currentProgress += (targetProgress - currentProgress) * 0.08;

      // Background transforms
      const scale = 1 + currentProgress * 0.15;
      const translateY = currentProgress * -40;
      const brightness = 0.75 + (1 - Math.abs(currentProgress - 0.5)) * 0.4;

      bg.style.transform = `scale(${scale}) translateY(${translateY}px)`;
      bg.style.filter = `brightness(${brightness})`;

      const overlayOpacity = 0.2 + Math.abs(currentProgress - 0.5) * 0.25;
      overlay.style.opacity = String(overlayOpacity);

      // Spin the coin image on scroll
      const spinDeg = currentProgress * 720; // 2 full rotations over full scroll
      coinImg.style.transform = `rotateY(${spinDeg}deg)`;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      io.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section className="coins-hero" ref={heroRef}>
      {/* Animated background — gradient only, no image */}
      <div className="coins-hero-bg" ref={bgRef} />

      {/* Gradient overlay */}
      <div className="coins-hero-overlay" ref={overlayRef} />

      {/* Centred title */}
      <div className="coins-hero-title">
        <h1>Cryptonite</h1>
        <p>Track · Analyse · Invest</p>
      </div>

      {/* The DigitalCoins.png image — visible and spinning on scroll */}
      <div className="hero-coin-showcase">
        <img
          ref={coinImgRef}
          src="/DigitalCoins.png"
          alt="Digital Coins"
          className="hero-coin-img"
        />
      </div>
    </section>
  );
}

