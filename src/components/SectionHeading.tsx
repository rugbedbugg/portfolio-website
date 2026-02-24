import { motion } from "framer-motion";

const SectionHeading = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => (
  <motion.h2
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
    className="text-accent font-bold text-sm mb-2"
  >
    {children}
  </motion.h2>
);

export default SectionHeading;
