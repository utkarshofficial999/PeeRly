import React from 'react';

interface LogoProps {
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
    return (
        <div className={`flex items-center ${className}`}>
            <svg
                width="140"
                height="40"
                viewBox="0 0 140 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-auto"
            >
                {/* 'p' with shopping bag icon inside */}
                <path
                    d="M15 12V32"
                    stroke="#0F172A"
                    strokeWidth="6"
                    strokeLinecap="round"
                />
                <path
                    d="M15 18C15 14 19 12 23 12C27 12 31 16 31 22C31 28 27 32 23 32C20 32 18 31 15 28.5"
                    stroke="#0F172A"
                    strokeWidth="6"
                    strokeLinecap="round"
                />
                {/* Shopping bag icon */}
                <rect x="19" y="19" width="8" height="7" rx="1.5" fill="#F97316" />
                <path
                    d="M21 19V17.5C21 16.67 21.67 16 22.5 16V16C23.33 16 24 16.67 24 17.5V19"
                    stroke="#F97316"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                />

                {/* 'oo' or 'ee' styled as loop arrows */}
                {/* First arrow loop */}
                <path
                    d="M50 15C44 15 39 20 39 25C39 30 44 35 50 35"
                    stroke="#F97316"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
                <path d="M53 15L48 12M53 15L48 18" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />

                {/* Second arrow loop interlocking */}
                <path
                    d="M60 35C66 35 71 30 71 25C71 20 66 15 60 15"
                    stroke="#3B82F6"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
                <path d="M57 35L62 32M57 35L62 38" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />

                {/* 'rly' text */}
                <text
                    x="80"
                    y="32"
                    fill="#0F172A"
                    style={{ font: '900 26px "Inter", sans-serif', letterSpacing: '-1.5px' }}
                >
                    rly
                </text>
            </svg>
        </div>
    );
};

export default Logo;
