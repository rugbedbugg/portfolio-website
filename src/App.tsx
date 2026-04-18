import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import AmbientBackground from "./components/AmbientBackground";
import { TransmissionProvider } from "./components/Transmission";
import Terminal from "./components/Terminal";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const App = () => (
  <MotionConfig reducedMotion="user">
    <AmbientBackground />
    <TransmissionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Terminal />
    </TransmissionProvider>
  </MotionConfig>
);

export default App;
