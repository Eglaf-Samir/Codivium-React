import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Join from "./pages/Join";
import Legal from "./pages/Legal";
import Faq from "./pages/Faq";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import Articles from "./pages/Articles";
import Article from "./pages/Article";
import ResetPassword from "./pages/ResetPassword";
import ForgetPassword from "./pages/ForgetPassword";
import AdaptivePractice from "./pages/AfterLogin/AdaptivePractice";
import CodiviumInsightsEmbedded from "./pages/AfterLogin/CodiviumInsightsEmbedded";
import MCQ from "./pages/AfterLogin/Mcq";
import Interview from "./pages/AfterLogin/Interview";
import EditorPage from "./pages/AfterLogin/EditorPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/join" element={<Join />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/article" element={<Article />} />
        <Route path="/password_reset" element={<ResetPassword />} />
        <Route path="/forget_Password" element={<ForgetPassword />} />
        <Route path="/adaptive_practice" element={<AdaptivePractice />} />
        <Route path="/insights" element={<CodiviumInsightsEmbedded />} />
        <Route path="/mcq" element={<MCQ />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/editor" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
