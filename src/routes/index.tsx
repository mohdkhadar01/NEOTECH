import { createFileRoute } from "@tanstack/react-router";
import Navbar from "@/components/neo/Navbar";
import Hero from "@/components/neo/Hero";
import AboutSection from "@/components/neo/AboutSection";
import ModesSection from "@/components/neo/ModesSection";
import ModeRoadmaps from "@/components/neo/ModeRoadmaps";
import MarketingLab from "@/components/neo/MarketingLab";
import ArchitectureSection from "@/components/neo/ArchitectureSection";
import SimulateSection from "@/components/neo/SimulateSection";
import AgentFactory from "@/components/neo/AgentFactory";
import FAQ from "@/components/neo/FAQ";
import Footer from "@/components/neo/Footer";
import CustomCursor from "@/components/neo/CustomCursor";
import { useSimulation } from "@/hooks/useSimulation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NEO-VERSE — Simulate Your Future" },
      { name: "description", content: "AI-powered decision simulation engine. Spawn agent worlds, branch timelines, and stress-test your startup before launching it." },
      { property: "og:title", content: "NEO-VERSE — Simulate Your Future" },
      { property: "og:description", content: "AI-powered decision simulation engine. Spawn agent worlds, branch timelines, stress-test choices." },
    ],
  }),
  component: Index,
});

function Index() {
  const sim = useSimulation();

  return (
    <div style={{ background: "#FAF7F2" }} className="text-[#1A1714] min-h-screen">
      <CustomCursor />
      <Navbar sim={sim} />
      <main>
        <Hero />
        <AboutSection />
        <ModesSection />
        <ModeRoadmaps />
        <MarketingLab sim={sim} />
        <SimulateSection sim={sim} />
        <ArchitectureSection />
        <AgentFactory sim={sim} />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
