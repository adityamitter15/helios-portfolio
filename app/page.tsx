import { Craft } from "@/components/craft";
import { Dock } from "@/components/dock";
import { Faq } from "@/components/faq";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Manifesto } from "@/components/manifesto";
import { Nav } from "@/components/nav";
import { Offer } from "@/components/offer";
import { Process } from "@/components/process";
import { Proof } from "@/components/proof";
import { Work } from "@/components/work";

export default function Home() {
  return (
    <>
      <Nav />

      <main id="main" className="flex flex-1 flex-col pb-20 sm:pb-0">
        <Hero />
        <Proof />
        <Manifesto />
        <Work />
        <Craft />
        <Process />
        <Offer />
        <Faq />
      </main>

      <Footer />
      <Dock />
    </>
  );
}
