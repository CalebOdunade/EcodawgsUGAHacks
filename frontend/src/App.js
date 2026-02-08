import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/auth";
import Home from "./Home/home";
import CompassPage from "./pages/compass";
import GoToMyLocation from "./pages/GoToMyLocation";
import LearnMorePage from "./pages/learnMore";
import GamePage from "./pages/gamePage";
import "./App.css";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/compass" element={<CompassPage />} />
        <Route path="/mylocation" element={<GoToMyLocation />} />
         <Route path="/game" element={<GamePage />} />
        <Route path="/learn" element={<LearnMorePage />} />
      </Routes>
    </BrowserRouter>
  );
}
