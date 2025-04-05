import { useLocation } from "wouter";

// Since wouter 3.x.x doesn't export useNavigate directly,
// create a custom hook as a wrapper around useLocation
export const useNavigate = () => {
  const [_, navigate] = useLocation();
  return [_, navigate];
};