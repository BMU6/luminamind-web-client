import { BrowserRouter, Routes, Route } from "react-router";
import { RootLayout } from "@/layouts";
import { Home, Login, NotFound, Register } from "@/pages";
import { AuthProvider } from "@/context";
import MedicationList from "@/pages/MedicationList";
import ReportList from "@/pages/ReportList";
import ReportDetails from "@/pages/ReportDetails";
import NewReportForm from "./pages/NewReportForm";
const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="reports/new" element={<NewReportForm />} />
          <Route path="reports" element={<ReportList />} />
          <Route path="reports/:id" element={<ReportDetails />} />
          <Route path="medicationlist" element={<MedicationList />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
