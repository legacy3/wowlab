"use client";

import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", paddingTop: "4rem" }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ display: "inline-block", marginBottom: "1rem" }}
        >
          <Sparkles size={48} />
        </motion.div>
        <h1>Hello World</h1>
        <p>Welcome to portal-new</p>
      </motion.div>
    </main>
  );
}
