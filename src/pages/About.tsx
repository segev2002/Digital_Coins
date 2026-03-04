import "./About.css";

export default function About() {
  return (
    <div className="about-page">
      <img src="/Yoni.jpg" alt="Yoni Segev" className="about-photo" />
      <h2>Yoni Segev</h2>
      <p>Full-Stack Developer &amp; Crypto Enthusiast</p>

      <div className="about-card">
        <h3>About Cryptonite</h3>
        <p>
          Cryptonite is a single-page application that lets you browse the top
          100 cryptocurrencies, view real-time price reports, and get
          AI-powered buy/sell recommendations. Built with React, TypeScript,
          Redux Toolkit, and the CoinGecko &amp; CryptoCompare APIs.
        </p>
      </div>

      <div className="about-card">
        <h3>About Me</h3>
        <p>
          Hi! I'm Jonathan Segev. Im passionate about web development and want 
          to be a full stack developer. This project was built as part of my studies at John Bryce.
          I hope you find it useful and enjoyable! 
        </p>
      </div>
    </div>
  );
}
