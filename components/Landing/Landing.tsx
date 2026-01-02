"use client"

import Navbar from "./Navbar";
import Hero from "./Hero";

const Landing = () => {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <Navbar />
        <Hero />
        </div>
    );
}

export default Landing;