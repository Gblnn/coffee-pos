import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Back() {
  const navigate = useNavigate();
  return (
    <div style={{ cursor: "pointer" }} onClick={() => navigate(-1)}>
      <ChevronLeft />
    </div>
  );
}
